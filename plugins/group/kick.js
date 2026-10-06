module.exports = {
    name: 'kick',
    category: 'group',
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        let target = null;
        const ci = msg.message.extendedTextMessage?.contextInfo;
        if (ci?.mentionedJid?.length) target = ci.mentionedJid[0];
        else if (ci?.participant) target = ci.participant;
        else if (args[0]) target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        if (!target) return sock.sendMessage(ctx.sender, { text: 'Reply, mention, or give a number.' });
        await sock.groupParticipantsUpdate(ctx.sender, [target], 'remove');
        await sock.sendMessage(ctx.sender, { text: '✅ Removed.' });
    }
};
