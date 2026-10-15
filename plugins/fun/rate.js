function getText(msg, args) {
    const ci = msg.message.extendedTextMessage?.contextInfo;
    const quoted = ci?.quotedMessage?.conversation || ci?.quotedMessage?.extendedTextMessage?.text;
    if (quoted) return quoted;
    return args.join(' ');
}

module.exports = {
    name: 'rate',
    category: 'fun',
    description: 'Rate something out of 100',
    async execute(sock, msg, args, ctx) {
        const text = getText(msg, args);
        if (!text) return sock.sendMessage(ctx.sender, { text: 'Reply to a message or type text to rate.' });
        const score = Math.floor(Math.random() * 101);
        let verdict = '💀 Terrible';
        if (score >= 90) verdict = '🔥 Legendary';
        else if (score >= 70) verdict = '⭐ Excellent';
        else if (score >= 50) verdict = '👍 Decent';
        else if (score >= 30) verdict = '😐 Meh';
        else if (score >= 10) verdict = '👎 Bad';
        await sock.sendMessage(ctx.sender, {
            text: '📊 *Rating: ' + text + '*\n\n' + verdict + '\nScore: *' + score + '/100*'
        });
    }
};
