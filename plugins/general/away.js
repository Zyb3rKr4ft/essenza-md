module.exports = {
    name: 'away',
    category: 'general',
    description: 'Enable away mode (auto-reply once per DM)',
    aliases: ['afk'],
    sudoOnly: true,
    async execute(sock, msg, args, ctx) {
        const a = (args[0] || '').toLowerCase();

        if (a === 'status') {
            const cfg = ctx.settings.afk || {};
            if (!cfg.enabled) return sock.sendMessage(ctx.sender, { text: '💤 Away mode: *OFF*' });
            const mins = Math.floor((Date.now() - (cfg.since || Date.now())) / 60000);
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            const dur = h > 0 ? (h + 'h ' + m + 'm') : (m + 'm');
            const replied = (cfg.replied || []).length;
            return sock.sendMessage(ctx.sender, {
                text: '💤 Away mode: *ON*\n' +
                      '⏱ Duration: ' + dur + '\n' +
                      '💬 Message: ' + (cfg.message || '(default)') + '\n' +
                      '👥 Replied to: ' + replied + ' people'
            });
        }

        if (a === 'off') {
            ctx.settings.afk = { enabled: false, since: null, message: null, replied: [] };
            ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '✅ Away mode *OFF*' });
        }

        const customMsg = args.join(' ');
        ctx.settings.afk = {
            enabled: true,
            since: Date.now(),
            message: customMsg || null,
            replied: []
        };
        ctx.saveSettings();
        await sock.sendMessage(ctx.sender, {
            text: '💤 Away mode *ON*\n' +
                  (customMsg ? '💬 Message: ' + customMsg : '💬 Using default message.') + '\n\n' +
                  'Use ' + ctx.prefix + 'back to disable.\n' +
                  'Use ' + ctx.prefix + 'away status to check.'
        });
    }
};
