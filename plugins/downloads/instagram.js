const fetch = globalThis.fetch;
let igdl;
try { igdl = require('btch-downloader').igdl; } catch (e) { igdl = null; }

async function downloadBuffer(url) {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 EssenzaMD/1.0' },
        signal: AbortSignal.timeout(60000)
    });
    if (!res.ok) throw new Error('Download failed: HTTP ' + res.status);
    return Buffer.from(await res.arrayBuffer());
}

function extractIgUrl(text) {
    const match = text.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:reel|p|tv)\/[^\s]+/i);
    return match ? match[0] : null;
}

module.exports = {
    name: 'ig',
    category: 'downloads',
    description: 'Download an Instagram reel or post',
    aliases: ['instagram', 'insta'],
    async execute(sock, msg, args, ctx) {
        if (!igdl) return sock.sendMessage(ctx.sender, { text: '❌ btch-downloader not installed.' });

        const url = extractIgUrl(args.join(' '));
        if (!url) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'ig <url>' });

        await sock.sendMessage(ctx.sender, { text: '⬇️ Fetching Instagram media...' });

        try {
            const result = await igdl(url);
            console.log('IG RESPONSE:', JSON.stringify(result, null, 2));

            const items = Array.isArray(result) ? result : (result.data || result.result || result.url || []);
            const list = Array.isArray(items) ? items : [items];
            if (!list.length) throw new Error('No media returned');

            let sent = 0;
            for (const item of list.slice(0, 5)) {
                const mediaUrl = typeof item === 'string' ? item : (item.url || item.download_url || item.video || item.src);
                const isVideo = typeof item === 'object' && (item.type === 'video' || /\.mp4/i.test(mediaUrl || ''));
                if (!mediaUrl) continue;
                const buf = await downloadBuffer(mediaUrl);
                if (isVideo) {
                    await sock.sendMessage(ctx.sender, { video: buf, mimetype: 'video/mp4', caption: '📸 Instagram' });
                } else {
                    await sock.sendMessage(ctx.sender, { image: buf, caption: '📸 Instagram' });
                }
                sent++;
            }
            if (!sent) throw new Error('No downloadable items found');
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Instagram Error: ' + e.message });
        }
    }
};
