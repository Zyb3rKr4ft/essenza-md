module.exports = {
    name: 'mutelist',
    category: 'group',
    description: 'Show muted members in this group',
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const list = ctx.groupSettings.muted || [];
        if (!list.length) return sock.sendMessage(ctx.sender, { text: '🔊 No muted members.' });
        const mentions = list.map(n => n + '@s.whatsapp.net');
        let out = '╭━━━〔 🔇 MUTED MEMBERS 〕━━━┈⊷\n';
        out += '┃\n';
        list.forEach((n, i) => { out += '┃ ' + (i + 1) + '. +' + n + '\n'; });
        out += '┃\n';
        out += '╰━━━━━━━━━━━━━━━┈⊷';
        await sock.sendMessage(ctx.sender, { text: out, mentions });
    }
};
