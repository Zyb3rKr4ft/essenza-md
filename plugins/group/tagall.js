module.exports = {
    name: 'tagall', category: 'group', description: 'Tag everyone and list their names', groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const mentions = ctx.groupMetadata.participants.map(p => p.id);
        let text = `📢 *ATTENTION EVERYONE*\n\n${args.join(' ') || 'Hello!'}\n\n`;
        ctx.groupMetadata.participants.forEach(p => {
            text += `• @${p.id.split('@')[0]}\n`;
        });
        await sock.sendMessage(ctx.sender, { text, mentions });
    }
};
