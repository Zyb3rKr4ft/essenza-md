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

async function buildSticker(inputBuf, ext, animated) {
    const inFile = path.join(os.tmpdir(), 'stk_in_' + Date.now() + '.' + ext);
    const outFile = path.join(os.tmpdir(), 'stk_out_' + Date.now() + '.webp');
    fs.writeFileSync(inFile, inputBuf);

    const scale = 'scale=512:512:force_original_aspect_ratio=decrease:flags=lanczos,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000';
let cmd;
if (animated) {
    cmd = 'ffmpeg -y -hide_banner -loglevel error -i "' + inFile + '" -t 6 -vcodec libwebp_anim -filter:v "' + scale + ',fps=12" -lossless 0 -compression_level 6 -q:v 50 -loop 0 -an -vsync 0 -f webp "' + outFile + '"';
} else {
    cmd = 'ffmpeg -y -hide_banner -loglevel error -i "' + inFile + '" -vcodec libwebp -vf "' + scale + '" -lossless 0 -compression_level 6 -q:v 80 -f webp "' + outFile + '"';
}
    try { await run(cmd); } catch (e) {
        try { fs.unlinkSync(inFile); } catch (x) {}
        throw new Error('ffmpeg failed: ' + (e.message || '').split('\n')[0]);
    }
    const out = fs.readFileSync(outFile);
    try { fs.unlinkSync(inFile); } catch (x) {}
    try { fs.unlinkSync(outFile); } catch (x) {}
    return out;
}

module.exports = {
    name: 'sticker',
    category: 'media',
    description: 'Convert a replied image or video into a WhatsApp sticker',
    aliases: ['s'],
    async execute(sock, msg, args, ctx) {
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage ||
                       msg.message.imageMessage || msg.message.videoMessage;
        const direct = msg.message.imageMessage || msg.message.videoMessage;

        let media = null, kind = null;
        if (direct) { media = direct; kind = direct.mimetype?.startsWith('video') ? 'video' : 'image'; }
        else if (quoted?.imageMessage) { media = quoted.imageMessage; kind = 'image'; }
        else if (quoted?.videoMessage) { media = quoted.videoMessage; kind = 'video'; }
        else if (quoted?.stickerMessage) { return sock.sendMessage(ctx.sender, { text: 'That\'s already a sticker.' }); }
        else { return sock.sendMessage(ctx.sender, { text: 'Reply to an image or video, or send one with the caption ' + ctx.prefix + 'sticker' }); }

        try {
            const stream = await baileys.downloadContentFromMessage(media, kind);
            const buf = await toBuffer(stream);
            const webp = await buildSticker(buf, kind === 'video' ? 'mp4' : 'jpg', kind === 'video');
            await sock.sendMessage(ctx.sender, { sticker: webp });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ ' + e.message });
        }
    }
};
