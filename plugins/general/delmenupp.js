module.exports = {
    name: 'delmenupp',
    category: 'general',
    description: 'Remove the menu image (super-sudo only)',
    superSudoOnly: true,
    aliases: ['delmenuimg'],
    async execute(sock, msg, args, ctx) {
        ctx.settings.menuImage = null;
        ctx.saveSettings();
        await sock.sendMessage(ctx.sender, { text: '✅ Menu image removed.' });
    }
};
