const baileys = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const config = require('./config');
const settingsLib = require('./lib/settings');
const { runGuards } = require('./lib/guards');
const { handleStatus } = require('./lib/status');

let settings = settingsLib.load();
let commands = new Map();
let isReconnecting = false;
let schedulerInterval = null;

const pluginsDir = path.join(__dirname, 'plugins');
if (fs.existsSync(pluginsDir)) {
    for (const category of fs.readdirSync(pluginsDir)) {
        const catPath = path.join(pluginsDir, category);
        if (!fs.statSync(catPath).isDirectory()) continue;
        for (const file of fs.readdirSync(catPath)) {
            if (!file.endsWith('.js')) continue;
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
    const { state, saveCreds } = await baileys.useMultiFileAuthState(config.sessionPath);

    const sock = baileys.makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: baileys.Browsers.ubuntu('Chrome'),
        retryRequestDelayMs: 2000,
        maxMsgRetryCount: 3,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
    });

    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question('Enter WhatsApp number: ', async (input) => {
            rl.close();
            const num = input.trim().replace(/[^0-9]/g, '');
            try {
                await new Promise(r => setTimeout(r, 3000));
                const code = await sock.requestPairingCode(num);
                console.log('\nPAIRING CODE: ' + code + '\n');
            } catch (e) { console.error('Pairing failed:', e.message); process.exit(1); }
        });
    }

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

        const defaultMsg = action === 'add'
            ? 'Welcome {user} to {group}! 👋'
            : 'Goodbye {user}! 👋';

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
                    await sock.sendMessage(id, {
                        image: { url: ppUrl },
                        caption: msgText,
                        mentions: [jid]
                    });
                } else {
                    await sock.sendMessage(id, {
                        text: msgText,
                        mentions: [jid]
                    });
                }
            } catch (e) {
                console.error('Welcome/goodbye send error:', e.message);
            }
        }
    } catch (e) {
        console.error('group-participants handler error:', e.message);
    }
});

// ─── Group lock/unlock scheduler ───
if (schedulerInterval) clearInterval(schedulerInterval);
schedulerInterval = setInterval(async () => {
    try {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const currentTime = hh + ':' + mm;
        const today = now.toISOString().split('T')[0];
        let changed = false;

        for (const jid of Object.keys(settings.groups || {})) {
            const gs = settings.groups[jid];
            const sch = gs.lockSchedule;
            if (!sch) continue;

            if (sch.lockAt === currentTime && sch.lastLock !== today) {
                try {
                    await sock.groupSettingUpdate(jid, 'announcement');
                    sch.lastLock = today;
                    changed = true;
                    console.log('Auto-locked: ' + jid);
                } catch (e) {
                    console.error('Lock failed (' + jid + '):', e.message);
                }
            }

            if (sch.unlockAt === currentTime && sch.lastUnlock !== today) {
                try {
                    await sock.groupSettingUpdate(jid, 'not_announcement');
                    sch.lastUnlock = today;
                    changed = true;
                    console.log('Auto-unlocked: ' + jid);
                } catch (e) {
                    console.error('Unlock failed (' + jid + '):', e.message);
                }
            }
        }

        if (changed) settingsLib.save(settings);
    } catch (e) {
        console.error('Scheduler error:', e.message);
    }
}, 30000);

    sock.ev.on('connection.update', (u) => {
        const { connection, lastDisconnect } = u;
        if (connection === 'open') {
            console.log('Essenza MD connected. Mode: ' + settings.mode + ' | Prefix: ' + settings.prefix);
            isReconnecting = false;
        }
        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            if (code === baileys.DisconnectReason.loggedOut) { console.log('Logged out.'); process.exit(0); }
            if (code === baileys.DisconnectReason.restartRequired) {
                if (!isReconnecting) { isReconnecting = true; startEssenza(); }
                return;
            }
            console.log('Connection closed. Reason:', code);
            process.exit(0);
        }
    });

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
        const isSelfChat = msg.key.fromMe && (senderNumber === botNumber || senderNumber === botLid);
        const isIncoming = !msg.key.fromMe;
        if (!isIncoming && !isSelfChat) return;

        const participant = isGroup ? (msg.key.participant || '') : '';
        const participantNumber = getNumber(participant);
        const realSender = isSelfChat ? botNumber : (isGroup ? participantNumber : senderNumber);
        const ownerList = [String(config.ownerNumber), botNumber].filter(Boolean);
        const superSudoList = (settings.superSudo || []).map(String);
        const sudoList = (settings.sudo || []).map(String);
        const isOwner = isSelfChat || ownerList.includes(realSender);
        const isSuperSudo = isOwner || superSudoList.includes(realSender);
        const isSudo = isSuperSudo || sudoList.includes(realSender);

        const text = msg.message.conversation ||
                     msg.message.extendedTextMessage?.text ||
                     msg.message.imageMessage?.caption ||
                     msg.message.videoMessage?.caption || '';

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
            prefix: settings.prefix || config.prefix,
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
        try {
            await sock.sendMessage(sender, { text: baseMsg + '\n\n⏱ Away for: ' + dur });
        } catch (e) {}
        return;
    }
}

        if (isIncoming || isGroup) {
            const g = await runGuards(sock, msg, ctx);
            if (g.blocked) return;
        }

        if (!text.startsWith(ctx.prefix)) return;
        const args = text.slice(ctx.prefix.length).trim().split(/\s+/);
        const commandName = (args.shift() || '').toLowerCase();
        const plugin = commands.get(commandName);
        if (!plugin) return;

        await react(sock, msg, '⚡');

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

if (!isSudo) {
    if (settings.mode === 'private') { await react(sock, msg, '🔒'); return; }
    if (settings.mode === 'group' && !isGroup) {
        await react(sock, msg, '❌');
        return sock.sendMessage(sender, { text: 'Bot is in group-only mode.' });
    }
}

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

startEssenza().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
