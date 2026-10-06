module.exports = {
    name: 'link',
    category: 'group',
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const code = await sock.groupInviteCode(ctx.sender);
        await sock.sendMessage(ctx.sender, { text: '🔗 https://chat.whatsapp.com/' + code });
    }
};
