const fetch = globalThis.fetch;

module.exports = {
    name: 'rch',
    category: 'tools',
    description: 'Send VIP reactions to WhatsApp channel posts',
    aliases: ['vipreact', 'reactch'],
    async execute(sock, msg, args, ctx) {
        const input = args.join(' ').trim();
        if (!input) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'rch <channel_url> <emoji>' });

        const urlMatch = input.match(/(https?:\/\/[^\s]+)/i);
        if (!urlMatch) return sock.sendMessage(ctx.sender, { text: '❌ Please provide a valid WhatsApp channel post URL.' });

        const channelUrl = urlMatch[0];
        let emoji = input.replace(channelUrl, '').trim() || '😁';

        await sock.sendMessage(ctx.sender, { text: `🔄 Sending VIP reaction (${emoji})... This may take 10-15 seconds.` });

        try {
            const apiUrl = `https://api.omegatech.app/api/Fun/Rch?action=react&url=${encodeURIComponent(channelUrl)}&emoji=${encodeURIComponent(emoji)}`;
            const res = await fetch(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(30000) });
            const data = await res.json();

            if (!data.success || !data.data || !data.data.ok) {
                throw new Error(data.message || 'Reaction failed.');
            }

            let text = `✅ *VIP Reaction Queued!*\n\n`;
            text += `🔗 Target: ${data.data.target}\n`;
            text += `😁 Emojis: ${data.data.emojis}\n`;
            text += `⏱️ Time: ${data.data.time}\n`;
            text += `📋 Task ID: ${data.data.task_id}\n`;
            text += `💎 Points Remaining: ${data.data.points_remaining.toLocaleString()}\n\n`;
            text += `_Reactions are added to a queue and may take a few seconds to appear._`;

            await sock.sendMessage(ctx.sender, { text });

        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Error: ' + e.message });
        }
    }
};
