function resolveTarget(msg, args) {
    const ci = msg.message.extendedTextMessage?.contextInfo;
    if (ci?.mentionedJid?.length) return ci.mentionedJid[0];
    if (ci?.participant) return ci.participant;
    if (args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num) return num + '@s.whatsapp.net';
    }
    return null;
}

module.exports = {
    name: 'getpp',
    category: 'general',
    description: 'Get a user\'s profile picture',
    aliases: ['pp', 'profilepic'],
    async execute(sock, msg, args, ctx) {
        const target = resolveTarget(msg, args);
        if (!target) return sock.sendMessage(ctx.sender, { text: 'Reply to a user, mention them, or give a number.' });
        try {
            const url = await sock.profilePictureUrl(target, 'image');
            await sock.sendMessage(ctx.sender, { image: { url }, caption: '📸 Profile picture' });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ User has no profile picture or it\'s hidden.' });
        }
    }
};
