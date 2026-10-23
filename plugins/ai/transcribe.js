const baileys = require('@whiskeysockets/baileys');
const fetch = globalThis.fetch;

async function uploadToCatbox(buffer, filename) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', new Blob([buffer]), filename || 'audio.mp3');
    const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form });
    if (!res.ok) throw new Error('Catbox upload failed');
    return (await res.text()).trim();
}

module.exports = {
    name: 'transcribe',
    category: 'ai',
    description: 'Transcribe a replied voice note or audio file',
    aliases: ['stt', 'totext'],
    async execute(sock, msg, args, ctx) {
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const audioMsg = quoted?.audioMessage || msg.message.audioMessage;
        
        if (!audioMsg) return sock.sendMessage(ctx.sender, { text: '❌ Reply to a voice note or audio file with ' + ctx.prefix + 'transcribe' });

        await sock.sendMessage(ctx.sender, { text: '🎙️ Uploading and transcribing audio...' });

        try {
            const stream = await baileys.downloadContentFromMessage(audioMsg, 'audio');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            const audioUrl = await uploadToCatbox(buffer, 'audio.mp3');
            
            // Using OmegaTech's All-Ai endpoint for transcription
            const apiUrl = `https://api.omegatech.app/api/ai/All-Ai?action=transcribe&audioUrl=${encodeURIComponent(audioUrl)}`;
            const res = await fetch(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(60000) });
            const data = await res.json();
            
            console.log('TRANSCRIBE RESPONSE:', JSON.stringify(data).slice(0, 200));

            if (!data.success || !data.reply) throw new Error('Could not transcribe audio.');

            await sock.sendMessage(ctx.sender, { text: `📝 *Transcription:*\n\n${data.reply}` });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Transcription Error: ' + e.message });
        }
    }
};
