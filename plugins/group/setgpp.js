const baileys = require('@whiskeysockets/baileys');

async function toBuffer(stream) {
    let buf = Buffer.from([]);
    for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
    return buf;
}

module.exports = {
    name: 'setgpp',
    category: 'group',
    description: 'Set the group profile picture (admin only)',
    aliases: ['setgrouppp'],
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const img = quoted?.imageMessage || msg.message.imageMessage;
        if (!img) return sock.sendMessage(ctx.sender, { text: 'Reply to an image or send one with caption ' + ctx.prefix + 'setgpp' });
        try {
            const stream = await baileys.downloadContentFromMessage(img, 'image');
            const buf = await toBuffer(stream);
            await sock.updateProfilePicture(ctx.sender, buf);
            await sock.sendMessage(ctx.sender, { text: '✅ Group profile picture updated.' });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ ' + e.message });
        }
    }
};
