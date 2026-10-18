const fetch = globalThis.fetch;

module.exports = {
    name: 'shorturl',
    category: 'tools',
    description: 'Shorten a long URL',
    aliases: ['shorten', 'tiny'],
    async execute(sock, msg, args, ctx) {
        const longUrl = args[0];
        if (!longUrl || !longUrl.startsWith('http')) {
            return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'shorturl <url>\nExample: ' + ctx.prefix + 'shorturl https://github.com/Zyb3rKr4ft' });
        }

        try {
            const apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`;
            const res = await fetch(apiUrl);
            if (!res.ok) throw new Error('API failed');
            
            const shortUrl = await res.text();
            
            await sock.sendMessage(ctx.sender, { 
                text: `🔗 *Original:* ${longUrl}\n✂️ *Shortened:* ${shortUrl}` 
            });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Error shortening URL: ' + e.message });
        }
    }
};
