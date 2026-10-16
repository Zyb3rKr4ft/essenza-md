const fetch = globalThis.fetch;
let fbdown;
try { fbdown = require('btch-downloader').fbdown; } catch (e) { fbdown = null; }

async function downloadBuffer(url) {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 EssenzaMD/1.0' }, signal: AbortSignal.timeout(60000) });
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
        if (!fbdown) return sock.sendMessage(ctx.sender, { text: '❌ btch-downloader not installed.' });
        const url = extractFbUrl(args.join(' '));
        if (!url) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'fb <url>' });

        await sock.sendMessage(ctx.sender, { text: '⬇️ Fetching Facebook video...' });
        try {
            const result = await fbdown(url);
            console.log('FB RESPONSE:', JSON.stringify(result, null, 2));
            const mediaUrl = result.HD || result.hd || result.SD || result.sd || result.url || result.download_url;
            if (!mediaUrl) throw new Error('No video URL returned');
            const buf = await downloadBuffer(mediaUrl);
            await sock.sendMessage(ctx.sender, { video: buf, mimetype: 'video/mp4', caption: '📘 Facebook' });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Facebook Error: ' + e.message });
        }
    }
};
