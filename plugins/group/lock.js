module.exports = {
    name: 'lock',
    category: 'group',
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        await sock.groupSettingUpdate(ctx.sender, 'announcement');
        await sock.sendMessage(ctx.sender, { text: '🔓 Group locked — only admins can send.' });
    }
};
