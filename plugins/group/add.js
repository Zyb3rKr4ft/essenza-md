module.exports = {
    name: 'add',
    category: 'group',
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const num = (args[0] || '').replace(/[^0-9]/g, '');
        if (!num) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'add <number>' });
        const jid = num + '@s.whatsapp.net';
        try {
            await sock.groupParticipantsUpdate(ctx.sender, [jid], 'add');
            await sock.sendMessage(ctx.sender, { text: '✅ Added.' });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Failed: ' + e.message });
        }
    }
};
