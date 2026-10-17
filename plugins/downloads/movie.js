const fetch = globalThis.fetch;

async function fetchPosterBuffer(url) {
    if (!url) return null;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return Buffer.from(await res.arrayBuffer());
    } catch (e) {
        return null;
    }
}

module.exports = {
    name: 'movie',
    category: 'downloads',
    description: 'Search and download movies from Net9ja',
    aliases: ['net9ja', 'film'],
    async execute(sock, msg, args, ctx) {
        const query = args.join(' ').trim();
        if (!query) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'movie <movie name>' });

        await sock.sendMessage(ctx.sender, { text: '🎬 Searching for "' + query + '"...' });

        try {
            // Try the search action first
            let apiUrl = 'https://api.omegatech.app/api/movie/net9ja?action=search&query=' + encodeURIComponent(query);
            let res = await fetch(apiUrl);
            let data = await res.json();

            let movie = null;

            // If search works and returns results
            if (data.success && data.data && data.data.results && data.data.results.length > 0) {
                movie = data.data.results[0];
            } else {
                // Fallback: Fetch the home page and manually filter by title
                console.log('Search failed, falling back to home page filtering...');
                apiUrl = 'https://api.omegatech.app/api/movie/net9ja?action=home';
                res = await fetch(apiUrl);
                data = await res.json();
                
                if (data.success && data.data && data.data.results) {
                    const results = data.data.results;
                    // Find the first movie that matches the search query
                    movie = results.find(m => m.title.toLowerCase().includes(query.toLowerCase()));
                }
            }

            if (!movie) {
                return sock.sendMessage(ctx.sender, { text: '❌ Movie not found. Try a different search term.' });
            }

            // Format the response
            let caption = `🎬 *${movie.title}*\n\n`;
            caption += `⭐ *Genre:* ${movie.genre || 'N/A'}\n`;
            caption += `⏱ *Runtime:* ${movie.runtime || 'N/A'}\n`;
            caption += `📅 *Released:* ${new Date(movie.date).toLocaleDateString()}\n\n`;
            
            if (movie.excerpt) {
                // Clean up the excerpt (remove HTML entities if any)
                const cleanExcerpt = movie.excerpt.replace(/&#8217;/g, "'").replace(/&#8230;/g, "...").replace(/<[^>]*>?/gm, '');
                caption += `📝 *Plot:* ${cleanExcerpt}\n\n`;
            }

            if (movie.sdm_url) {
                caption += `📥 *Download Here:*\n${movie.sdm_url}`;
            } else {
                caption += `⚠️ No download link available yet.`;
            }

            // Download the poster
            let posterBuf = null;
            if (movie.poster) {
                posterBuf = await fetchPosterBuffer(movie.poster);
            }

            // Send with image if available, otherwise just text
            if (posterBuf) {
                await sock.sendMessage(ctx.sender, {
                    image: posterBuf,
                    caption: caption
                });
            } else {
                await sock.sendMessage(ctx.sender, {
                    text: caption
                });
            }

        } catch (e) {
            console.log('Movie error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ Movie Error: ' + e.message });
        }
    }
};
