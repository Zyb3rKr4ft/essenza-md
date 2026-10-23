const baileys = require('@whiskeysockets/baileys');
const fetch = globalThis.fetch;

async function uploadToCatbox(buffer) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', new Blob([buffer]), 'image.jpg');
    const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form });
    return (await res.text()).trim();
}

module.exports = {
    name: 'makermusic',
    category: 'ai',
    description: 'Generate music from an image',
    async execute(sock, msg, args, ctx) {
        const title = args.join(' ') || 'My Song';
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMsg = quoted?.imageMessage || msg.message.imageMessage;

        if (!imageMsg) return sock.sendMessage(ctx.sender, { text: 'Reply to an image to generate music from it.' });

        await sock.sendMessage(ctx.sender, { text: '🎵 Creating music from image...' });

        try {
            const stream = await baileys.downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            const imageUrl = await uploadToCatbox(buffer);
            const apiUrl = `https://omegatech-api.dixonomega.tech/api/Maker/Music?action=generate&image=${encodeURIComponent(imageUrl)}&title=${encodeURIComponent(title)}&artist=Essenza+AI`;
            
            const res = await fetch(apiUrl, { signal: AbortSignal.timeout(60000) });
            const data = await res.json();

            if (!data.success || !data.data || !data.data.audio) {
                throw new Error('Failed to generate music.');
            }

            const audioRes = await fetch(data.data.audio);
            const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

            await sock.sendMessage(ctx.sender, { 
                audio: audioBuffer, 
                mimetype: 'audio/mpeg', 
                ptt: false, 
                fileName: title.replace(/[^\w\s-]/g, '') + '.mp3' 
            });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Error: ' + e.message });
        }
    }
};
