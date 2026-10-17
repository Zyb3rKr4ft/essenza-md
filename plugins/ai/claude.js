const fetch = globalThis.fetch;

module.exports = {
    name: 'claude',
    category: 'ai',
    description: 'Ask Claude AI a question',
    aliases: ['anthropic'],
    async execute(sock, msg, args, ctx) {
        const prompt = args.join(' ').trim();
        if (!prompt) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'claude <question>' });

        await sock.sendMessage(ctx.sender, { text: '🤖 Thinking with Claude...' });

        try {
            const url = `https://api.omegatech.app/api/ai/claude?action=chat&text=${encodeURIComponent(prompt)}`;
            const res = await fetch(url, { 
                headers: { 'User-Agent': 'Mozilla/5.0' },
                signal: AbortSignal.timeout(60000) 
            });
            
            if (!res.ok) throw new Error('HTTP ' + res.status);
            
            const data = await res.json();
            console.log('CLAUDE RESPONSE:', JSON.stringify(data, null, 2));

            if (!data.success || !data.result) {
                throw new Error('Claude returned an empty response.');
            }

            await sock.sendMessage(ctx.sender, { text: data.result });
        } catch (e) {
            console.log('Claude error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ Claude Error: ' + e.message });
        }
    }
};
