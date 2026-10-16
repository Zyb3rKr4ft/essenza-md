const fetch = globalThis.fetch;

async function askPollinations(prompt) {
    const apiKey = process.env.POLLINATIONS_API_KEY || '';
    const url = 'https://text.pollinations.ai/' + encodeURIComponent(prompt) +
                '?model=openai&token=' + encodeURIComponent(apiKey);
    const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) throw new Error('Pollinations HTTP ' + res.status);
    const text = await res.text();
    if (!text || text.length < 2 || text.startsWith('<')) {
        throw new Error('Pollinations returned empty/HTML');
    }
    return text.trim();
}

async function askOmegaTech(prompt) {
    const url = 'https://api.omegatech.app/api/ai/Secret?action=chat&message=' + encodeURIComponent(prompt);
    const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) throw new Error('OmegaTech HTTP ' + res.status);
    const text = await res.text();
    if (text.startsWith('<')) throw new Error('OmegaTech returned HTML');
    const data = JSON.parse(text);
    let reply = data?.data?.reply || data?.reply || data?.data?.result || data?.result || data?.message;
    if (typeof reply === 'string' && reply.startsWith('{')) {
        try { const p = JSON.parse(reply); reply = p.reply || p.result || p.message || reply; } catch (e) {}
    }
    return reply;
}

module.exports = {
    name: 'ai',
    category: 'ai',
    description: 'Ask an AI a question',
    aliases: ['ask', 'chat', 'gpt'],
    async execute(sock, msg, args, ctx) {
        const prompt = args.join(' ').trim();
        if (!prompt) {
            return sock.sendMessage(ctx.sender, {
                text: '🤖 Usage: ' + ctx.prefix + 'ai <question>\nExample: ' + ctx.prefix + 'ai explain gravity'
            });
        }

        await sock.sendMessage(ctx.sender, { text: '🤖 Thinking...' });

        const providers = [
            { name: 'Pollinations', fn: askPollinations },
            { name: 'OmegaTech', fn: askOmegaTech }
        ];

        let lastErr = null;
        for (const p of providers) {
            try {
                const reply = await p.fn(prompt);
                if (!reply || !reply.trim()) throw new Error('Empty reply');
                console.log('AI OK (' + p.name + ')');
                await sock.sendMessage(ctx.sender, { text: reply });
                return;
            } catch (e) {
                console.log('AI ' + p.name + ' failed:', e.message);
                lastErr = e;
            }
        }

        await sock.sendMessage(ctx.sender, { text: '❌ All AI providers failed. Last: ' + (lastErr?.message || 'unknown') });
    }
};
