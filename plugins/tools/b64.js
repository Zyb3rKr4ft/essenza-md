module.exports = {
    name: 'b64',
    category: 'tools',
    description: 'Base64 encode/decode',
    aliases: ['base64'],
    async execute(sock, msg, args, ctx) {
        const a = (args[0] || '').toLowerCase();
        const text = args.slice(1).join(' ');
        if (a === 'encode' || a === 'enc') {
            if (!text) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'b64 encode <text>' });
            const enc = Buffer.from(text, 'utf8').toString('base64');
            return sock.sendMessage(ctx.sender, { text: enc });
        }
        if (a === 'decode' || a === 'dec') {
            if (!text) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'b64 decode <base64>' });
            try {
                const dec = Buffer.from(text, 'base64').toString('utf8');
                return sock.sendMessage(ctx.sender, { text: dec });
            } catch (e) {
                return sock.sendMessage(ctx.sender, { text: '❌ Invalid base64.' });
            }
        }
        await sock.sendMessage(ctx.sender, { text: 'Usage:\n' + ctx.prefix + 'b64 encode <text>\n' + ctx.prefix + 'b64 decode <base64>' });
    }
};
