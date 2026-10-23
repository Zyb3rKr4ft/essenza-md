const baileys = require('@whiskeysockets/baileys');
const fetch = globalThis.fetch;

module.exports = {
    name: 'ocr',
    category: 'ai',
    description: 'Extract text from an image (Reply to an image)',
    aliases: ['readtext'],
    async execute(sock, msg, args, ctx) {
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMsg = quoted?.imageMessage || msg.message.imageMessage;
        
        if (!imageMsg) return sock.sendMessage(ctx.sender, { text: '❌ Please reply to an image with the ' + ctx.prefix + 'ocr command.' });

        await sock.sendMessage(ctx.sender, { text: '👁️ Scanning image for text...' });

        try {
            const stream = await baileys.downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            const form = new FormData();
            form.append('file', new Blob([buffer], { type: 'image/jpeg' }), 'image.jpg');
            
            const res = await fetch('https://uapis.cn/api/v1/image/ocr', {
                method: 'POST',
                body: form,
                signal: AbortSignal.timeout(30000)
            });
            
            const data = await res.json();
            console.log('OCR RESPONSE:', JSON.stringify(data).slice(0, 200));

            // UAPI returns the text in data.text or data.plain_text
            const extractedText = data.text || data.plain_text;

            if (!extractedText) {
                throw new Error('No text found in the image.');
            }

            await sock.sendMessage(ctx.sender, { text: `📄 *Extracted Text:*\n\n${extractedText}` });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ OCR Error: ' + e.message });
        }
    }
};
