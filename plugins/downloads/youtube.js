const fetch = globalThis.fetch;
let ytdl;
try { ytdl = require('btch-downloader').youtube; } catch (e) { ytdl = null; }

async function downloadBuffer(url) {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 EssenzaMD/1.0' }, signal: AbortSignal.timeout(120000) });
    if (!res.ok) throw new Error('Download failed: HTTP ' + res.status);
    return Buffer.from(await res.arrayBuffer());
}

function extractYtUrl(text) {
    const match = text.match(/https?:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\/[^\s]+/i);
    return match ? match[0] : null;
}

module.exports = {
    name: 'ytmp3',
    category: 'downloads',
    description: 'Download YouTube as MP3 (audio) or MP4 (video)',
    aliases: ['ytmp4', 'yt', 'youtube'],
    async execute(sock, msg, args, ctx) {
        if (!ytdl) return sock.sendMessage(ctx.sender, { text: '❌ btch-downloader not installed.' });
        const url = extractYtUrl(args.join(' '));
        if (!url) return sock.sendMessage(ctx.sender, { text: 'Usage:\n' + ctx.prefix + 'ytmp3 <url> — audio\n' + ctx.prefix + 'ytmp4 <url> — video' });

        // Detect which alias was used
        const fullText = ctx.text.toLowerCase();
        const isAudio = fullText.includes('ytmp3') || !fullText.includes('ytmp4');

        await sock.sendMessage(ctx.sender, { text: '⬇️ Fetching YouTube ' + (isAudio ? 'audio' : 'video') + '... (may take 30-60s)' });

        try {
            const result = await ytdl(url);
            console.log('YT RESPONSE:', JSON.stringify(result, null, 2));
            const mediaUrl = isAudio
                ? (result.mp3 || result.audio || result.audio_url || result.url)
                : (result.mp4 || result.video || result.video_url || result.url);
            if (!mediaUrl) throw new Error('No media URL returned');
            const buf = await downloadBuffer(mediaUrl);
            const sizeMB = (buf.length / 1024 / 1024).toFixed(1);
            console.log('YT downloaded: ' + sizeMB + ' MB');

            if (isAudio) {
                await sock.sendMessage(ctx.sender, { audio: buf, mimetype: 'audio/mpeg', ptt: false, caption: '🎵 YouTube Audio' });
            } else {
                await sock.sendMessage(ctx.sender, { video: buf, mimetype: 'video/mp4', caption: '📺 YouTube Video' });
            }
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ YouTube Error: ' + e.message });
        }
    }
};
