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
        exec(cmd, { maxBuffer: 100 * 1024 * 1024 }, (err) => err ? reject(err) : resolve());
    });
}

module.exports = {
    name: 'toimg',
    category: 'media',
    description: 'Convert a replied sticker to PNG (static) or MP4 (animated)',
    aliases: ['toimage'],
    async execute(sock, msg, args, ctx) {
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const sticker = quoted?.stickerMessage || msg.message.stickerMessage;
        if (!sticker) return sock.sendMessage(ctx.sender, { text: 'Reply to a sticker.' });

        try {
            const stream = await baileys.downloadContentFromMessage(sticker, 'sticker');
            const buf = await toBuffer(stream);

            const stamp = Date.now();
            const inFile = path.join(os.tmpdir(), 'ti_in_' + stamp + '.webp');
            fs.writeFileSync(inFile, buf);

            // isAnimated flag from Baileys (true for animated webp stickers)
            const animated = !!sticker.isAnimated;

            if (animated) {
                const outFile = path.join(os.tmpdir(), 'ti_out_' + stamp + '.mp4');
                // Convert animated webp -> mp4, even dimensions (h264 requirement), yuv420p for WhatsApp
                await run(
                    'ffmpeg -y -hide_banner -loglevel error -i "' + inFile + '" ' +
                    '-movflags faststart -pix_fmt yuv420p ' +
                    '-vf "scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=15" ' +
                    '-c:v libx264 -preset veryfast -crf 23 -an "' + outFile + '"'
                );
                const mp4 = fs.readFileSync(outFile);
                try { fs.unlinkSync(inFile); } catch (x) {}
                try { fs.unlinkSync(outFile); } catch (x) {}
                await sock.sendMessage(ctx.sender, {
                    video: mp4,
                    caption: '✅ Animated sticker converted to video.',
                    gifPlayback: true
                });
            } else {
                const outFile = path.join(os.tmpdir(), 'ti_out_' + stamp + '.png');
                await run('ffmpeg -y -hide_banner -loglevel error -i "' + inFile + '" "' + outFile + '"');
                const png = fs.readFileSync(outFile);
                try { fs.unlinkSync(inFile); } catch (x) {}
                try { fs.unlinkSync(outFile); } catch (x) {}
                await sock.sendMessage(ctx.sender, { image: png, caption: '✅ Converted.' });
            }
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ ' + (e.message || '').split('\n')[0] });
        }
    }
};
