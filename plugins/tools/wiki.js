const fetch = globalThis.fetch;

module.exports = {
    name: 'wiki',
    category: 'tools',
    description: 'Search Wikipedia for a quick summary',
    aliases: ['wikipedia'],
    async execute(sock, msg, args, ctx) {
        const query = args.join(' ').trim();
        if (!query) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'wiki <topic>' });

        await sock.sendMessage(ctx.sender, { text: '📚 Searching Wikipedia...' });

        try {
            const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
            const res = await fetch(url, { headers: { 'User-Agent': 'EssenzaMD/1.0' } });
            
            if (!res.ok) throw new Error('Article not found');
            
            const data = await res.json();
            
            if (!data.extract) throw new Error('No summary available');

            let text = `📚 *${data.title}*\n\n${data.extract}`;
            
            if (data.content_urls?.desktop?.page) {
                text += `\n\n🔗 *Read more:* ${data.content_urls.desktop.page}`;
            }

            if (data.thumbnail?.source) {
                try {
                    const imgRes = await fetch(data.thumbnail.source);
                    const buffer = Buffer.from(await imgRes.arrayBuffer());
                    return await sock.sendMessage(ctx.sender, { image: buffer, caption: text });
                } catch (e) {
                    // Fallback to text if image fails
                }
            }

            await sock.sendMessage(ctx.sender, { text: text });
        } catch (e) {
            console.log('Wiki error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ Wikipedia Error: ' + e.message });
        }
    }
};
