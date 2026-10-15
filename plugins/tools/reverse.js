function getText(msg, args) {
    const ci = msg.message.extendedTextMessage?.contextInfo;
    const quoted = ci?.quotedMessage?.conversation || ci?.quotedMessage?.extendedTextMessage?.text;
    if (quoted) return quoted;
    return args.join(' ');
}

module.exports = {
    name: 'reverse',
    category: 'tools',
    description: 'Reverse a text (reply or type)',
    aliases: ['rev'],
    async execute(sock, msg, args, ctx) {
        const text = getText(msg, args);
        if (!text) return sock.sendMessage(ctx.sender, { text: 'Reply to a message or type text after the command.' });
        const reversed = text.split('').reverse().join('');
        await sock.sendMessage(ctx.sender, { text: reversed });
    }
};
