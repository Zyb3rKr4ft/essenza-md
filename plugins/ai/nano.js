const fetch = globalThis.fetch;

module.exports = {
    name: 'nano',
    category: 'ai',
    description: 'Generate an AI image using NotGPT Nano Banana',
    aliases: ['nanobanana', 'nanoimg'],
    async execute(sock, msg, args, ctx) {
        const prompt = args.join(' ').trim();
        if (!prompt) {
            return sock.sendMessage(ctx.sender, { 
                text: 'Usage: ' + ctx.prefix + 'nano <describe the image>\nExample: ' + ctx.prefix + 'nano A cow in the city' 
            });
        }

        await sock.sendMessage(ctx.sender, { text: '🎨 Generating image with Nano Banana...' });

        try {
            // Build the API URL
            const apiUrl = `https://api.omegatech.app/api/ai/notgept-Nano-banana?action=generate&prompt=${encodeURIComponent(prompt)}`;
            console.log('Nano API URL:', apiUrl);

            const res = await fetch(apiUrl, { signal: AbortSignal.timeout(60000) });
            if (!res.ok) throw new Error('HTTP ' + res.status);

            const data = await res.json();
            console.log('NANO RESPONSE:', JSON.stringify(data, null, 2));

            if (!data.success || !data.data || !data.data.image) {
                throw new Error('No image URL returned from API');
            }

            const imageUrl = data.data.image;
            console.log('Downloading image from:', imageUrl);

            // Download the image
            const imgRes = await fetch(imageUrl);
            if (!imgRes.ok) throw new Error('Failed to download image');
            const buffer = Buffer.from(await imgRes.arrayBuffer());
            
            const sizeKB = (buffer.length / 1024).toFixed(1);
            console.log('Image downloaded: ' + sizeKB + ' KB');

            // Send the image
            await sock.sendMessage(ctx.sender, {
                image: buffer,
                caption: '🎨 *Nano Banana*\n' + prompt
            });
            console.log('Image sent successfully');

        } catch (e) {
            console.log('Nano error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ Nano Error: ' + e.message });
        }
    }
};
