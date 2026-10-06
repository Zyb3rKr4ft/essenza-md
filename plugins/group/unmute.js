function resolveTarget(msg, args) {
    const ci = msg.message.extendedTextMessage?.contextInfo;
    if (ci?.mentionedJid?.length) return String(ci.mentionedJid[0]).match(/^(\d+)/)?.[1];
    if (ci?.participant) return String(ci.participant).match(/^(\d+)/)?.[1];
    if (args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num) return num;
    }
    return null;
}

module.exports = {
    name: 'unmute',
    category: 'group',
    description: 'Unmute a member',
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const num = resolveTarget(msg, args);
        if (!num) return sock.sendMessage(ctx.sender, { text: 'Reply, mention, or give a number.' });
        if (!Array.isArray(ctx.groupSettings.muted)) ctx.groupSettings.muted = [];
        if (!ctx.groupSettings.muted.includes(num)) return sock.sendMessage(ctx.sender, { text: 'Not muted.' });
        ctx.groupSettings.muted = ctx.groupSettings.muted.filter(n => n !== num);
        ctx.saveSettings();
        await sock.sendMessage(ctx.sender, { text: '🔊 +' + num + ' is now unmuted.' });
    }
};
