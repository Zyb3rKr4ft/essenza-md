const fetch = globalThis.fetch;

module.exports = {
    name: 'cozelist',
    category: 'ai',
    description: 'List available AI personas for the coze command',
    aliases: ['personas', 'botlist'],
    async execute(sock, msg, args, ctx) {
        await sock.sendMessage(ctx.sender, { text: '🔍 Fetching available AI personas...' });

        try {
            const res = await fetch('https://omegatech-api.dixonomega.tech/api/ai/Meta?action=categories&prompt=hello', {
                signal: AbortSignal.timeout(30000)
            });
            const data = await res.json();

            if (!data.success || !data.data) throw new Error('Could not fetch personas.');

            let text = '🎭 *Available AI Personas*\n\n';
            
            data.data.forEach(category => {
                if (category.bots && category.bots.length > 0) {
                    text += `📁 *${category.cname}*\n`;
                    category.bots.forEach(bot => {
                        text += `▸ ${bot.bot_name}\n`;
                    });
                    text += '\n';
                }
            });

            text += `💡 *How to chat:*\n${ctx.prefix}coze <Persona Name> | <Your message>\nExample: ${ctx.prefix}coze Satoru Gojo | Hello there`;

            await sock.sendMessage(ctx.sender, { text });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Error: ' + e.message });
        }
    }
};
