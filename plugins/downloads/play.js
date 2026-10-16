const fs = require('fs');
const os = require('os');
const path = require('path');
const { exec } = require('child_process');
const ytdl = require('@distube/ytdl-core');

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { maxBuffer: 500 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) reject(new Error((stderr || err.message || '').split('\n').slice(-2).join(' | ')));
            else resolve(stdout);
        });
    });
}

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

async function downloadAudio(videoUrl) {
    const stamp = Date.now();
    const inFile = path.join(os.tmpdir(), 'play_in_' + stamp + '.webm');
    const outFile = path.join(os.tmpdir(), 'play_out_' + stamp + '.mp3');
    const stream = ytdl(videoUrl, { filter: 'audioonly', quality: 'highestaudio' });
    await new Promise((resolve, reject) => {
        const ws = fs.createWriteStream(inFile);
        stream.pipe(ws);
        ws.on('finish', resolve);
        ws.on('error', reject);
        stream.on('error', reject);
    });
    await run('ffmpeg -y -hide_banner -loglevel error -i "' + inFile + '" -vn -c:a libmp3lame -q:a 4 "' + outFile + '"');
    const buf = fs.readFileSync(outFile);
    try { fs.unlinkSync(inFile); } catch (e) {}
    try { fs.unlinkSync(outFile); } catch (e) {}
    return buf;
}

module.exports = {
    name: 'play',
    category: 'downloads',
    description: 'Search YouTube and get the audio (MP3)',
    aliases: ['song', 'music2'],
    async execute(sock, msg, args, ctx) {
        const input = args.join(' ').trim();
        if (!input) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'play <song name or URL>' });

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

            await sock.sendMessage(ctx.sender, { text: '🎵 *' + title + '*\n⬇️ Downloading audio...' });
            const buf = await downloadAudio(videoUrl);
            console.log('Audio: ' + (buf.length / 1024 / 1024).toFixed(1) + ' MB');

            await sock.sendMessage(ctx.sender, {
                audio: buf,
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: title.replace(/[^\w\s-]/g, '').slice(0, 60) + '.mp3'
            });
        } catch (e) {
            console.log('Play error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ Play Error: ' + e.message });
        }
    }
};
