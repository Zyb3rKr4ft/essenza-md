const baileys = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

async function toBuffer(stream) {
    let buf = Buffer.from([]);
    for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
    return buf;
}

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { maxBuffer: 200 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) reject(new Error((stderr || err.message || '').split('\n').slice(-2).join(' | ')));
            else resolve(stdout);
        });
    });
}

module.exports = {
    name: 'tomp4',
    category: 'media',
    description: 'Convert an animated sticker to a looping MP4 video',
    aliases: ['tovideo', 'togif'],
    async execute(sock, msg, args, ctx) {
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const sticker = quoted?.stickerMessage || msg.message.stickerMessage;
        if (!sticker) return sock.sendMessage(ctx.sender, { text: 'Reply to an animated sticker.' });

        if (!sticker.isAnimated) {
            return sock.sendMessage(ctx.sender, { text: 'That sticker is static. Use ' + ctx.prefix + 'toimg instead.' });
        }

        const stamp = Date.now();
        const inFile = path.join(os.tmpdir(), 'tm_in_' + stamp + '.webp');
        const framesDir = path.join(os.tmpdir(), 'tm_frames_' + stamp);
        const outFile = path.join(os.tmpdir(), 'tm_out_' + stamp + '.mp4');

        try {
            const stream = await baileys.downloadContentFromMessage(sticker, 'sticker');
            const buf = await toBuffer(stream);
            fs.writeFileSync(inFile, buf);
            fs.mkdirSync(framesDir, { recursive: true });

            await run('magick "' + inFile + '" -coalesce "' + framesDir + '/frame_%04d.png"');

            const frames = fs.readdirSync(framesDir).filter(f => f.endsWith('.png'));
            if (!frames.length) throw new Error('No frames extracted — sticker may be corrupt.');

            await run(
                'ffmpeg -y -hide_banner -loglevel error -framerate 15 ' +
                '-i "' + framesDir + '/frame_%04d.png" ' +
                '-movflags faststart -pix_fmt yuv420p ' +
                '-vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" ' +
                '-c:v libx264 -preset veryfast -crf 23 -an "' + outFile + '"'
            );

            const mp4 = fs.readFileSync(outFile);
            const sizeKB = (mp4.length / 1024).toFixed(1);

            await sock.sendMessage(ctx.sender, {
                video: mp4,
                caption: '✅ Converted (' + frames.length + ' frames, ' + sizeKB + ' KB)',
                gifPlayback: true
            });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ ' + (e.message || '').split('\n')[0] });
        } finally {
            try { fs.unlinkSync(inFile); } catch (x) {}
            try { fs.unlinkSync(outFile); } catch (x) {}
            try { fs.rmSync(framesDir, { recursive: true, force: true }); } catch (x) {}
        }
    }
};
