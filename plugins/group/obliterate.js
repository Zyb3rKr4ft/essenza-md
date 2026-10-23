function resolveTarget(msg, args) {
    const ci = msg.message.extendedTextMessage?.contextInfo;
    return ci?.mentionedJid?.[0] || ci?.participant || null;
}

module.exports = {
    name: 'obliterate',
    category: 'group',
    description: 'Dramatically kick a user',
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const target = resolveTarget(msg, args);
        if (!target) return sock.sendMessage(ctx.sender, { text: 'Mention or reply to a user to obliterate them.' });
        
        const num = target.split('@')[0];
        await sock.sendMessage(ctx.sender, { 
            text: `☄️ *TARGET LOCKED:* @${num}\n\nEliminating presence from the server...\n\n*OBLITERATE.*`, 
            mentions: [target] 
        });
        await new Promise(r => setTimeout(r, 1500));
        await sock.groupParticipantsUpdate(ctx.sender, [target], 'remove');
    }
};
