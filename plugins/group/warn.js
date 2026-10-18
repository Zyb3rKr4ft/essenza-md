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
    name: 'warn',
    category: 'group',
    description: 'Warn a group member (3 warnings = auto-kick)',
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const target = resolveTarget(msg, args);
        if (!target) return sock.sendMessage(ctx.sender, { text: 'Reply, mention, or give a number.' });
        if (target === ctx.botNumber + '@s.whatsapp.net') return sock.sendMessage(ctx.sender, { text: '❌ I cannot warn myself.' });

        const reason = args.slice(1).join(' ') || 'No reason provided';
        if (!ctx.groupSettings.warnings) ctx.groupSettings.warnings = {};
        
        const current = ctx.groupSettings.warnings[target] || 0;
        const updated = current + 1;
        
        if (updated >= 3) {
            // Kick the user
            try {
                await sock.groupParticipantsUpdate(ctx.sender, [target], 'remove');
                delete ctx.groupSettings.warnings[target];
                ctx.saveSettings();
                return sock.sendMessage(ctx.sender, { 
                    text: `🚫 @${target.split('@')[0]} has been kicked after reaching 3 warnings.\n📝 Last reason: ${reason}`,
                    mentions: [target]
                });
            } catch (e) {
                return sock.sendMessage(ctx.sender, { text: '❌ Failed to kick user. Am I admin?' });
            }
        } else {
            ctx.groupSettings.warnings[target] = updated;
            ctx.saveSettings();
            await sock.sendMessage(ctx.sender, { 
                text: `⚠️ *Warning ${updated}/3*\n👤 User: @${target.split('@')[0]}\n📝 Reason: ${reason}`,
                mentions: [target]
            });
        }
    }
};
