const fetch = globalThis.fetch;

module.exports = {
    name: 'highlight',
    category: 'downloads',
    description: 'Download a match highlight by team name',
    aliases: ['hl', 'goal'],
    async execute(sock, msg, args, ctx) {
        const query = args.join(' ').toLowerCase().trim();
        if (!query) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'highlight <team name>\nExample: ' + ctx.prefix + 'highlight Newcastle' });

        await sock.sendMessage(ctx.sender, { text: `🔍 Searching for ${query} highlights...` });

        try {
            const url = 'https://api.omegatech.app/api/Sport/Sport?action=matches';
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(30000) });
            const data = await res.json();

            if (!data.success || !data.data || !data.data.matches) {
                throw new Error('Could not fetch matches');
            }

            // Find a match where the home or away team matches the query
            const match = data.data.matches.find(m => 
                m.home.name.toLowerCase().includes(query) || 
                m.away.name.toLowerCase().includes(query)
            );

            if (!match) throw new Error('No match found for "' + query + '"');
            if (!match.highlights || match.highlights.length === 0) {
                throw new Error(`No highlights available for ${match.home.name} vs ${match.away.name} yet.`);
            }

            // Get the first highlight (usually "Full Match Highlights")
            const highlight = match.highlights[0];
            const videoUrl = highlight.url;
            const title = highlight.title;
            
            await sock.sendMessage(ctx.sender, { text: `⬇️ Downloading: *${title}*...` });

            // Download video
            const vidRes = await fetch(videoUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (!vidRes.ok) throw new Error('Failed to download video from CDN');
            
            const buffer = Buffer.from(await vidRes.arrayBuffer());
            const sizeMB = (buffer.length / 1024 / 1024).toFixed(1);
            console.log('Highlight video downloaded:', sizeMB, 'MB');

            const caption = `⚽ *${match.home.name} ${match.home.score} - ${match.away.score} ${match.away.name}*\n🏆 ${match.league}\n\n📺 ${title}`;

            if (buffer.length > 16 * 1024 * 1024) {
                await sock.sendMessage(ctx.sender, {
                    document: buffer,
                    mimetype: 'video/mp4',
                    fileName: 'highlight.mp4',
                    caption: caption + '\n(Too large for video message, sent as file)'
                });
            } else {
                await sock.sendMessage(ctx.sender, {
                    video: buffer,
                    mimetype: 'video/mp4',
                    caption: caption,
                    gifPlayback: false
                });
            }

        } catch (e) {
            console.log('Highlight error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ Highlight Error: ' + e.message });
        }
    }
};
