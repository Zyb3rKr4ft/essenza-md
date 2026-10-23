module.exports = {
    name: 'tag', category: 'group', description: 'Silently tag everyone', groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const mentions = ctx.groupMetadata.participants.map(p => p.id);
        await sock.sendMessage(ctx.sender, { text: args.join(' ') || '👋', mentions });
    }
};
