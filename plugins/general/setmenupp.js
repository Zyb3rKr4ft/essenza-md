const baileys = require('@whiskeysockets/baileys');
const fs = require('fs');

async function toBuffer(stream) {
    let buf = Buffer.from([]);
    for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
    return buf;
}

module.exports = {
    name: 'setmenupp',
    category: 'general',
    description: 'Set the menu image (super-sudo only)',
    superSudoOnly: true,
    aliases: ['setmenuimg'],
    async execute(sock, msg, args, ctx) {
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const img = quoted?.imageMessage || msg.message.imageMessage;
        if (!img) return sock.sendMessage(ctx.sender, { text: 'Reply to an image or send one with caption ' + ctx.prefix + 'setmenupp' });
        try {
            const stream = await baileys.downloadContentFromMessage(img, 'image');
            const buf = await toBuffer(stream);
            if (!fs.existsSync('./assets')) fs.mkdirSync('./assets', { recursive: true });
            fs.writeFileSync('./assets/menu.jpg', buf);
            ctx.settings.menuImage = './assets/menu.jpg';
            ctx.saveSettings();
            await sock.sendMessage(ctx.sender, { text: '✅ Menu image updated.' });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ ' + e.message });
        }
    }
};
