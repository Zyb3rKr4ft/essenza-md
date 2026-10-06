module.exports = {
    name: 'tagall',
    category: 'group',
    aliases: ['everyone'],
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const mentions = ctx.groupMetadata.participants.map(p => p.id);
        const note = args.join(' ') || 'Attention everyone!';
        await sock.sendMessage(ctx.sender, { text: note, mentions });
    }
};
