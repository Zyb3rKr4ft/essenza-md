const fs = require('fs');
const os = require('os');

module.exports = {
    name: 'menu',
    category: 'general',
    aliases: ['help', 'h'],
    async execute(sock, msg, args, ctx) {
        const cats = {};
        const seen = new Set();
        for (const p of ctx.commands.values()) {
            if (seen.has(p.name)) continue;
            seen.add(p.name);
            const c = p.category || 'general';
            if (!cats[c]) cats[c] = [];
            cats[c].push(p);
        }
        const up = Math.floor(ctx.uptime / 1000);
        const d = Math.floor(up / 86400);
        const h = Math.floor((up % 86400) / 3600);
        const m = Math.floor((up % 3600) / 60);
        const s = up % 60;
        
        const memUsed = (ctx.memory / 1024 / 1024).toFixed(1);
        const memTotal = (os.totalmem() / 1024 / 1024).toFixed(0);

        let tier = 'user';
        if (ctx.isOwner) tier = 'owner';
        else if (ctx.isSuperSudo) tier = 'super-sudo';
        else if (ctx.isSudo) tier = 'sudo';

        let out = '╭━━━〔 ⚡ ' + ctx.config.botName + ' 〕━━━┈⊷\n';
        out += '┃ 👑 Owner: ' + (ctx.config.ownerName || 'Owner') + '\n';
        out += '┃ ⚙️ Prefix: ' + ctx.prefix + '\n';
        out += '┃ 🔒 Mode: ' + ctx.settings.mode + '\n';
        out += '┃ 🔑 Tier: ' + tier + '\n';
        out += '┃ 🕒 Uptime: ' + d + 'd ' + h + 'h ' + m + 'm ' + s + 's\n';
        out += '┃ 💾 Memory: ' + memUsed + ' / ' + memTotal + ' MB\n';
        out += '┃ 📊 Commands: ' + ctx.commandCount + '\n';
        out += '┃ 📅 ' + new Date().toLocaleString() + '\n';
        out += '╰━━━━━━━━━━━━━━━┈⊷\n';

        const icons = { general: '🛠', group: '👥', security: '🛡', media: '🎨', tools: '🧰', downloads: '📥', fun: '🎮', ai: '🤖' };
        for (const c of Object.keys(cats).sort()) {
            out += '\n╭──〔 ' + (icons[c] || '📦') + ' *' + c.charAt(0).toUpperCase() + c.slice(1) + '* 〕\n';
            for (const p of cats[c]) {
                const desc = p.description ? ' — ' + p.description : '';
                out += '┃ ▸ ' + ctx.prefix + p.name + desc + '\n';
            }
            out += '╰────────────┈⊷\n';
        }

        out += '\n╭━━━━━━━━━━━━━━━┈⊷\n';
        out += '┃ ⚡ ' + ctx.config.botName + ' · Active\n';
        if (ctx.config.channelLink) {
            out += '┃ 📢 ' + ctx.config.channelLink + '\n';
        }
        out += '┃ _Powered by *ZyberDevPriest*_\n';
        out += '╰━━━━━━━━━━━━━━━┈⊷';

        const img = ctx.settings.menuImage;
        
        // Check if it's a URL or a local file
        if (img && img.startsWith('http')) {
            await sock.sendMessage(ctx.sender, { image: { url: img }, caption: out });
        } else if (img && fs.existsSync(img)) {
            await sock.sendMessage(ctx.sender, { image: fs.readFileSync(img), caption: out });
        } else {
            await sock.sendMessage(ctx.sender, { text: out });
        }
    }
};
