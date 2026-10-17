const fetch = globalThis.fetch;

module.exports = {
    name: 'txt2video',
    category: 'ai',
    description: 'Generate a video directly from a text prompt',
    aliases: ['t2v', 'vid'],
    async execute(sock, msg, args, ctx) {
        const prompt = args.join(' ').trim();
        if (!prompt) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'txt2video <describe the video>\nExample: ' + ctx.prefix + 'txt2video A cow walking in the city' });

        await sock.sendMessage(ctx.sender, { text: '🎬 Generating video from text... This may take 1-2 minutes.' });

        try {
            // The Txt2video endpoint is synchronous, so we just await the fetch
            const apiUrl = `https://api.omegatech.app/api/ai/Txt2video?action=generate&prompt=${encodeURIComponent(prompt)}&ratio=auto&sound=true`;
            
            // Increase timeout to 3 minutes for video generation
            const res = await fetch(apiUrl, { signal: AbortSignal.timeout(180000) });
            if (!res.ok) throw new Error('HTTP ' + res.status);

            const data = await res.json();
            console.log('TXT2VIDEO RESPONSE:', JSON.stringify(data, null, 2));

            if (!data.success || !data.data || !data.data.videoUrl) {
                throw new Error('No video URL returned');
            }

            const videoUrl = data.data.videoUrl;
            console.log('Downloading video from:', videoUrl);

            // Download the generated video
            const videoRes = await fetch(videoUrl);
            if (!videoRes.ok) throw new Error('Failed to download video');
            const buffer = Buffer.from(await videoRes.arrayBuffer());
            
            const sizeMB = (buffer.length / 1024 / 1024).toFixed(1);
            console.log('Video downloaded: ' + sizeMB + ' MB');

            if (buffer.length > 16 * 1024 * 1024) {
                await sock.sendMessage(ctx.sender, {
                    document: buffer,
                    mimetype: 'video/mp4',
                    fileName: 'generated.mp4',
                    caption: '🎬 ' + prompt + ' (' + sizeMB + ' MB — sent as file)'
                });
            } else {
                await sock.sendMessage(ctx.sender, {
                    video: buffer,
                    mimetype: 'video/mp4',
                    caption: '🎬 *' + prompt + '*',
                    gifPlayback: false,
                    ptv: false
                });
            }
            console.log('Video sent');

        } catch (e) {
            console.log('Txt2Video error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ Text-to-Video Error: ' + e.message });
        }
    }
};
