const baileys = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const http = require('http');
const config = require('./config');
const settingsLib = require('./lib/settings');
const { runGuards } = require('./lib/guards');
const githubSession = require('./lib/github-session');
const { handleStatus } = require('./lib/status');

// Load Settings
let settings = settingsLib.load();

// Ensure prefixes array exists
if (!Array.isArray(settings.prefixes)) {
    settings.prefixes = [settings.prefix || config.prefix];
}

let commands = new Map();
let isReconnecting = false;
let schedulerInterval = null;

// Load Plugins
const pluginsDir = path.join(__dirname, 'plugins');
if (fs.existsSync(pluginsDir)) {
    for (const category of fs.readdirSync(pluginsDir)) {
        const catPath = path.join(pluginsDir, category);
        if (!fs.statSync(catPath).isDirectory()) continue;
        for (const file of fs.readdirSync(catPath)) {
            if (!file.endsWith('.js') || file.startsWith('_')) continue;
            try {
                const plugin = require(path.join(catPath, file));
                if (plugin.name && typeof plugin.execute === 'function') {
                    commands.set(plugin.name, plugin);
                    if (Array.isArray(plugin.aliases)) {
                        for (const a of plugin.aliases) commands.set(a, plugin);
                    }
                }
            } catch (e) { console.error('Failed to load ' + file + ':', e.message); }
        }
    }
}
console.log('Loaded ' + commands.size + ' command entries.');

function getNumber(jid) {
    return String(jid || '').match(/^(\d+)/)?.[1] || '';
}

async function react(sock, msg, emoji) {
    try {
        await sock.sendMessage(msg.key.remoteJid, { react: { text: emoji, key: msg.key } });
    } catch (e) {}
}

