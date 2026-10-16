const fetch = globalThis.fetch;
let getFBInfo;
try { getFBInfo = require('@renpwn/fb-downloader'); } catch (e) { getFBInfo = null; }

async function downloadBuffer(url) {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 EssenzaMD/1.0' },
        signal: AbortSignal.timeout(60000)
    });
    if (!res.ok) throw new Error('Download failed: HTTP ' + res.status);
    return Buffer.from(await res.arrayBuffer());
}

function extractFbUrl(text) {
    const match = text.match(/https?:\/\/(?:www\.|m\.|fb\.)?(?:facebook\.com|fb\.watch)\/[^\s]+/i);
    return match ? match[0] : null;
}

module.exports = {
    name: 'fb',
    category: 'downloads',
    description: 'Download a Facebook video',
    aliases: ['facebook', 'fbdl'],
    async execute(sock, msg, args, ctx) {
        if (!getFBInfo) return sock.sendMessage(ctx.sender, { text: '❌ @renpwn/fb-downloader not installed.' });
        const url = extractFbUrl(args.join(' '));
        if (!url) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'fb <url>' });

        await sock.sendMessage(ctx.sender, { text: '⬇️ Fetching Facebook video...' });

        try {
            const result = await getFBInfo(url);
            console.log('FB RESPONSE:', JSON.stringify(result, null, 2));

            const videoUrl = result.hd || result.sd;
            if (!videoUrl) throw new Error('No video URL returned (video may be private)');

            const buf = await downloadBuffer(videoUrl);
            const sizeMB = (buf.length / 1024 / 1024).toFixed(1);
            console.log('FB downloaded: ' + sizeMB + ' MB');

            if (buf.length > 16 * 1024 * 1024) {
                return sock.sendMessage(ctx.sender, {
                    document: buf,
                    mimetype: 'video/mp4',
                    fileName: 'facebook.mp4',
                    caption: '📘 Facebook (' + sizeMB + ' MB — too large for video message)'
                });
            }

            await sock.sendMessage(ctx.sender, {
                video: buf,
                mimetype: 'video/mp4',
                caption: '📘 ' + (result.title || 'Facebook Video'),
                fileName: 'facebook.mp4',
                gifPlayback: false,
                ptv: false
            });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Facebook Error: ' + e.message });
        }
    }
};
