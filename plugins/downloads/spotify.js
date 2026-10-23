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
    name: 'spotify',
    category: 'downloads',
    description: 'Download a song from Spotify',
    aliases: ['sp'],
    async execute(sock, msg, args, ctx) {
        const url = args[0];
        if (!url || !url.includes('spotify.com')) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'spotify <Spotify Track Link>' });

        await sock.sendMessage(ctx.sender, { text: '🔍 Fetching track details...' });

        try {
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const html = await res.text();
            const titleMatch = html.match(/<title>([^<]+)<\/title>/);
            if (!titleMatch) throw new Error('Could not extract song name.');
            
            let songName = titleMatch[1].replace(' | Spotify', '').replace(' - song by', ' by');
            await sock.sendMessage(ctx.sender, { text: `🎵 Found: *${songName}*\n⬇️ Downloading via YouTube...` });

            const stamp = Date.now();
            const outPattern = path.join(os.tmpdir(), `spotify_${stamp}.%(ext)s`);
            const ytdlp = process.env.YTDLP_PATH || 'yt-dlp';

            const cmd = `"${ytdlp}" --cookies cookies.txt --js-runtimes node --no-playlist --no-warnings -x --audio-format mp3 --audio-quality 5 -o "${outPattern}" "ytsearch1:${songName}"`;
            await run(cmd);

            const files = fs.readdirSync(os.tmpdir()).filter(f => f.startsWith(`spotify_${stamp}.mp3`));
            if (files.length === 0) throw new Error('Download failed');

            const buf = fs.readFileSync(path.join(os.tmpdir(), files[0]));
            try { fs.unlinkSync(path.join(os.tmpdir(), files[0])); } catch (e) {}

            await sock.sendMessage(ctx.sender, { audio: buf, mimetype: 'audio/mpeg', ptt: false, fileName: `${songName.replace(/[^\w\s-]/g, '')}.mp3` });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Spotify Error: ' + e.message });
        }
    }
};
