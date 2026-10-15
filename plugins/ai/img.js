const fetch = globalThis.fetch;

const MODELS = {
    flux: 'flux',
    turbo: 'turbo',
    sd: 'stable-diffusion'
};

async function downloadBuffer(url) {
    const apiKey = process.env.POLLINATIONS_API_KEY;
    if (!apiKey) throw new Error('POLLINATIONS_API_KEY is not set.');

    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 EssenzaMD/1.0',
            'Authorization': 'Bearer ' + apiKey
        },
        signal: AbortSignal.timeout(90000)
    });
    if (!res.ok) throw new Error('Download failed: HTTP ' + res.status);
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) {
        const body = await res.text().catch(() => '');
        throw new Error('Not an image (got ' + ct + '). ' + body.slice(0, 100));
    }
    return Buffer.from(await res.arrayBuffer());
}

module.exports = {
    name: 'img',
    category: 'ai',
    description: 'Generate an AI image from a text prompt',
    aliases: ['image', 'imagine', 'gen'],
    async execute(sock, msg, args, ctx) {
        let modelKey = 'flux';
        let prompt = args.join(' ').trim();

        if (args[0] && MODELS[args[0].toLowerCase()]) {
            modelKey = args.shift().toLowerCase();
            prompt = args.join(' ').trim();
        }

        if (!prompt) {
            const list = Object.keys(MODELS).map(m => '• ' + ctx.prefix + 'img ' + m).join('\n');
            return sock.sendMessage(ctx.sender, {
                text: '🎨 *Image Models*\n\n' + list + '\n\nUsage: ' + ctx.prefix + 'img [model] <prompt>\nExample: ' + ctx.prefix + 'img a cat with sunglasses'
            });
        }

        await sock.sendMessage(ctx.sender, { text: '🎨 Generating with *' + modelKey + '*... (10-30s)' });

        try {
            const model = MODELS[modelKey];
            const promptEncoded = encodeURIComponent(prompt);
            const url = 'https://gen.pollinations.ai/image/' + promptEncoded + '?width=1024&height=1024&model=' + model + '&nologo=true';

            console.log('Trying:', url);
            const buf = await downloadBuffer(url);

            if (buf.length < 5000) throw new Error('Image too small — likely an error response.');

            console.log('Image downloaded: ' + buf.length + ' bytes');
            await sock.sendMessage(ctx.sender, {
                image: buf,
                caption: '🎨 *' + modelKey + '* · ' + prompt
            });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Image Error: ' + e.message });
        }
    }
};