async function startEssenza() {
    // Restore session from GitHub if local folder is empty
    await githubSession.restoreIfNeeded(config.sessionPath);

    const { state, saveCreds } = await baileys.useMultiFileAuthState(config.sessionPath);

    const sock = baileys.makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: baileys.Browsers.ubuntu('Chrome'),
        retryRequestDelayMs: 2000,
        maxMsgRetryCount: 3,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 120000, // Increased to 2 minutes for large media uploads
    });

    sock.ev.on('creds.update', async () => {
        await saveCreds();
        githubSession.pushSession(config.sessionPath);
    });

    // Pairing Code Logic
    if (!sock.authState.creds.registered) {
        const envNumber = (process.env.PAIRING_NUMBER || config.botNumber || '').replace(/[^0-9]/g, '');
        const requestCode = async (num) => {
            if (!num) { console.error('No pairing number available.'); return; }
            try {
                await new Promise(r => setTimeout(r, 3000));
                const code = await sock.requestPairingCode(num);
                console.log('\n========================================');
                console.log('PAIRING CODE: ' + code);
                console.log('Number: +' + num);
                console.log('========================================\n');
            } catch (e) { console.error('Pairing failed:', e.message); }
        };

        if (envNumber) {
            requestCode(envNumber);
        } else {
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            rl.question('Enter WhatsApp number: ', (input) => {
                rl.close();
                requestCode(input.trim().replace(/[^0-9]/g, ''));
            });
        }
    }

    // Anti-Call
    sock.ev.on('call', async (calls) => {
        if (!settings.anticall) return;
        for (const c of calls) {
            if (c.status === 'offer') {
                try { await sock.rejectCall(c.id, c.from); } catch (e) {}
            }
        }
    });

    // Welcome / Goodbye
    sock.ev.on('group-participants.update', async (event) => {
        try {
            const { id, participants, action } = event;
            if (!id.endsWith('@g.us')) return;
            const gs = settingsLib.getGroup(settings, id);
            settingsLib.save(settings);
            if (action !== 'add' && action !== 'remove') return;
            const cfg = action === 'add' ? gs.welcome : gs.goodbye;
            if (!cfg || !cfg.enabled) return;
            let metadata;
            try { metadata = await sock.groupMetadata(id); } catch (e) { return; }

            const defaultMsg = action === 'add' ? 'Welcome {user} to {group}! 👋' : 'Goodbye {user}! 👋';
            for (const jid of participants) {
                try {
                    const num = String(jid).match(/^(\d+)/)?.[1] || '';
                    let ppUrl = null;
                    try { ppUrl = await sock.profilePictureUrl(jid, 'image'); } catch (e) {}
                    const msgText = (cfg.message || defaultMsg)
                        .replace(/{user}/g, '@' + num)
                        .replace(/{group}/g, metadata.subject)
                        .replace(/{count}/g, String(metadata.participants.length));

                    if (ppUrl) {
                        await sock.sendMessage(id, { image: { url: ppUrl }, caption: msgText, mentions: [jid] });
                    } else {
                        await sock.sendMessage(id, { text: msgText, mentions: [jid] });
                    }
                } catch (e) {}
            }
        } catch (e) {}
    });

    // Scheduler (Group Lock/Unlock)
    if (schedulerInterval) clearInterval(schedulerInterval);
    schedulerInterval = setInterval(async () => {
        try {
            const now = new Date();
            const currentTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
            const today = now.toISOString().split('T')[0];
            let changed = false;

            for (const jid of Object.keys(settings.groups || {})) {
                const gs = settings.groups[jid];
                const sch = gs.lockSchedule;
                if (!sch) continue;

                if (sch.lockAt === currentTime && sch.lastLock !== today) {
                    try { await sock.groupSettingUpdate(jid, 'announcement'); sch.lastLock = today; changed = true; } catch (e) {}
                }
                if (sch.unlockAt === currentTime && sch.lastUnlock !== today) {
                    try { await sock.groupSettingUpdate(jid, 'not_announcement'); sch.unlockAt = today; changed = true; } catch (e) {}
                }
            }
            if (changed) settingsLib.save(settings);
        } catch (e) {}
    }, 30000);

    // Connection Update
    sock.ev.on('connection.update', async (u) => {
        const { connection, lastDisconnect } = u;
        if (connection === 'open') {
            console.log('Essenza MD connected. Mode: ' + settings.mode + ' | Prefix: ' + settings.prefixes.join(' '));
            isReconnecting = false;
             // Trigger the notification
        await sendReconnectNotification(sock, settings, config);
        }
        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
         if (code === baileys.DisconnectReason.loggedOut) { console.log('Logged out.'); process.exit(0); }
          if (code === 428) {
        console.log('Connection dropped (428). Reconnecting in 5 seconds...');
        setTimeout(startEssenza, 5000);
          return;
       }
            if (code === baileys.DisconnectReason.restartRequired) {
                if (!isReconnecting) { isReconnecting = true; startEssenza(); }
                return;
            }
            console.log('Connection closed. Reason:', code);
            process.exit(0);
        }
    });

    // Message Handler
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message) return;

        if (msg.key.remoteJid === 'status@broadcast') {
            await handleStatus(sock, msg, settings, () => settingsLib.save(settings));
            return;
        }

        const sender = msg.key.remoteJid || '';
        const senderNumber = getNumber(sender);
        const botNumber = getNumber(sock.user?.id);
        const botLid = getNumber(sock.user?.lid);
        const isGroup = sender.endsWith('@g.us');
        
        // LID Resolution (Fixes super-sudo on newer WhatsApp updates)
        const senderPnNumber = getNumber(msg.key.senderPn || msg.key.remoteJidAlt || '');
        const participantPnNumber = getNumber(msg.key.participantPn || msg.key.participantAlt || '');
        
        const isSelfChat = msg.key.fromMe && (senderNumber === botNumber || senderNumber === botLid);
        const isIncoming = !msg.key.fromMe;

        const text = msg.message.conversation ||
                     msg.message.extendedTextMessage?.text ||
                     msg.message.imageMessage?.caption ||
                     msg.message.videoMessage?.caption || '';

        // Multi-Prefix detection
        const activePrefixes = Array.isArray(settings.prefixes) ? settings.prefixes : [settings.prefix || config.prefix];
        const usedPrefix = activePrefixes.find(p => text.startsWith(p));
        const isPersonalCommand = config.botType === 'personal' && msg.key.fromMe && usedPrefix;

        if (!isIncoming && !isSelfChat && !isPersonalCommand) return;

        const participant = isGroup ? (msg.key.participant || '') : '';
        const participantNumber = getNumber(participant);
        
        const realSender = isSelfChat
            ? botNumber
            : (isGroup
                ? (participantPnNumber || participantNumber)
                : (senderPnNumber || senderNumber));

const ownerList = [String(config.ownerNumber), botNumber].filter(Boolean);
const superSudoList = (settings.superSudo || []).map(String);
const sudoList = (settings.sudo || []).map(String);

const isBotOwner = isSelfChat || isPersonalCommand || ownerList.includes(realSender);
const isSuperSudo = isBotOwner || superSudoList.includes(realSender);

