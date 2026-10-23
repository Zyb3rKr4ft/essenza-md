const fetch = globalThis.fetch;

module.exports = {
    name: 'wormgpt',
    category: 'ai',
    description: 'Chat with WormGPT (Security & Hacking AI)',
    aliases: ['worm', 'hackai'],
    async execute(sock, msg, args, ctx) {
        const prompt = args.join(' ').trim();
        if (!prompt) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'wormgpt <question>' });

        await sock.sendMessage(ctx.sender, { text: '💀 Consulting WormGPT...' });

        try {
            const apiUrl = `https://api.omegatech.app/api/ai/wrmgpt?action=chat&prompt=${encodeURIComponent(prompt)}&mode=tool-explainer`;
            const res = await fetch(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(60000) });
            const data = await res.json();

            if (!data.success || !data.data || !data.data.text) {
                throw new Error('WormGPT returned an empty response.');
            }

            await sock.sendMessage(ctx.sender, { text: data.data.text });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ WormGPT Error: ' + e.message });
        }
    }
};
