const fetch = globalThis.fetch;
module.exports = {
    name: 'sport', category: 'tools', description: 'Get live scores', aliases: ['sports', 'matches'],
    async execute(sock, msg, args, ctx) {
        await sock.sendMessage(ctx.sender, { text: '⚽ Fetching latest sports matches...' });
        try {
            const res = await fetch('https://api.omegatech.app/api/Sport/Sport?action=matches', { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const data = await res.json();
            if (!data.success || !data.data) throw new Error('Could not fetch matches');
            let text = '⚽ *Live & Recent Matches*\n\n';
            data.data.matches.slice(0, 8).forEach(m => {
                text += `🏆 *${m.league}*\n${m.home.name} *${m.home.score} - ${m.away.score}* ${m.away.name}\n${m.isLive ? '🔴 LIVE' : '🏁 Ended'}\n\n`;
            });
            await sock.sendMessage(ctx.sender, { text });
        } catch (e) { await sock.sendMessage(ctx.sender, { text: '❌ Error: ' + e.message }); }
    }
};
