function getNumber(jid) {
    return String(jid || '').match(/^(\d+)/)?.[1] || '';
}

module.exports = {
    name: 'ship',
    category: 'fun',
    description: 'Ship two users together (reply, mention, or numbers)',
    async execute(sock, msg, args, ctx) {
        const ci = msg.message.extendedTextMessage?.contextInfo;
        const mentioned = ci?.mentionedJid || [];
        let a, b;
        if (mentioned.length >= 2) {
            a = getNumber(mentioned[0]);
            b = getNumber(mentioned[1]);
        } else if (mentioned.length === 1) {
            a = ctx.realSender;
            b = getNumber(mentioned[0]);
        } else if (ci?.participant && args[0]) {
            a = getNumber(ci.participant);
            b = args[0].replace(/[^0-9]/g, '');
        } else {
            return sock.sendMessage(ctx.sender, { text: 'Mention two users, or reply + mention one.' });
        }
        if (!a || !b) return sock.sendMessage(ctx.sender, { text: 'Invalid users.' });
        const score = Math.floor(Math.random() * 101);
        let verdict = '💔 Not a match';
        if (score >= 90) verdict = '💍 Soulmates!';
        else if (score >= 70) verdict = '❤️ Strong love';
        else if (score >= 50) verdict = '💕 Good match';
        else if (score >= 30) verdict = '🤝 Just friends';
        const bar = '█'.repeat(Math.round(score / 10)) + '░'.repeat(10 - Math.round(score / 10));
        await sock.sendMessage(ctx.sender, {
            text: '💘 *Love Calculator*\n\n@' + a + '  +  @' + b + '\n\n' + bar + ' *' + score + '%*\n' + verdict,
            mentions: [a + '@s.whatsapp.net', b + '@s.whatsapp.net']
        });
    }
};
