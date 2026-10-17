const fetch = globalThis.fetch;

module.exports = {
    name: 'moviebox',
    category: 'downloads',
    description: 'Search for movies and series on MovieBox',
    aliases: ['mb', 'mbsearch'],
    async execute(sock, msg, args, ctx) {
        const query = args.join(' ').trim();
        if (!query) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'moviebox <movie name>' });

        await sock.sendMessage(ctx.sender, { text: '🎬 Searching MovieBox for "' + query + '"...' });

        try {
            const apiUrl = `https://api.omegatech.app/api/movie/MovieBox-pro?action=search&keyword=${encodeURIComponent(query)}`;
            const res = await fetch(apiUrl, { 
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                signal: AbortSignal.timeout(30000) 
            });
            const data = await res.json();

            if (!data.success || !data.data || !data.data.results || data.data.results.length === 0) {
                return sock.sendMessage(ctx.sender, { text: '❌ No results found for "' + query + '"' });
            }

            const results = data.data.results.slice(0, 5);
            let text = `🎬 *MovieBox Results for "${query}"*\n\n`;

            results.forEach((item, index) => {
                const year = item.releaseDate ? item.releaseDate.split('-')[0] : 'N/A';
                const type = item.subjectType === 2 ? '📺 Series' : '🎥 Movie';
                text += `${index + 1}. *${item.title}* (${year})\n`;
                text += `   ${type} | ⭐ ${item.imdbRatingValue || 'N/A'}\n\n`;
            });
            
            const coverUrl = results[0].cover?.url;

            if (coverUrl) {
                try {
                    // ADDED USER-AGENT HEADER TO BYPASS CDN BLOCK
                    const imgRes = await fetch(coverUrl, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
                    });
                    if (!imgRes.ok) throw new Error('CDN returned ' + imgRes.status);
                    const buffer = Buffer.from(await imgRes.arrayBuffer());
                    await sock.sendMessage(ctx.sender, { image: buffer, caption: text });
                    return;
                } catch (e) {
                    console.log('Moviebox cover failed:', e.message);
                }
            }

            await sock.sendMessage(ctx.sender, { text: text });

        } catch (e) {
            console.log('MovieBox error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ MovieBox Error: ' + e.message });
        }
    }
};
