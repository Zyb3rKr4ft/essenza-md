const fetch = globalThis.fetch;

module.exports = {
    name: 'lyrics',
    category: 'tools',
    description: 'Fetch song lyrics',
    aliases: ['lyric'],
    async execute(sock, msg, args, ctx) {
        const query = args.join(' ');
        if (!query) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'lyrics <artist> - <song>\nExample: ' + ctx.prefix + 'lyrics Burna Boy - Last Last' });

        let artist, title;
        if (query.includes('-')) {
            [artist, title] = query.split('-').map(s => s.trim());
        } else {
            return sock.sendMessage(ctx.sender, { text: '❌ Please separate artist and title with a dash (-).\nExample: ' + ctx.prefix + 'lyrics Burna Boy - Last Last' });
        }

        await sock.sendMessage(ctx.sender, { text: '🔍 Searching for lyrics...' });

        try {
            const apiUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
            const res = await fetch(apiUrl, { signal: AbortSignal.timeout(15000) });
            const data = await res.json();

            if (!data.lyrics) {
                return sock.sendMessage(ctx.sender, { text: '❌ Lyrics not found.' });
            }

            const lyrics = data.lyrics.trim();
            // Split into chunks if it's too long
            const chunks = lyrics.match(/[\s\S]{1,4000}/g) || [];
            let caption = `🎵 *${title}* - ${artist}\n\n`;
            
            await sock.sendMessage(ctx.sender, { text: caption + chunks[0] });
            for(let i = 1; i < chunks.length; i++) {
                await new Promise(r => setTimeout(r, 1000));
                await sock.sendMessage(ctx.sender, { text: chunks[i] });
            }

        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Error fetching lyrics: ' + e.message });
        }
    }
};
