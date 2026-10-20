const fetch = globalThis.fetch;

module.exports = {
    name: 'download',
    category: 'downloads',
    description: 'Get the stream/download link for a MovieBox result',
    aliases: ['dl'],
    async execute(sock, msg, args, ctx) {
        const choice = parseInt(args[0]);
        const season = parseInt(args[1]) || 0;
        const episode = parseInt(args[2]) || 0;

        if (!choice || !global.movieboxCache || !global.movieboxCache[choice]) {
            return sock.sendMessage(ctx.sender, { text: '❌ Invalid choice. Please search first using ' + ctx.prefix + 'moviebox <name>' });
        }

        const movie = global.movieboxCache[choice];
        
        let statusMsg = `⏳ Fetching download links for *${movie.title}*`;
        if (season > 0) statusMsg += ` (S${season} E${episode})`;
        await sock.sendMessage(ctx.sender, { text: statusMsg + '...' });

        try {
            // Fetch the download endpoint
            const dlUrl = `https://api.omegatech.app/api/movie/MovieBox-pro?action=download&subjectId=${movie.subjectId}&detailPath=${encodeURIComponent(movie.detailPath)}&se=${season}&ep=${episode}`;
            const res = await fetch(dlUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(30000) });
            const data = await res.json();

            if (!data.success || !data.qualities || data.qualities.length === 0) {
                throw new Error('No download links available for this selection.');
            }

            // Extract the best quality
            const best = data.bestQuality || data.qualities[0];
            const streamUrl = best.streamUrl || best.downloadUrl;
            const sizeMB = (parseInt(best.size) / 1024 / 1024).toFixed(1);

            let text = `🎬 *${movie.title}*\n`;
            if (season > 0) text += `📺 Season ${season} • Episode ${episode}\n`;
            text += `📥 *Quality:* ${best.quality} (${sizeMB} MB)\n\n`;
            
            text += `▶️ *Watch / Stream Link:*\n${streamUrl}\n\n`;

            // Add subtitles if available
            if (data.subtitles && data.subtitles.length > 0) {
                text += `📝 *Subtitles Available:*\n`;
                // Just list a few common ones
                const common = ['en', 'ar', 'fr', 'es', 'pt'];
                const available = data.subtitles.filter(s => common.includes(s.languageCode));
                available.forEach(sub => {
                    text += `• ${sub.language}: ${sub.url}\n`;
                });
                if (available.length === 0) text += `• ${data.subtitles.length} languages available (check web).`;
            }

            text += `\n_Note: Copy the link to your browser or VLC to watch._`;

            await sock.sendMessage(ctx.sender, { text: text });

        } catch (e) {
            console.log('MB Download error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ Download Error: ' + e.message });
        }
    }
};
