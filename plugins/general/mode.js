module.exports = {
    name: 'mode',
    category: 'general',
    ownerOnly: true,
    aliases: ['setmode'],
    async execute(sock, msg, args, ctx) {
        const nm = (args[0] || '').toLowerCase();
        if (!['private', 'public', 'group'].includes(nm)) {
            return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'mode <private|public|group>' });
        }
        ctx.settings.mode = nm;
        ctx.saveSettings();
        await sock.sendMessage(ctx.sender, { text: '🔒 Mode set to: *' + nm + '*' });
    }
};
