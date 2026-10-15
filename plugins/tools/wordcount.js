function getText(msg, args) {
    const ci = msg.message.extendedTextMessage?.contextInfo;
    const quoted = ci?.quotedMessage?.conversation || ci?.quotedMessage?.extendedTextMessage?.text;
    if (quoted) return quoted;
    return args.join(' ');
}

module.exports = {
    name: 'wordcount',
    category: 'tools',
    description: 'Count words, characters, and lines in a text',
    aliases: ['wc', 'count'],
    async execute(sock, msg, args, ctx) {
        const text = getText(msg, args);
        if (!text) return sock.sendMessage(ctx.sender, { text: 'Reply to a message or type text after the command.' });
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        const chars = text.length;
        const charsNoSpace = text.replace(/\s/g, '').length;
        const lines = text.split('\n').length;
        await sock.sendMessage(ctx.sender, {
            text: '📊 *Text Stats*\n\n' +
                  '📝 Words: ' + words + '\n' +
                  '🔤 Characters: ' + chars + '\n' +
                  '🔡 Chars (no spaces): ' + charsNoSpace + '\n' +
                  '📄 Lines: ' + lines
        });
    }
};
