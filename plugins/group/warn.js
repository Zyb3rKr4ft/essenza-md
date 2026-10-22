function resolveTarget(msg, args) {
    const ci = msg.message.extendedTextMessage?.contextInfo;
    if (ci?.mentionedJid?.length) return ci.mentionedJid[0];
    if (ci?.participant) return ci.participant;
    return null;
}

module.exports = {
    name: 'warn',
    category: 'group',
    description: 'Warn a member (3 strikes = kick)',
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const target = resolveTarget(msg, args);
        if (!target) return sock.sendMessage(ctx.sender, { text: 'Reply or mention a user to warn.' });
        if (target === ctx.botNumber + '@s.whatsapp.net') return;

        const reason = args.slice(1).join(' ') || 'No reason';
        if (!ctx.groupSettings.warnings) ctx.groupSettings.warnings = {};
        
        const current = ctx.groupSettings.warnings[target] || 0;
        const updated = current + 1;
        
        if (updated >= 3) {
            try {
                await sock.groupParticipantsUpdate(ctx.sender, [target], 'remove');
                delete ctx.groupSettings.warnings[target];
                ctx.saveSettings();
                return sock.sendMessage(ctx.sender, { text: `🚫 @${target.split('@')[0]} kicked (3/3 warnings).`, mentions: [target] });
            } catch (e) { return sock.sendMessage(ctx.sender, { text: 'Failed to kick. Am I admin?' }); }
        } else {
            ctx.groupSettings.warnings[target] = updated;
            ctx.saveSettings();
            await sock.sendMessage(ctx.sender, { text: `⚠️ *Warning ${updated}/3*\n👤 @${target.split('@')[0]}\n📝 ${reason}`, mentions: [target] });
        }
    }
};
