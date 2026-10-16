const fs = require('fs');
const os = require('os');
const path = require('path');
const ytdl = require('@distube/ytdl-core');

function extractUrl(text) {
    const m = text.match(/https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[^\s&]+/i);
    return m ? m[0] : null;
}

async function searchYt(query) {
    const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await res.text();
    const matches = html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"([^"]+)"/g);
    const first = matches.next();
    if (!first.value) throw new Error('No search results');
    return { url: 'https://www.youtube.com/watch?v=' + first.value[1], title: first.value[2] };
}

async function downloadVideo(videoUrl) {
    const stamp = Date.now();
    const outFile = path.join(os.tmpdir(), 'playvid_' + stamp + '.mp4');
    const stream = ytdl(videoUrl, { filter: 'audioandvideo', quality: 'highest' });
    await new Promise((resolve, reject) => {
        const ws = fs.createWriteStream(outFile);
        stream.pipe(ws);
        ws.on('finish', resolve);
        ws.on('error', reject);
        stream.on('error', reject);
    });
    const buf = fs.readFileSync(outFile);
    try { fs.unlinkSync(outFile); } catch (e) {}
    return buf;
}

module.exports = {
    name: 'playvid',
    category: 'downloads',
    description: 'Search YouTube and get the video (MP4)',
    aliases: ['video', 'ytvid'],
    async execute(sock, msg, args, ctx) {
        const input = args.join(' ').trim();
        if (!input) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'playvid <song name or URL>' });

        await sock.sendMessage(ctx.sender, { text: '🔍 Searching YouTube...' });

        try {
            let videoUrl, title;
            const urlFromInput = extractUrl(input);
            if (urlFromInput) {
                videoUrl = urlFromInput;
                const info = await ytdl.getBasicInfo(videoUrl);
                title = info.videoDetails.title;
            } else {
                const found = await searchYt(input);
                videoUrl = found.url;
                title = found.title;
            }

            await sock.sendMessage(ctx.sender, { text: '📺 *' + title + '*\n⬇️ Downloading video...' });
            const buf = await downloadVideo(videoUrl);
            const sizeMB = (buf.length / 1024 / 1024).toFixed(1);
            console.log('Video: ' + sizeMB + ' MB');

            const safeTitle = title.replace(/[^\w\s-]/g, '').slice(0, 60);

            if (buf.length > 16 * 1024 * 1024) {
                return sock.sendMessage(ctx.sender, {
                    document: buf,
                    mimetype: 'video/mp4',
                    fileName: safeTitle + '.mp4',
                    caption: '📺 ' + title + ' (' + sizeMB + ' MB — exceeds video limit, sent as file)'
                });
            }

            await sock.sendMessage(ctx.sender, {
                video: buf,
                mimetype: 'video/mp4',
                caption: '📺 ' + title,
                fileName: safeTitle + '.mp4',
                gifPlayback: false,
                ptv: false
            });
        } catch (e) {
            console.log('PlayVid error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ PlayVid Error: ' + e.message });
        }
    }
};
