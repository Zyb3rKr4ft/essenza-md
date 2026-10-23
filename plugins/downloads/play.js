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
    name: 'play',
    category: 'downloads',
    description: 'Search and play audio from YouTube',
    aliases: ['song'],
    async execute(sock, msg, args, ctx) {
        const input = args.join(' ').trim();
        if (!input) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'play <song name>' });

        const stamp = Date.now();
        const outPattern = path.join(os.tmpdir(), `essenza_play_${stamp}.%(ext)s`);
        const ytdlp = process.env.YTDLP_PATH || 'yt-dlp';
        const target = input.startsWith('http') ? input : `ytsearch1:${input}`;

        try {
            await sock.sendMessage(ctx.sender, { text: '🔍 Searching and downloading audio...' });
            const downloadCmd = `"${ytdlp}" --cookies cookies.txt --js-runtimes node --no-playlist --no-warnings -x --audio-format mp3 --audio-quality 5 -o "${outPattern}" "${target}"`;
            await run(downloadCmd);
            
            const files = fs.readdirSync(os.tmpdir()).filter(f => f.startsWith(`essenza_play_${stamp}.mp3`));
            if (files.length === 0) throw new Error('Download failed');
            const finalFile = path.join(os.tmpdir(), files[0]);

            const buf = fs.readFileSync(finalFile);
            try { fs.unlinkSync(finalFile); } catch (e) {}

            const safeTitle = input.replace(/[^\w\s-]/g, '').slice(0, 60);
            await sock.sendMessage(ctx.sender, { audio: buf, mimetype: 'audio/mpeg', ptt: false, fileName: safeTitle + '.mp3' });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Play Error: ' + e.message });
        }
    }
};
