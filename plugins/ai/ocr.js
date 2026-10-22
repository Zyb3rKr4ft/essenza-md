const baileys = require('@whiskeysockets/baileys');
const fetch = globalThis.fetch;

async function uploadToCatbox(buffer) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', new Blob([buffer]), 'image.jpg');
    const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form });
    if (!res.ok) throw new Error('Catbox upload failed');
    return (await res.text()).trim();
}

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

            const imageUrl = await uploadToCatbox(buffer);
            
            // Using OmegaTech's All-Ai endpoint for OCR
            const apiUrl = `https://api.omegatech.app/api/ai/All-Ai?action=ocr&imageUrl=${encodeURIComponent(imageUrl)}`;
            const res = await fetch(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(60000) });
            const data = await res.json();

            console.log('OCR RESPONSE:', JSON.stringify(data, null, 2));

            if (!data.success || !data.reply) throw new Error('No text found in the image.');

            await sock.sendMessage(ctx.sender, { text: `📄 *Extracted Text:*\n\n${data.reply}` });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ OCR Error: ' + e.message });
        }
    }
};
