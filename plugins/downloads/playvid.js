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
    description: 'Download video from YouTube',
    aliases: ['video'],
    async execute(sock, msg, args, ctx) {
        const input = args.join(' ').trim();
        if (!input) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'playvid <song name>' });

        const stamp = Date.now();
        const outPattern = path.join(os.tmpdir(), `essenza_vid_${stamp}.%(ext)s`);
        const ytdlp = process.env.YTDLP_PATH || 'yt-dlp';
        const target = input.startsWith('http') ? input : `ytsearch1:${input}`;

        try {
            await sock.sendMessage(ctx.sender, { text: '🔍 Searching and downloading video...' });
            const downloadCmd = `"${ytdlp}" --cookies cookies.txt --js-runtimes node --no-playlist --no-warnings -f "bv*[height<=480]+ba/b[height<=480]/b" --merge-output-format mp4 -o "${outPattern}" "${target}"`;
            await run(downloadCmd);
            
            const files = fs.readdirSync(os.tmpdir()).filter(f => f.startsWith(`essenza_vid_${stamp}.mp4`));
            if (files.length === 0) throw new Error('Download failed');
            const finalFile = path.join(os.tmpdir(), files[0]);

            const buf = fs.readFileSync(finalFile);
            const sizeMB = (buf.length / 1024 / 1024).toFixed(1);
            try { fs.unlinkSync(finalFile); } catch (e) {}

            const safeTitle = input.replace(/[^\w\s-]/g, '').slice(0, 60);

            if (buf.length > 16 * 1024 * 1024) {
                return sock.sendMessage(ctx.sender, { document: buf, mimetype: 'video/mp4', fileName: safeTitle + '.mp4', caption: '📺 ' + input + ' (' + sizeMB + ' MB)' });
            }

            await sock.sendMessage(ctx.sender, { video: buf, mimetype: 'video/mp4', caption: '📺 ' + input, fileName: safeTitle + '.mp4', gifPlayback: false });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ PlayVid Error: ' + e.message });
        }
    }
};
