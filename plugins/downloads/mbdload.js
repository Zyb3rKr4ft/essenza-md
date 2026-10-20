const fetch = globalThis.fetch;

module.exports = {
    name: 'download',
    category: 'downloads',
    description: 'Download a movie from the MovieBox search results',
    aliases: ['dl'],
    async execute(sock, msg, args, ctx) {
        const choice = parseInt(args[0]);
        if (!choice || !global.movieboxCache || !global.movieboxCache[choice]) {
            return sock.sendMessage(ctx.sender, { text: '❌ Invalid choice. Please search first using ' + ctx.prefix + 'moviebox <name>' });
        }

        const movie = global.movieboxCache[choice];
        await sock.sendMessage(ctx.sender, { text: `⏳ Fetching download links for *${movie.title}*...` });

        try {
            // 1. Get the details to find the download links
            const detailUrl = `https://api.omegatech.app/api/movie/MovieBox-pro?action=detail&keyword=&subjectId=${movie.subjectId}&detailPath=${encodeURIComponent(movie.detailPath)}`;
            const res = await fetch(detailUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(30000) });
            const data = await res.json();

            console.log('MB DETAIL RESPONSE:', JSON.stringify(data).slice(0, 500)); // Truncated log

            if (!data.success || !data.data) {
                throw new Error('Failed to fetch movie details.');
            }

            // The API might return the stream directly in the detail, or require another call.
            // Assuming it returns a list of qualities/downloads:
            const media = data.data;
            
            // Look for download links in the response structure
            let downloadUrl = null;
            
            // (This part depends heavily on the exact JSON structure the API returns. 
            // We are looking for an MP4 or HLS link)
            if (media.streamUrl) downloadUrl = media.streamUrl;
            else if (media.downloadUrl) downloadUrl = media.downloadUrl;
            else if (media.qualities && media.qualities.length > 0) downloadUrl = media.qualities[0].url;

            if (!downloadUrl) {
                // If we can't find a direct MP4, we send the details so you can see what the API returned
                await sock.sendMessage(ctx.sender, { 
                    text: `⚠️ Could not find a direct download link.\n\nThe API returned this data:\n\n${JSON.stringify(media).slice(0, 400)}...` 
                });
                return;
            }

            // Send the link to the user
            await sock.sendMessage(ctx.sender, { 
                text: `🎬 *${movie.title}*\n\n📥 *Download Link:*\n${downloadUrl}\n\n_(Note: MovieBox links expire quickly. Open this on your phone browser to download.)_` 
            });

        } catch (e) {
            console.log('MB Download error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ Download Error: ' + e.message });
        }
    }
};
