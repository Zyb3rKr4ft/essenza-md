const baileys = require('@whiskeysockets/baileys');
const fetch = globalThis.fetch;

async function uploadToCatbox(buffer) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', new Blob([buffer]), 'image.jpg');
    const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form });
    if (!res.ok) throw new Error('Catbox upload failed: ' + res.status);
    const url = await res.text();
    if (!url.startsWith('https://')) throw new Error('Catbox returned invalid URL: ' + url);
    return url.trim();
}

module.exports = {
    name: 'animate',
    category: 'ai',
    description: 'Animate an image with a prompt (Image-to-Video)',
    aliases: ['i2v', 'wan'],
    async execute(sock, msg, args, ctx) {
        const prompt = args.join(' ').trim();
        if (!prompt) return sock.sendMessage(ctx.sender, { text: 'Usage: Reply to an image with ' + ctx.prefix + 'animate <prompt>\nExample: ' + ctx.prefix + 'animate A cow walking in the city' });

        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMsg = quoted?.imageMessage || msg.message.imageMessage;
        
        if (!imageMsg) {
            return sock.sendMessage(ctx.sender, { text: '❌ Please reply to an image with this command.' });
        }

        await sock.sendMessage(ctx.sender, { text: '🎬 Uploading image and starting video generation...' });

        try {
            const stream = await baileys.downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            const imageUrl = await uploadToCatbox(buffer);
            console.log('Image uploaded to Catbox:', imageUrl);

            const submitUrl = `https://api.omegatech.app/api/ai/Wan-fast?action=submit&image=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}&aspectRatio=16:9`;
            const submitRes = await fetch(submitUrl);
            const submitData = await submitRes.json();

            if (!submitData.success || !submitData.data || !submitData.data.taskId) {
                throw new Error('Failed to submit task: ' + JSON.stringify(submitData));
            }

            const taskId = submitData.data.taskId;
            console.log('Video task submitted:', taskId);
            await sock.sendMessage(ctx.sender, { text: '⏳ Video is generating... This usually takes 1-3 minutes.' });

            let videoUrl = null;
            for (let i = 0; i < 30; i++) {
                await new Promise(r => setTimeout(r, 10000));
                const statusUrl = `https://api.omegatech.app/api/ai/Wan-fast?action=status&taskId=${encodeURIComponent(taskId)}&aspectRatio=16:9`;
                const statusRes = await fetch(statusUrl);
                const statusData = await statusRes.json();
                
                console.log(`Poll ${i + 1}:`, statusData.data?.status);

                if (statusData.success && statusData.data) {
                    if (statusData.data.status === 'success' && statusData.data.videoUrl) {
                        videoUrl = statusData.data.videoUrl;
                        break;
                    }
                    if (statusData.data.status === 'failed') {
                        throw new Error('Generation failed: ' + (statusData.data.message || 'Unknown error'));
                    }
                }
            }

            if (!videoUrl) throw new Error('Video generation timed out after 5 minutes.');

            await sock.sendMessage(ctx.sender, { text: '⬇️ Downloading final video...' });
            const videoRes = await fetch(videoUrl);
            const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
            const sizeMB = (videoBuffer.length / 1024 / 1024).toFixed(1);

            if (videoBuffer.length > 16 * 1024 * 1024) {
                await sock.sendMessage(ctx.sender, { document: videoBuffer, mimetype: 'video/mp4', fileName: 'animated.mp4', caption: '🎬 ' + prompt + ' (' + sizeMB + ' MB)' });
            } else {
                await sock.sendMessage(ctx.sender, { video: videoBuffer, mimetype: 'video/mp4', caption: '🎬 *' + prompt + '*', gifPlayback: false, ptv: false });
            }
            console.log('Video sent');

        } catch (e) {
            console.log('Animate error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ Animation Error: ' + e.message });
        }
    }
};
