const fetch = globalThis.fetch;

module.exports = {
    name: 'sports',
    category: 'tools',
    description: 'Get live and recent football scores',
    aliases: ['scores', 'matches'],
    async execute(sock, msg, args, ctx) {
        await sock.sendMessage(ctx.sender, { text: '⚽ Fetching latest sports matches...' });

        try {
            const url = 'https://api.omegatech.app/api/Sport/Sport?action=matches';
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(30000) });
            const data = await res.json();

            if (!data.success || !data.data || !data.data.matches) {
                throw new Error('Could not fetch matches');
            }

            const matches = data.data.matches;
            if (matches.length === 0) return sock.sendMessage(ctx.sender, { text: '❌ No matches found right now.' });

            let text = '⚽ *Live & Recent Matches*\n\n';

            // Show top 8 matches to avoid spam
            matches.slice(0, 8).forEach(m => {
                const liveIndicator = m.isLive ? '🔴 LIVE' : (m.isEnded ? '🏁 Ended' : '⏳ Upcoming');
                text += `🏆 *${m.league}*\n`;
                text += `${m.home.name} *${m.home.score} - ${m.away.score}* ${m.away.name}\n`;
                text += `${liveIndicator}\n\n`;
            });

            text += `💡 _Use_ ${ctx.prefix}highlight <team> _to get a match highlight!_`;

            await sock.sendMessage(ctx.sender, { text: text });

        } catch (e) {
            console.log('Sports error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ Sports Error: ' + e.message });
        }
    }
};
