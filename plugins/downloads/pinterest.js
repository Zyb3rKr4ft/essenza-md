const fetch = globalThis.fetch;
let pinterest;
try { pinterest = require('btch-downloader').pinterest; } catch (e) { pinterest = null; }

async function downloadBuffer(url) {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(60000) });
    if (!res.ok) throw new Error('Download failed');
    return Buffer.from(await res.arrayBuffer());
}

module.exports = {
    name: 'pinterest',
    category: 'downloads',
    description: 'Download images/videos from Pinterest',
    aliases: ['pin'],
    async execute(sock, msg, args, ctx) {
        if (!pinterest) return sock.sendMessage(ctx.sender, { text: '❌ btch-downloader not installed.' });
        const url = args[0];
        if (!url || !url.includes('pinterest.')) {
            return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'pinterest <Pinterest Link>' });
        }

        await sock.sendMessage(ctx.sender, { text: '⬇️ Fetching Pinterest media...' });

        try {
            const result = await pinterest(url);
            console.log('PINTEREST RESPONSE:', JSON.stringify(result, null, 2));

            // btch-downloader returns an array of URLs or an object with media
            let mediaUrl = result.url || result.video || (result.data && result.data[0]?.url) || (result.result && result.result.url);
            
            if (!mediaUrl) throw new Error('No media found in this pin.');

            const buf = await downloadBuffer(mediaUrl);
            const isVideo = mediaUrl.includes('.mp4') || result.type === 'video';

            if (isVideo) {
                await sock.sendMessage(ctx.sender, { video: buf, mimetype: 'video/mp4', caption: '📌 Pinterest Video' });
            } else {
                await sock.sendMessage(ctx.sender, { image: buf, caption: '📌 Pinterest Image' });
            }
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Pinterest Error: ' + e.message });
        }
    }
};
