const fetch = globalThis.fetch;
module.exports = {
    name: 'dare', category: 'fun', description: 'Get a random dare challenge',
    async execute(sock, msg, args, ctx) {
        const res = await fetch('https://text.pollinations.ai/Generate+one+fun+and+challenging+dare+for+a+WhatsApp+group+game.+Keep+it+safe+and+short.+Return+only+the+dare.');
        const d = await res.text();
        await sock.sendMessage(ctx.sender, { text: '🔥 *Dare*\n\n' + d });
    }
};
