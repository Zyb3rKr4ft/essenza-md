const QRCode = require('qrcode');

module.exports = {
    name: 'qr',
    category: 'tools',
    description: 'Generate a QR code from text or a link',
    async execute(sock, msg, args, ctx) {
        const text = args.join(' ');
        if (!text) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'qr <text or link>' });

        try {
            const buffer = await QRCode.toBuffer(text, {
                color: { dark: '#000000', light: '#ffffff' },
                width: 500
            });

            await sock.sendMessage(ctx.sender, {
                image: buffer,
                caption: '🔳 *QR Code:* ' + text
            });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Error generating QR: ' + e.message });
        }
    }
};
