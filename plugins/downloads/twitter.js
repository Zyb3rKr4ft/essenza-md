const fetch = globalThis.fetch;

module.exports = {
    name: 'twitter',
    category: 'downloads',
    description: 'Download video or image from X (Twitter)',
    aliases: ['x', 'tw', 'xdl'],
    async execute(sock, msg, args, ctx) {
        const url = args[0];
        if (!url || (!url.includes('x.com') && !url.includes('twitter.com'))) {
            return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'twitter <X/Twitter link>\nExample: ' + ctx.prefix + 'twitter https://x.com/user/status/12345' });
        }

        await sock.sendMessage(ctx.sender, { text: '🔍 Fetching X media...' });

        try {
            const apiUrl = `https://api.omegatech.app/api/download/X?action=download&url=${encodeURIComponent(url)}`;
            const res = await fetch(apiUrl, { signal: AbortSignal.timeout(30000) });
            if (!res.ok) throw new Error('HTTP ' + res.status);

            const data = await res.json();
            console.log('X RESPONSE:', JSON.stringify(data, null, 2));

            if (!data.success || !data.data || !data.data.media || data.data.media.length === 0) {
                throw new Error('No media found in this tweet.');
            }

            const media = data.data.media[0];
            let downloadUrl = null;

            // 1. Check for best_url
            if (media.best_url) {
                downloadUrl = media.best_url;
            } 
            // 2. Check the variants array (standard Twitter API format)
            else if (media.variants && media.variants.length > 0) {
                // Find the highest bitrate mp4
                const mp4s = media.variants.filter(v => v.content_type === 'video/mp4');
                if (mp4s.length > 0) {
                    mp4s.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
                    downloadUrl = mp4s[0].url;
                }
            }
            // 3. Check playlist
            else if (media.playlist) {
                downloadUrl = media.playlist;
            }

            if (!downloadUrl) {
                // If no video link is found but there is a thumbnail
                if (media.thumbnail_url) {
                    await sock.sendMessage(ctx.sender, { text: '⚠️ Video link is unavailable (API returned empty variants). Sending thumbnail instead...' });
                    const thumbRes = await fetch(media.thumbnail_url);
                    const thumbBuf = Buffer.from(await thumbRes.arrayBuffer());
                    return sock.sendMessage(ctx.sender, { image: thumbBuf, caption: '🖼️ Thumbnail for: ' + (data.data.text || 'Tweet') });
                }
                throw new Error('No downloadable video URL found in API response.');
            }

            console.log('Downloading from:', downloadUrl);

            // Download the video
            const vidRes = await fetch(downloadUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (!vidRes.ok) throw new Error('Failed to download video file');
            const videoBuf = Buffer.from(await vidRes.arrayBuffer());
            
            const sizeMB = (videoBuf.length / 1024 / 1024).toFixed(1);
            console.log('Video downloaded: ' + sizeMB + ' MB');

            const caption = '🐦 ' + (data.data.text || 'X Video').slice(0, 100);

            if (videoBuf.length > 16 * 1024 * 1024) {
                await sock.sendMessage(ctx.sender, {
                    document: videoBuf,
                    mimetype: 'video/mp4',
                    fileName: 'twitter_video.mp4',
                    caption: caption + '\n(Too large for video message, sent as file)'
                });
            } else {
                await sock.sendMessage(ctx.sender, {
                    video: videoBuf,
                    mimetype: 'video/mp4',
                    caption: caption,
                    gifPlayback: false,
                    ptv: false
                });
            }
            console.log('X video sent successfully');

        } catch (e) {
            console.log('X download error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ X Error: ' + e.message });
        }
    }
};
