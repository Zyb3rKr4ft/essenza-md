module.exports = {
    name: 'delpp',
    category: 'general',
    description: 'Remove the bot\'s profile picture (super-sudo only)',
    superSudoOnly: true,
    async execute(sock, msg, args, ctx) {
        try {
            await sock.removeProfilePicture(sock.user.id);
            await sock.sendMessage(ctx.sender, { text: '✅ Profile picture removed.' });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ ' + e.message });
        }
    }
};
