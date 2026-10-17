const yt = require('@denzy-official/youtube_scraper');

module.exports = {
    name: 'play',
    category: 'downloads',
    description: 'Search and play audio from YouTube',
    aliases: ['song', 'music2'],
    async execute(sock, msg, args, ctx) {
        const input = args.join(' ').trim();
        if (!input) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'play <song name or URL>' });

        await sock.sendMessage(ctx.sender, { text: '🔍 Searching YouTube...' });

        try {
            // Search and get the direct MP3 URL
            const result = await yt.ytmp3(input);
            if (!result.status || !result.download || !result.download.url) {
                throw new Error('Could not extract audio URL');
            }

            const title = result.metadata.title || 'YouTube Audio';
            const audioUrl = result.download.url;
            const sizeMB = (result.download.filesize / 1024 / 1024).toFixed(1);
            
            await sock.sendMessage(ctx.sender, { text: `🎵 *${title}*\n📦 ${sizeMB} MB\n⬇️ Downloading...` });

            // Download the audio buffer
            const res = await fetch(audioUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                signal: AbortSignal.timeout(60000)
            });
            
            if (!res.ok) throw new Error('Download failed: ' + res.status);
            const buffer = Buffer.from(await res.arrayBuffer());
            
            console.log('Audio downloaded: ' + (buffer.length / 1024 / 1024).toFixed(1) + ' MB');

            const safeTitle = title.replace(/[^\w\s-]/g, '').slice(0, 60);

            // Try to send as audio, fallback to document
            try {
                await sock.sendMessage(ctx.sender, {
                    audio: buffer,
                    mimetype: 'audio/mpeg',
                    ptt: false,
                    fileName: safeTitle + '.mp3'
                });
                console.log('Audio sent');
            } catch (sendErr) {
                console.log('Audio upload failed, sending as document...');
                await sock.sendMessage(ctx.sender, {
                    document: buffer,
                    mimetype: 'audio/mpeg',
                    fileName: safeTitle + '.mp3',
                    caption: '🎵 ' + title
                });
            }
        } catch (e) {
            console.log('Play error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ Play Error: ' + e.message });
        }
    }
};
