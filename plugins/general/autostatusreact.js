module.exports = {
    name: 'autostatusreact',
    category: 'general',
    ownerOnly: true,
    aliases: ['asr'],
    async execute(sock, msg, args, ctx) {
        const cfg = ctx.settings.status.autoReact;
        const a = (args[0] || '').toLowerCase();
        if (!a || a === 'status') {
            return sock.sendMessage(ctx.sender, { text: '💯 AutoReact: ' + (cfg.enabled ? 'ON' : 'OFF') + '\nMode: ' + cfg.mode + '\nEmoji: ' + (cfg.emojiPool || []).join(' ') + '\n\nUsage:\n' + ctx.prefix + 'autostatusreact <on|off>\n' + ctx.prefix + 'autostatusreact instant\n' + ctx.prefix + 'autostatusreact fixed <sec>\n' + ctx.prefix + 'autostatusreact random <minSec> <maxSec>\n' + ctx.prefix + 'autostatusreact emoji 🔥,❤️,👍' });
        }
        if (a === 'on') { cfg.enabled = true; ctx.saveSettings(); return sock.sendMessage(ctx.sender, { text: '💯 AutoReact: *ON* (' + cfg.mode + ')' }); }
        if (a === 'off') { cfg.enabled = false; ctx.saveSettings(); return sock.sendMessage(ctx.sender, { text: '💯 AutoReact: *OFF*' }); }
        if (a === 'instant') { cfg.mode = 'instant'; cfg.enabled = true; ctx.saveSettings(); return sock.sendMessage(ctx.sender, { text: '💯 Mode: *instant*' }); }
        if (a === 'fixed') {
            const s = parseInt(args[1]); if (!s) return sock.sendMessage(ctx.sender, { text: 'Give seconds.' });
            cfg.mode = 'fixed'; cfg.fixedDelayMs = s * 1000; cfg.enabled = true; ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '💯 Mode: *fixed ' + s + 's*' });
        }
        if (a === 'random') {
            const mn = parseInt(args[1]), mx = parseInt(args[2]);
            if (!mn || !mx || mn >= mx) return sock.sendMessage(ctx.sender, { text: 'Usage: random <minSec> <maxSec>' });
            cfg.mode = 'random'; cfg.randomMinMs = mn * 1000; cfg.randomMaxMs = mx * 1000; cfg.enabled = true; ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '💯 Mode: *random ' + mn + '-' + mx + 's*' });
        }
        if (a === 'emoji') {
            const raw = args.slice(1).join(' ');
            const list = raw.split(/[,\s]+/).filter(Boolean);
            if (!list.length) return sock.sendMessage(ctx.sender, { text: 'Usage: emoji 🔥,❤️,👍' });
            cfg.emojiPool = list; ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '💯 Emoji pool: ' + list.join(' ') });
        }
        await sock.sendMessage(ctx.sender, { text: 'Unknown option.' });
    }
};
