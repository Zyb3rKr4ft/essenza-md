module.exports = {
    name: 'back',
    category: 'general',
    description: 'Disable away mode',
    sudoOnly: true,
    async execute(sock, msg, args, ctx) {
        if (!ctx.settings.afk?.enabled) {
            return sock.sendMessage(ctx.sender, { text: '✅ You weren\'t away.' });
        }
        const mins = Math.floor((Date.now() - (ctx.settings.afk.since || Date.now())) / 60000);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        const dur = h > 0 ? (h + 'h ' + m + 'm') : (m + 'm');
        const replied = (ctx.settings.afk.replied || []).length;

        ctx.settings.afk = { enabled: false, since: null, message: null, replied: [] };
        ctx.saveSettings();

        await sock.sendMessage(ctx.sender, {
            text: '✅ Welcome back!\n\n⏱ You were away for: ' + dur + '\n👥 Auto-replied to: ' + replied + ' people'
        });
    }
};
