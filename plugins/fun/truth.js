const fetch = globalThis.fetch;
module.exports = {
    name: 'truth', category: 'fun', description: 'Get a random truth question',
    async execute(sock, msg, args, ctx) {
        const res = await fetch('https://text.pollinations.ai/Generate+one+deep+and+interesting+truth+question+for+a+game+of+truth+or+dare.+Keep+it+short.+Return+only+the+question.');
        const q = await res.text();
        await sock.sendMessage(ctx.sender, { text: '🎯 *Truth*\n\n' + q });
    }
};
