const fetch = globalThis.fetch;

module.exports = {
    name: 'moviebox',
    category: 'downloads',
    description: 'Search for movies (MovieBox + Net9ja fallback)',
    aliases: ['mb', 'movie'],
    async execute(sock, msg, args, ctx) {
        const query = args.join(' ').trim();
        if (!query) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'moviebox <movie name>' });

        await sock.sendMessage(ctx.sender, { text: '🎬 Searching for "' + query + '"...' });

        try {
            // 1. Try MovieBox
            let apiUrl = `https://api.omegatech.app/api/movie/MovieBox-pro?action=search&keyword=${encodeURIComponent(query)}`;
            let res = await fetch(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(15000) });
            let data = await res.json();

            let results = data?.data?.results || [];

            // 2. Fallback to Net9ja if MovieBox fails
            if (results.length === 0) {
                console.log('MovieBox returned 0 results, falling back to Net9ja...');
                apiUrl = `https://api.omegatech.app/api/movie/net9ja?action=search&query=${encodeURIComponent(query)}`;
                res = await fetch(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(15000) });
                data = await res.json();
                
                // Net9ja response structure is slightly different
                results = data?.data?.results || data?.results || [];
            }

            if (results.length === 0) {
                return sock.sendMessage(ctx.sender, { text: '❌ No results found for "' + query + '" on either MovieBox or Net9ja.' });
            }

            const topResults = results.slice(0, 5);
            let text = `🎬 *Search Results for "${query}"*\n\n`;

            topResults.forEach((item, index) => {
                const year = item.releaseDate ? item.releaseDate.split('-')[0] : 'N/A';
                const type = item.subjectType === 2 ? '📺 Series' : '🎥 Movie';
                
                // MovieBox uses item.cover.url, Net9ja uses item.poster
                const poster = item.cover?.url || item.poster;
                
                text += `${index + 1}. *${item.title}* (${year})\n`;
                text += `   ${type} | ⭐ ${item.imdbRatingValue || 'N/A'}\n\n`;
            });

            // Try to send the poster of the first result
            const firstPoster = topResults[0].cover?.url || topResults[0].poster;

            if (firstPoster) {
                try {
                    const imgRes = await fetch(firstPoster, {
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    if (imgRes.ok) {
                        const buffer = Buffer.from(await imgRes.arrayBuffer());
                        await sock.sendMessage(ctx.sender, { image: buffer, caption: text });
                        return;
                    }
                } catch (e) {
                    console.log('Cover image failed to download');
                }
            }

            await sock.sendMessage(ctx.sender, { text: text });

        } catch (e) {
            console.log('Movie search error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ Error: ' + e.message });
        }
    }
};
