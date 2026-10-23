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
    name: 'iqiyi',
    category: 'downloads',
    description: 'Search and download from iQIYI',
    async execute(sock, msg, args, ctx) {
        const input = args.join(' ').trim();
        if (!input) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'iqiyi <search query or iq.com URL>' });

        await sock.sendMessage(ctx.sender, { text: '🔍 Searching iQIYI...' });

        try {
            const stamp = Date.now();
            const outPattern = path.join(os.tmpdir(), `iqiyi_${stamp}.%(ext)s`);
            const ytdlp = process.env.YTDLP_PATH || 'yt-dlp';
            const target = input.startsWith('http') ? input : `ytsearch1:iq.com ${input}`;

            const cmd = `"${ytdlp}" --no-playlist --no-warnings -f "bv*[height<=480]+ba/b[height<=480]/b" --merge-output-format mp4 -o "${outPattern}" "${target}"`;
            await run(cmd);

            const files = fs.readdirSync(os.tmpdir()).filter(f => f.startsWith(`iqiyi_${stamp}.mp4`));
            if (files.length === 0) throw new Error('Download failed');
            const finalFile = path.join(os.tmpdir(), files[0]);

            const buf = fs.readFileSync(finalFile);
            const sizeMB = (buf.length / 1024 / 1024).toFixed(1);
            try { fs.unlinkSync(finalFile); } catch (e) {}

            if (buf.length > 16 * 1024 * 1024) {
                return sock.sendMessage(ctx.sender, { document: buf, mimetype: 'video/mp4', fileName: 'iqiyi_video.mp4', caption: '📺 iQIYI Video (' + sizeMB + ' MB)' });
            }

            await sock.sendMessage(ctx.sender, { video: buf, mimetype: 'video/mp4', caption: '📺 iQIYI Video', gifPlayback: false });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ iQIYI Error: ' + e.message });
        }
    }
};
