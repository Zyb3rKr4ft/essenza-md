const fetch = globalThis.fetch;

module.exports = {
    name: 'iqiyihot',
    category: 'tools',
    description: 'Get trending videos from iQIYI',
    aliases: ['iqhot'],
    async execute(sock, msg, args, ctx) {
        await sock.sendMessage(ctx.sender, { text: '🔥 Fetching trending iQIYI videos...' });

        try {
            const deviceId = '8936806dac3e27d0daf95979310002f6';
            const sid = `${deviceId}_${Date.now()}`;
            
            const url = `https://pcw-api.iq.com/api/lego/hot?platformId=4&modeCode=intl&langCode=en_us&deviceId=${deviceId}&uid=&sid=${sid}&channelId=0&size=10&vip=0&pspStatus=1`;
            
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
                    'Referer': 'https://www.iq.com/'
                },
                signal: AbortSignal.timeout(15000)
            });

            const data = await res.json();
            if (data.code !== '0') throw new Error('API returned error code: ' + data.code);

            const videos = data.data;
            if (!videos || videos.length === 0) throw new Error('No trending videos found.');

            let text = '🔥 *iQIYI Trending Now*\n\n';
            videos.slice(0, 8).forEach((v, i) => {
                const title = v.name || v.focus || 'Unknown Title';
                const rating = v.rating || 'N/A';
                const link = v.playLocSuffix ? `https://www.iq.com/play/${v.playLocSuffix}` : 'No link';
                text += `${i + 1}. *${title}* (⭐ ${rating})\n🔗 ${link}\n\n`;
            });

            await sock.sendMessage(ctx.sender, { text });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Error: ' + e.message });
        }
    }
};
