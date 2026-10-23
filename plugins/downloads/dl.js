const fetch = globalThis.fetch;

global.dlCache = global.dlCache || {};

async function downloadBuffer(url) {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(60000) });
    if (!res.ok) throw new Error('Download failed: HTTP ' + res.status);
    return Buffer.from(await res.arrayBuffer());
}

module.exports = {
    name: 'dl',
    category: 'downloads',
    description: 'Universal media downloader',
    aliases: ['yt', 'ig', 'fb', 'tt', 'tw', 'sn', 'bili'],
    async execute(sock, msg, args, ctx) {
        const sender = ctx.realSender;
        const input = args.join(' ').trim();

        // Handle user selecting a specific media type from cache
        if (input.startsWith('video ') || input.startsWith('audio ') || input.startsWith('photo ')) {
            const cache = global.dlCache[sender];
            if (!cache) return sock.sendMessage(ctx.sender, { text: '❌ No media session found. Please search a URL first.' });

            const [type, idxStr] = input.split(' ');
            const idx = parseInt(idxStr);
            const list = cache[type + 's'] || [];

            if (!list[idx]) return sock.sendMessage(ctx.sender, { text: '❌ Invalid selection index.' });

            const selected = list[idx];
            await sock.sendMessage(ctx.sender, { text: `⬇️ Downloading ${type}...` });

            try {
                const buffer = await downloadBuffer(selected.url);
                if (type === 'video') {
                    if (buffer.length > 16 * 1024 * 1024) {
                        await sock.sendMessage(ctx.sender, { document: buffer, mimetype: 'video/mp4', fileName: 'video.mp4', caption: '📹 Video (Too large for inline)' });
                    } else {
                        await sock.sendMessage(ctx.sender, { video: buffer, mimetype: 'video/mp4', caption: '📹 Video' });
                    }
                } else if (type === 'audio') {
                    await sock.sendMessage(ctx.sender, { audio: buffer, mimetype: 'audio/mpeg', ptt: false, fileName: 'audio.mp3' });
                } else if (type === 'photo') {
                    await sock.sendMessage(ctx.sender, { image: buffer, caption: '🖼️ Photo' });
                }
            } catch (e) {
                await sock.sendMessage(ctx.sender, { text: '❌ Download failed: ' + e.message });
            }
            return;
        }

        // Handle new URL input
        const urlMatch = input.match(/(https?:\/\/[^\s]+)/i);
        if (!urlMatch) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'dl <url>\nExample: ' + ctx.prefix + 'dl https://vm.tiktok.com/...' });

        const url = urlMatch[0];
        await sock.sendMessage(ctx.sender, { text: '⏳ Fetching media info...' });

        try {
            const apiUrl = `https://api.omegatech.app/api/download/All-downloader-v2?action=download&url=${encodeURIComponent(url)}`;
            const res = await fetch(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(60000) });
            const data = await res.json();

            if (!data.success || !data.data) throw new Error('Failed to extract media.');

            const { title, author, source, videos = [], audios = [], photos = [] } = data.data;

            if (videos.length === 0 && audios.length === 0 && photos.length === 0) {
                return sock.sendMessage(ctx.sender, { text: '❌ No downloadable media found in this link.' });
            }

            // Save to cache
            global.dlCache[sender] = { videos, audios, photos };

            let text = `📥 *Media Found*\n\n🎬 Title: ${title || 'Unknown'}\n👤 Author: ${author || 'Unknown'}\n📹 Source: ${source || 'Unknown'}\n\n`;
            if (videos.length) text += `🎥 *Videos:* Reply with ${ctx.prefix}dl video <number> (0-${videos.length - 1})\n`;
            if (audios.length) text += `🎵 *Audios:* Reply with ${ctx.prefix}dl audio <number> (0-${audios.length - 1})\n`;
            if (photos.length) text += `🖼️ *Photos:* Reply with ${ctx.prefix}dl photo <number> (0-${photos.length - 1})\n`;

            await sock.sendMessage(ctx.sender, { text });

        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Error: ' + e.message });
        }
    }
};
