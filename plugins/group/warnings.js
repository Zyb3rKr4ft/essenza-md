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
    name: 'warnings',
    category: 'group',
    description: 'Check a user\'s warnings',
    aliases: ['warns'],
    groupOnly: true,
    async execute(sock, msg, args, ctx) {
        const target = resolveTarget(msg, args) || (msg.key.fromMe ? ctx.botNumber + '@s.whatsapp.net' : ctx.realSender + '@s.whatsapp.net');
        if (!target) return sock.sendMessage(ctx.sender, { text: 'Reply, mention, or give a number.' });

        const warns = ctx.groupSettings.warnings?.[target] || 0;
        await sock.sendMessage(ctx.sender, { 
            text: `👤 @${target.split('@')[0]} has *${warns}/3* warnings.`,
            mentions: [target]
        });
    }
};
