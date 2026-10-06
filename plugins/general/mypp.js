module.exports = {
    name: 'mypp',
    category: 'general',
    description: 'Get your own profile picture',
    aliases: ['myprofile'],
    async execute(sock, msg, args, ctx) {
        const jid = ctx.botNumber + '@s.whatsapp.net';
        try {
            const url = await sock.profilePictureUrl(jid, 'image');
            await sock.sendMessage(ctx.sender, { image: { url }, caption: '📸 Your profile picture' });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ No profile picture found or it\'s hidden.' });
        }
    }
};
