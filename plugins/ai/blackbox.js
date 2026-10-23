const fetch = globalThis.fetch;
module.exports = {
    name: 'blackbox',
    category: 'ai',
    description: 'Chat with Blackbox AI (Codex)',
    aliases: ['bb'],
    async execute(sock, msg, args, ctx) {
        const prompt = args.join(' ').trim();
        if (!prompt) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'blackbox <question>' });

        await sock.sendMessage(ctx.sender, { text: '🤖 Thinking (Blackbox AI)...' });
        try {
            const res = await fetch(`https://omegatech-api.dixonomega.tech/api/ai/Blackbox?action=chat&prompt=${encodeURIComponent(prompt)}&model=blackboxai%2Fopenai%2Fgpt-5.3-codex`, { signal: AbortSignal.timeout(60000) });
            const data = await res.json();
            
            const reply = data.reply || data.response || data.message;
            if (!reply) throw new Error('No response from Blackbox AI.');
            
            await sock.sendMessage(ctx.sender, { text: reply });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Error: ' + e.message });
        }
    }
};
