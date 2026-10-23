const fetch = globalThis.fetch;

global.appleCache = global.appleCache || {};

module.exports = {
    name: 'apple',
    category: 'downloads',
    description: 'Search and download from Apple Music',
    aliases: ['applemusic'],
    async execute(sock, msg, args, ctx) {
        const input = args.join(' ').trim();
        if (!input) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'apple <song name> [number]' });

        const parts = input.split(' ');
        const lastPart = parts[parts.length - 1];
        const isNumber = /^\d+$/.test(lastPart);
        const sender = ctx.realSender;

        // Handle selection
        if (isNumber) {
            const num = parseInt(lastPart) - 1;
            const query = parts.slice(0, -1).join(' ');
            const cache = global.appleCache[sender];
            
            if (!cache || !cache[num]) return sock.sendMessage(ctx.sender, { text: '❌ Invalid selection or search expired.' });
            const song = cache[num];

            await sock.sendMessage(ctx.sender, { text: `⬇️ Downloading: ${song.title} - ${song.artist}...` });

            try {
                const dlUrl = `https://api.omegatech.app/api/Search/Applemusic?action=download&query=${encodeURIComponent(query)}&url=${encodeURIComponent(song.url)}`;
                const dlRes = await fetch(dlUrl, { signal: AbortSignal.timeout(60000) });
                const dlData = await dlRes.json();
                
                if (!dlData.success || !dlData.data.downloadUrl) throw new Error('Failed to get download link');

                const audioRes = await fetch(dlData.data.downloadUrl);
                const audioBuf = Buffer.from(await audioRes.arrayBuffer());

                await sock.sendMessage(ctx.sender, { 
                    audio: audioBuf, 
                    mimetype: 'audio/mpeg', 
                    ptt: false, 
                    fileName: `${song.title}.mp3` 
                });
                await sock.sendMessage(ctx.sender, { text: `✅ Downloaded: *${song.title}*` });
            } catch (e) { await sock.sendMessage(ctx.sender, { text: '❌ Download Error: ' + e.message }); }
            return;
        }

        // Handle Search
        await sock.sendMessage(ctx.sender, { text: `🔍 Searching Apple Music for "${input}"...` });
        try {
            const res = await fetch(`https://api.omegatech.app/api/Search/Applemusic?action=search&query=${encodeURIComponent(input)}`);
            const data = await res.json();

            if (!data.success || !data.data.results || data.data.results.length === 0) {
                throw new Error('No results found.');
            }

            const results = data.data.results.slice(0, 5);
            global.appleCache[sender] = results;

            let text = `🎵 *Apple Music Results*\n\n`;
            results.forEach((song, i) => {
                text += `${i + 1}. *${song.title}* - ${song.artist}\n`;
            });
            text += `\n💡 Reply with: ${ctx.prefix}apple ${input} <number>`;
            
            await sock.sendMessage(ctx.sender, { text });
        } catch (e) { await sock.sendMessage(ctx.sender, { text: '❌ Error: ' + e.message }); }
    }
};
