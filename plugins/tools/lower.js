function getText(msg, args) {
    const ci = msg.message.extendedTextMessage?.contextInfo;
    const quoted = ci?.quotedMessage?.conversation || ci?.quotedMessage?.extendedTextMessage?.text;
    if (quoted) return quoted;
    return args.join(' ');
}

module.exports = {
    name: 'lower',
    category: 'tools',
    description: 'Convert text to lowercase',
    aliases: ['lowercase', 'lc'],
    async execute(sock, msg, args, ctx) {
        const text = getText(msg, args);
        if (!text) return sock.sendMessage(ctx.sender, { text: 'Reply to a message or type text after the command.' });
        await sock.sendMessage(ctx.sender, { text: text.toLowerCase() });
    }
};
