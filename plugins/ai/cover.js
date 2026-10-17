const baileys = require('@whiskeysockets/baileys');
const fetch = globalThis.fetch;

// Helper: Upload audio buffer to Catbox to get a public URL
async function uploadToCatbox(buffer, filename) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', new Blob([buffer]), filename || 'audio.mp3');

    const res = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: form
    });
    
    if (!res.ok) throw new Error('Catbox upload failed: ' + res.status);
    const url = await res.text();
    if (!url.startsWith('https://')) throw new Error('Catbox returned invalid URL: ' + url);
    return url.trim();
}

module.exports = {
    name: 'cover',
    category: 'ai',
    description: 'Create an AI cover of a song using a specific voice model',
    aliases: ['remix', 'musiccover'],
    async execute(sock, msg, args, ctx) {
        const model = args[0] || 'prince'; // Default to 'prince'
        const urlInput = args[1];
        
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const audioMsg = quoted?.audioMessage || msg.message.audioMessage;
        
        if (!urlInput && !audioMsg) {
            return sock.sendMessage(ctx.sender, { 
                text: 'Usage:\n' + 
                      '1. Reply to an audio message: ' + ctx.prefix + 'cover [model]\n' + 
                      '2. Provide a direct URL: ' + ctx.prefix + 'cover [model] <audio_url>\n\n' +
                      'Example: ' + ctx.prefix + 'cover prince https://example.com/song.mp3\n' +
                      'Available models: prince, taylor, drake, etc.' 
            });
        }

        await sock.sendMessage(ctx.sender, { text: `🎤 Starting AI cover generation (Model: ${model})...` });

        try {
            let songUrl = urlInput;

            // If no URL provided, download the replied audio and upload to Catbox
            if (!songUrl && audioMsg) {
                await sock.sendMessage(ctx.sender, { text: '⬆️ Uploading your audio file...' });
                const stream = await baileys.downloadContentFromMessage(audioMsg, 'audio');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                
                if (buffer.length > 20 * 1024 * 1024) {
                    throw new Error('Audio file is too large (max 20MB for Catbox).');
                }

                songUrl = await uploadToCatbox(buffer, 'song.mp3');
                console.log('Uploaded to Catbox:', songUrl);
            }

            // 1. Submit the task
            const submitUrl = `https://api.omegatech.app/api/ai/Remusic-cover?action=cover_async&songUrl=${encodeURIComponent(songUrl)}&model=${encodeURIComponent(model)}&outputFormat=mp3&pitchChange=no-change&modelType=1`;
            
            const submitRes = await fetch(submitUrl, { signal: AbortSignal.timeout(30000) });
            const submitData = await submitRes.json();

            console.log('COVER SUBMIT RESPONSE:', JSON.stringify(submitData, null, 2));

            if (!submitData.success || !submitData.data || !submitData.data.taskId) {
                throw new Error('Failed to create cover task: ' + (submitData.message || 'Unknown error'));
            }

            const taskId = submitData.data.taskId;
            await sock.sendMessage(ctx.sender, { text: '⏳ Cover is generating... This takes 1-3 minutes. I will send it when ready.' });

            // 2. Poll for status
            let finalAudioUrl = null;
            for (let i = 0; i < 30; i++) {
                await new Promise(r => setTimeout(r, 10000));
                
                const statusUrl = `https://api.omegatech.app/api/ai/Remusic-cover?action=status&taskId=${encodeURIComponent(taskId)}`;
                const statusRes = await fetch(statusUrl);
                const statusData = await statusRes.json();
                
                console.log(`Poll ${i + 1} status:`, statusData.data?.status);

                if (statusData.success && statusData.data) {
                    if (statusData.data.status === 'success' || statusData.data.status === 'completed') {
                        // Check for various possible URL fields
                        finalAudioUrl = statusData.data.url || statusData.data.audioUrl || statusData.data.result?.url || statusData.data.audio;
                        break;
                    }
                    if (statusData.data.status === 'failed' || statusData.data.status === 'error') {
                        throw new Error('Generation failed: ' + (statusData.data.message || 'Unknown error'));
                    }
                }
            }

            if (!finalAudioUrl) throw new Error('Cover generation timed out after 5 minutes.');

            // 3. Download and send
            await sock.sendMessage(ctx.sender, { text: '⬇️ Downloading final cover...' });
            const audioRes = await fetch(finalAudioUrl);
            const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
            
            const sizeMB = (audioBuffer.length / 1024 / 1024).toFixed(1);
            console.log('Cover downloaded:', sizeMB, 'MB');

            await sock.sendMessage(ctx.sender, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: `cover_${model}.mp3`
            });
            console.log('Cover sent successfully!');

        } catch (e) {
            console.log('Cover error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ Cover Error: ' + e.message });
        }
    }
};
