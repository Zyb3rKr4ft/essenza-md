module.exports = {
    name: 'getgpp',
    category: 'group',
    description: 'Get the group profile picture',
    aliases: ['gpp', 'grouppp'],
    groupOnly: true,
    async execute(sock, msg, args, ctx) {
        try {
            const url = await sock.profilePictureUrl(ctx.sender, 'image');
            await sock.sendMessage(ctx.sender, { image: { url }, caption: '📸 Group profile picture' });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Group has no profile picture or it\'s hidden.' });
        }
    }
};