// Super-sudo now has owner-level power
const isOwner = isSuperSudo; 
const isSudo = isSuperSudo || sudoList.includes(realSender);
        let groupMetadata = null;
        let isAdmin = false;
        if (isGroup) {
            try {
                groupMetadata = await sock.groupMetadata(sender);
                const me = groupMetadata.participants.find(p =>
                    getNumber(p.id) === realSender || getNumber(p.lid || '') === realSender
                );
                isAdmin = !!(me && (me.admin === 'admin' || me.admin === 'superadmin'));
            } catch (e) {}
        }

        const groupSettings = isGroup ? settingsLib.getGroup(settings, sender) : {};
        settingsLib.save(settings);

        const ctx = {
            config, settings,
            saveSettings: () => settingsLib.save(settings),
            prefix: usedPrefix || activePrefixes[0],
            commands,
            isOwner, isGroup, isSelfChat, isAdmin, isSuperSudo, isSudo,
            sender, realSender, participantNumber,
            botNumber, botLid,
            groupMetadata, groupSettings,
            text,
            uptime: process.uptime() * 1000,
            memory: process.memoryUsage().heapUsed,
            version: config.version || '1.0.0',
            commandCount: commands.size,
            startTime: Date.now(),
        };

        // AFK Auto-reply
        if (!isGroup && isIncoming && settings.afk?.enabled && !isSudo) {
            if (!Array.isArray(settings.afk.replied)) settings.afk.replied = [];
            if (!settings.afk.replied.includes(realSender)) {
                settings.afk.replied.push(realSender);
                settingsLib.save(settings);
                const mins = Math.floor((Date.now() - (settings.afk.since || Date.now())) / 60000);
                const h = Math.floor(mins / 60);
                const m = mins % 60;
                const dur = h > 0 ? (h + 'h ' + m + 'm') : (m + 'm');
                const baseMsg = settings.afk.message || '💤 I\'m away right now. I\'ll reply when I\'m back.';
                try { await sock.sendMessage(sender, { text: baseMsg + '\n\n⏱ Away for: ' + dur }); } catch (e) {}
                return;
            }
        }

        // Guards
        if (isIncoming || isGroup) {
            const g = await runGuards(sock, msg, ctx);
            if (g.blocked) return;
        }

        // Command Parser
        if (!usedPrefix) return;
        const args = text.slice(usedPrefix.length).trim().split(/\s+/);
        const commandName = (args.shift() || '').toLowerCase();
        const plugin = commands.get(commandName);
        if (!plugin) return;

        await react(sock, msg, '⚡');

        // Permissions Check
        if (plugin.ownerOnly && !isOwner) {
            await react(sock, msg, '🔒');
            return sock.sendMessage(sender, { text: 'Owner only.' });
        }
        if (plugin.superSudoOnly && !isSuperSudo) {
            await react(sock, msg, '🔒');
            return sock.sendMessage(sender, { text: 'Super-sudo only.' });
        }
        if (plugin.sudoOnly && !isSudo) {
            await react(sock, msg, '🔒');
            return sock.sendMessage(sender, { text: 'Sudo only.' });
        }
        if (plugin.groupOnly && !isGroup) {
            await react(sock, msg, '❌');
            return sock.sendMessage(sender, { text: 'Group only.' });
        }
        if (plugin.adminOnly && !isAdmin && !isSuperSudo) {
            await react(sock, msg, '🔒');
            return sock.sendMessage(sender, { text: 'Admin only.' });
        }

        // Mode Enforcement
        if (!isSudo) {
            if (settings.mode === 'private') { await react(sock, msg, '🔒'); return; }
            if (settings.mode === 'group' && !isGroup) {
                await react(sock, msg, '❌');
                return sock.sendMessage(sender, { text: 'Bot is in group-only mode.' });
            }
        }

        // Execute
        try {
            await plugin.execute(sock, msg, args, ctx);
            await react(sock, msg, '💯');
        } catch (err) {
            console.error('Plugin error (' + plugin.name + '):', err.message);
            await react(sock, msg, '❌');
            await sock.sendMessage(sender, { text: 'Error: ' + err.message });
        }
    });
}

// Health Server (For PaaS like Pxxl)
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        status: 'ok',
        bot: config.botName,
        version: config.version,
        uptime: Math.floor(process.uptime())
    }));
}).listen(PORT, () => {
    console.log('Health server on port ' + PORT);
});

// Prevent crashes from unhandled Baileys socket errors during media uploads
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

async function sendReconnectNotification(sock, settings, config) {
    const targetJids = new Set();
    
    // Add Owner
    if (config.ownerNumber) targetJids.add(`${config.ownerNumber}@s.whatsapp.net`);
    
    // Add Super-Sudo and Sudo users
    for (const num of [...(settings.superSudo || []), ...(settings.sudo || [])]) {
        targetJids.add(`${num}@s.whatsapp.net`);
    }

    const uptime = Math.floor(process.uptime());
    const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    const prefix = settings.prefixes ? settings.prefixes[0] : '.';
    
    const text = `🤖 *Essenza MD is Back Online!*\n\n` +
                 `🕒 *Uptime:* ${uptime} seconds\n` +
                 `💾 *RAM:* ${mem} MB\n` +
                 `⚙️ *Mode:* ${settings.mode}\n` +
                 `🔤 *Prefix:* ${settings.prefixes.join(' ')}\n\n` +
                 `Select an option below:`;

    // We use Baileys' built-in buttons
    const buttons = [
        { buttonId: `${prefix}ping`, buttonText: { displayText: '🏓 Ping' }, type: 1 },
        { buttonId: `${prefix}owner`, buttonText: { displayText: '👤 Owner' }, type: 1 },
        { buttonId: `${prefix}menu`, buttonText: { displayText: '📋 Menu' }, type: 1 }
    ];

    for (const jid of targetJids) {
        try {
            await sock.sendMessage(jid, { 
                text: text,
                footer: '*⚡ FAST • STABLE • POWERFUL*\n | _ Powered by @ZyberDevPriest™_',
                buttons: buttons,
                headerType: 1
            });
            console.log(`✅ Reconnect notification sent to ${jid}`);
        } catch (e) {
            console.error(`❌ Failed to send buttons to ${jid}:`, e.message);
            // Fallback: Send plain text if buttons fail
            await sock.sendMessage(jid, { text: text });
        }
    }
}
startEssenza().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
