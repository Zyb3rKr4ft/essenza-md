module.exports = {
    name: 'unlock',
    category: 'group',
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        await sock.groupSettingUpdate(ctx.sender, 'not_announcement');
        await sock.sendMessage(ctx.sender, { text: '🔓 Group unlocked — everyone can send.' });
    }
};
