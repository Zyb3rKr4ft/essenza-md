const fetch = globalThis.fetch;
module.exports = {
    name: 'get', category: 'tools', description: 'Extract source code from a URL',
    async execute(sock, msg, args, ctx) {
        const url = args[0];
        if (!url || !url.startsWith('http')) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'get <url>' });
        try {
            await sock.sendMessage(ctx.sender, { text: '⬇️ Fetching source code...' });
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const text = await res.text();
            const buffer = Buffer.from(text, 'utf-8');
            await sock.sendMessage(ctx.sender, { document: buffer, mimetype: 'text/plain', fileName: 'source_code.txt' });
        } catch (e) { await sock.sendMessage(ctx.sender, { text: '❌ Error: ' + e.message }); }
    }
};
