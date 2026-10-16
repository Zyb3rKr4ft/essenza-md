const fetch = globalThis.fetch;
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

async function downloadBuffer(url) {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 EssenzaMD/1.0' },
        signal: AbortSignal.timeout(60000)
    });
    if (!res.ok) throw new Error('Download failed: HTTP ' + res.status);
    return Buffer.from(await res.arrayBuffer());
}

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { maxBuffer: 500 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) reject(new Error((stderr || err.message || '').split('\n').slice(-2).join(' | ')));
            else resolve(stdout);
        });
    });
}

function extractTikTokUrl(text) {
    const match = text.match(/https?:\/\/(?:www\.|vm\.|m\.)?tiktok\.com\/[^\s]+/i);
    return match ? match[0] : null;
}

async function reencode(inputBuf) {
    const stamp = Date.now();
    const inFile = path.join(os.tmpdir(), 'tt_in_' + stamp + '.mp4');
    const outFile = path.join(os.tmpdir(), 'tt_out_' + stamp + '.mp4');
    fs.writeFileSync(inFile, inputBuf);

    await run(
        'ffmpeg -y -hide_banner -loglevel error -i "' + inFile + '" ' +
        '-c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p ' +
        '-c:a aac -b:a 128k -movflags +faststart ' +
        '-vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "' + outFile + '"'
    );

    const out = fs.readFileSync(outFile);
    try { fs.unlinkSync(inFile); } catch (e) {}
    try { fs.unlinkSync(outFile); } catch (e) {}
    return out;
}

module.exports = {
    name: 'tiktok',
    category: 'downloads',
    description: 'Download a TikTok video (no watermark)',
    aliases: ['tt'],
    async execute(sock, msg, args, ctx) {
        const url = extractTikTokUrl(args.join(' '));
        if (!url) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'tiktok <url>' });

        await sock.sendMessage(ctx.sender, { text: '⬇️ Fetching TikTok video...' });

        try {
            const apiUrl = 'https://www.tikwm.com/api/?url=' + encodeURIComponent(url);
            const res = await fetch(apiUrl, { signal: AbortSignal.timeout(30000) });
            if (!res.ok) throw new Error('API HTTP ' + res.status);

            const data = await res.json();
            if (data.code !== 0 || !data.data) throw new Error(data.msg || 'No video data');

            const video = data.data;
            const videoUrl = video.hdplay || video.play;
            if (!videoUrl) throw new Error('No video URL');

            const rawBuf = await downloadBuffer(videoUrl);
            console.log('TikTok raw: ' + (rawBuf.length / 1024 / 1024).toFixed(1) + ' MB');

            await sock.sendMessage(ctx.sender, { text: '🔄 Converting for WhatsApp...' });
            const buf = await reencode(rawBuf);
            console.log('TikTok re-encoded: ' + (buf.length / 1024 / 1024).toFixed(1) + ' MB');

            const caption = '🎵 ' + (video.title || 'TikTok') + '\n👤 @' + (video.author?.unique_id || 'unknown');

            await sock.sendMessage(ctx.sender, {
                video: buf,
                mimetype: 'video/mp4',
                caption: caption,
                fileName: 'tiktok_' + (video.id || Date.now()) + '.mp4',
                gifPlayback: false,
                ptv: false,
                seconds: video.duration || 10
            });
            console.log('TikTok sent');
        } catch (e) {
            console.log('TikTok error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ TikTok Error: ' + e.message });
        }
    }
};
