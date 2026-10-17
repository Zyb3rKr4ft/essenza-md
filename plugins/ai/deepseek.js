const fetch = globalThis.fetch;

module.exports = {
    name: 'deepseek',
    category: 'ai',
    description: 'Ask DeepSeek v4 a question',
    aliases: ['ds', 'deep'],
    async execute(sock, msg, args, ctx) {
        const prompt = args.join(' ').trim();
        if (!prompt) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'deepseek <question>' });

        await sock.sendMessage(ctx.sender, { text: '🤖 Thinking with DeepSeek v4...' });

        const apiUrl = `https://api.omegatech.app/api/ai/Deepseek2?action=chat&message=${encodeURIComponent(prompt)}&model=v4`;

        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const res = await fetch(apiUrl, { 
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                    signal: AbortSignal.timeout(60000) 
                });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                
                const data = await res.json();
                console.log(`DEEPSEEK RESPONSE (Attempt ${attempt}):`, JSON.stringify(data, null, 2));

                if (data.success && data.reply && data.reply.trim() !== '') {
                    await sock.sendMessage(ctx.sender, { text: data.reply });
                    return;
                }
                
                throw new Error('Empty reply received');
            } catch (e) {
                console.log(`DeepSeek Attempt ${attempt} failed:`, e.message);
                if (attempt === 2) {
                    await sock.sendMessage(ctx.sender, { text: '❌ DeepSeek Error: ' + e.message });
                } else {
                    await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
                }
            }
        }
    }
};
