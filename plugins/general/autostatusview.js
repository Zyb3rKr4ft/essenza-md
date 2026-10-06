module.exports = {
    name: 'autostatusview',
    category: 'general',
    ownerOnly: true,
    aliases: ['asv'],
    async execute(sock, msg, args, ctx) {
        const cfg = ctx.settings.status.autoView;
        const a = (args[0] || '').toLowerCase();
        if (!a || a === 'status') {
            return sock.sendMessage(ctx.sender, { text: '👁 AutoView: ' + (cfg.enabled ? 'ON' : 'OFF') + '\nMode: ' + cfg.mode + '\n\nUsage:\n' + ctx.prefix + 'autostatusview <on|off>\n' + ctx.prefix + 'autostatusview instant\n' + ctx.prefix + 'autostatusview fixed <sec>\n' + ctx.prefix + 'autostatusview random <minSec> <maxSec>' });
        }
        if (a === 'on') { cfg.enabled = true; ctx.saveSettings(); return sock.sendMessage(ctx.sender, { text: '👁 AutoView: *ON* (' + cfg.mode + ')' }); }
        if (a === 'off') { cfg.enabled = false; ctx.saveSettings(); return sock.sendMessage(ctx.sender, { text: '👁 AutoView: *OFF*' }); }
        if (a === 'instant') { cfg.mode = 'instant'; cfg.enabled = true; ctx.saveSettings(); return sock.sendMessage(ctx.sender, { text: '👁 Mode: *instant*' }); }
        if (a === 'fixed') {
            const s = parseInt(args[1]); if (!s) return sock.sendMessage(ctx.sender, { text: 'Give seconds.' });
            cfg.mode = 'fixed'; cfg.fixedDelayMs = s * 1000; cfg.enabled = true; ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '👁 Mode: *fixed ' + s + 's*' });
        }
        if (a === 'random') {
            const mn = parseInt(args[1]), mx = parseInt(args[2]);
            if (!mn || !mx || mn >= mx) return sock.sendMessage(ctx.sender, { text: 'Usage: random <minSec> <maxSec>' });
            cfg.mode = 'random'; cfg.randomMinMs = mn * 1000; cfg.randomMaxMs = mx * 1000; cfg.enabled = true; ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '👁 Mode: *random ' + mn + '-' + mx + 's*' });
        }
        await sock.sendMessage(ctx.sender, { text: 'Unknown option.' });
    }
};
