const fetch = globalThis.fetch;

module.exports = {
    name: 'ssweb',
    category: 'tools',
    description: 'Take a screenshot of a website',
    aliases: ['ss', 'screenshot'],
    async execute(sock, msg, args, ctx) {
        const url = args[0];
        if (!url || !url.startsWith('http')) {
            return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'ssweb <url>\nExample: ' + ctx.prefix + 'ssweb https://google.com' });
        }

        await sock.sendMessage(ctx.sender, { text: '📸 Taking screenshot... This may take 10-20s.' });

        try {
            const apiUrl = `https://api.omegatech.app/api/tools/ssweb?action=screenshot&url=${encodeURIComponent(url)}&device=desktop&raw=false`;
            const res = await fetch(apiUrl, { signal: AbortSignal.timeout(60000) });
            const data = await res.json();

            if (!data.success || !data.data || !data.data.screenshot_url) {
                throw new Error('No screenshot URL returned');
            }

            const imgUrl = data.data.screenshot_url;
            const caption = `📸 *Website Screenshot*\n\n🔗 *URL:* ${url}\n📐 *Size:* ${data.data.size || 'N/A'}`;

            try {
                // Try downloading and sending
                const imgRes = await fetch(imgUrl);
                const buffer = Buffer.from(await imgRes.arrayBuffer());
                await sock.sendMessage(ctx.sender, { image: buffer, caption: caption });
            } catch (uploadErr) {
                // Fallback: Send the direct URL if WhatsApp rejects the upload
                console.log('Image upload failed, sending URL:', uploadErr.message);
                await sock.sendMessage(ctx.sender, { 
                    text: caption + '\n\n⚠️ *WhatsApp rejected the image upload. Open the link below to view it:*\n' + imgUrl 
                });
            }

        } catch (e) {
            console.log('Screenshot error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ Screenshot Error: ' + e.message });
        }
    }
};
