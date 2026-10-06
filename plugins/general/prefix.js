module.exports = {
    name: 'prefix',
    category: 'general',
    ownerOnly: true,
    aliases: ['setprefix'],
    async execute(sock, msg, args, ctx) {
        const np = args[0];
        if (!np || np.length > 3) {
            return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'prefix <symbol> (max 3 chars)' });
        }
        ctx.settings.prefix = np;
        ctx.saveSettings();
        await sock.sendMessage(ctx.sender, { text: '⚡ Prefix changed to: ' + np + '\nTry: ' + np + 'ping' });
    }
};
