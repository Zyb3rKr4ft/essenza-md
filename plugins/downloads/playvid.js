const yt = require('@denzy-official/youtube_scraper');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { maxBuffer: 500 * 1024 * 1024, timeout: 120000 }, (err, stdout, stderr) => {
            if (err) reject(new Error((stderr || err.message || '').split('\n').slice(-3).join(' | ')));
            else resolve(stdout);
        });
    });
}

module.exports = {
    name: 'playvid',
    category: 'downloads',
    description: 'Search and download video from YouTube',
    aliases: ['video', 'ytvid'],
    async execute(sock, msg, args, ctx) {
        const input = args.join(' ').trim();
        if (!input) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'playvid <song name or URL>' });

        await sock.sendMessage(ctx.sender, { text: '🔍 Searching YouTube...' });

        try {
            const result = await yt.ytmp4(input);
            if (!result.status || !result.download || !result.download.url) {
                throw new Error('Could not extract video URL');
            }

            const title = result.metadata.title || 'YouTube Video';
            const videoUrl = result.download.url;
            
            await sock.sendMessage(ctx.sender, { text: `📺 *${title}*\n⬇️ Downloading & converting...` });

            const res = await fetch(videoUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                signal: AbortSignal.timeout(120000)
            });
            
            if (!res.ok) throw new Error('Download failed: ' + res.status);
            const rawBuffer = Buffer.from(await res.arrayBuffer());

            const stamp = Date.now();
            const rawFile = path.join(os.tmpdir(), `vid_raw_${stamp}.mp4`);
            const finalFile = path.join(os.tmpdir(), `vid_final_${stamp}.mp4`);
            fs.writeFileSync(rawFile, rawBuffer);

            // Force H.264 and faststart so WhatsApp accepts it
            await run(`ffmpeg -y -hide_banner -loglevel error -i "${rawFile}" -c:v libx264 -preset veryfast -crf 23 -c:a aac -movflags +faststart "${finalFile}"`);

            const finalBuffer = fs.readFileSync(finalFile);
            const sizeMB = (finalBuffer.length / 1024 / 1024).toFixed(1);
            console.log('Video ready: ' + sizeMB + ' MB');

            try { fs.unlinkSync(rawFile); } catch (e) {}
            try { fs.unlinkSync(finalFile); } catch (e) {}

            const safeTitle = title.replace(/[^\w\s-]/g, '').slice(0, 60);

            if (finalBuffer.length > 16 * 1024 * 1024) {
                return sock.sendMessage(ctx.sender, {
                    document: finalBuffer,
                    mimetype: 'video/mp4',
                    fileName: safeTitle + '.mp4',
                    caption: '📺 ' + title + ' (' + sizeMB + ' MB)'
                });
            }

            await sock.sendMessage(ctx.sender, {
                video: finalBuffer,
                mimetype: 'video/mp4',
                caption: '📺 ' + title,
                fileName: safeTitle + '.mp4',
                gifPlayback: false
            });
            console.log('Video sent');
        } catch (e) {
            console.log('PlayVid error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ PlayVid Error: ' + e.message });
        }
    }
};
