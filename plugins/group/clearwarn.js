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
    name: 'clearwarn',
    category: 'group',
    description: 'Clear a user\'s warnings',
    aliases: ['resetwarn'],
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const target = resolveTarget(msg, args);
        if (!target) return sock.sendMessage(ctx.sender, { text: 'Reply, mention, or give a number.' });

        if (ctx.groupSettings.warnings && ctx.groupSettings.warnings[target]) {
            delete ctx.groupSettings.warnings[target];
            ctx.saveSettings();
            await sock.sendMessage(ctx.sender, { 
                text: `✅ Warnings cleared for @${target.split('@')[0]}.`,
                mentions: [target]
            });
        } else {
            await sock.sendMessage(ctx.sender, { text: `⚠️ @${target.split('@')[0]} has no warnings.`, mentions: [target] });
        }
    }
};
