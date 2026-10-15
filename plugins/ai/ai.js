const fetch = globalThis.fetch;

const MODELS = ['mistral-agent', 'pixtral', 'gpt-4o', 'claude-3', 'gemini'];

function tryParseNested(str) {
    if (typeof str !== 'string') return null;
    try { return JSON.parse(str); } catch (e) { return null; }
}

module.exports = {
    name: 'ai',
    category: 'ai',
    description: 'Ask an AI model a question',
    aliases: ['ask', 'chat'],
    async execute(sock, msg, args, ctx) {
        let model = 'mistral-agent';
        let prompt = args.join(' ').trim();

        if (args[0] && MODELS.includes(args[0].toLowerCase())) {
            model = args.shift().toLowerCase();
            prompt = args.join(' ').trim();
        }

        if (!prompt) {
            const list = MODELS.map(m => '• ' + ctx.prefix + 'ai ' + m).join('\n');
            return sock.sendMessage(ctx.sender, {
                text: '🤖 *AI Models*\n\n' + list + '\n\nUsage: ' + ctx.prefix + 'ai [model] <question>'
            });
        }

        await sock.sendMessage(ctx.sender, { text: '🤖 Thinking with *' + model + '*...' });

        try {
            const res = await fetch('https://api.omegatech.app/api/ai/All-Ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'chat', message: prompt, model: model })
            });

            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            console.log('AI RAW:', JSON.stringify(data, null, 2));

            let candidate = data.reply || data.result || data.message || '';

            // Unwrap nested JSON string once
            const parsed = tryParseNested(candidate);
            if (parsed && typeof parsed === 'object') {
                if (parsed.reply && typeof parsed.reply === 'string') {
                    candidate = parsed.reply;
                } else if (parsed.result && typeof parsed.result === 'string') {
                    candidate = parsed.result;
                } else if (parsed.message && typeof parsed.message === 'string') {
                    candidate = parsed.message;
                }
            }

            if (!candidate || !candidate.trim()) throw new Error('Empty reply.');

            await sock.sendMessage(ctx.sender, { text: candidate });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ AI Error: ' + e.message });
        }
    }
};
