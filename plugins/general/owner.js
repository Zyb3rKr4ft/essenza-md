module.exports = {
    name: 'owner',
    category: 'general',
    async execute(sock, msg, args, ctx) {
        await sock.sendMessage(ctx.sender, {
            text: '👑 *Owner*\n\nName: ' + (ctx.config.ownerName || 'N/A') + '\nNumber: +' + ctx.config.ownerNumber
        });
    }
};
