const baileys = require('@whiskeysockets/baileys');

function unwrap(quoted) {
    if (!quoted) return null;
    if (quoted.viewOnceMessageV2) return quoted.viewOnceMessageV2.message;
    if (quoted.viewOnceMessageV2Extension) return quoted.viewOnceMessageV2Extension.message;
    if (quoted.viewOnceMessage) return quoted.viewOnceMessage.message;
    return quoted;
}

async function toBuffer(stream) {
    let buf = Buffer.from([]);
    for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
    return buf;
}

module.exports = {
    name: 'vv2',
    category: 'media',
    async execute(sock, msg, args, ctx) {
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) return sock.sendMessage(ctx.sender, { text: 'Reply to a view-once voice note.' });
        const inner = unwrap(quoted);
        const aud = inner?.audioMessage;
        if (!aud) return sock.sendMessage(ctx.sender, { text: 'Not a voice note.' });

        const target = ctx.settings.vvToDM ? ctx.realSender + '@s.whatsapp.net' : ctx.sender;
        try {
            const stream = await baileys.downloadContentFromMessage(aud, 'audio');
            const buf = await toBuffer(stream);
            await sock.sendMessage(target, { audio: buf, mimetype: 'audio/mp4', ptt: true });
            if (target !== ctx.sender) {
                await sock.sendMessage(ctx.sender, { text: '📩 Sent to your DM.' });
            }
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Failed: ' + e.message });
        }
    }
};
