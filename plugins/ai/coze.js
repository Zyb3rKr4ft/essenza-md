const fetch = globalThis.fetch;

module.exports = {
    name: 'coze',
    category: 'ai',
    description: 'Chat with AI personas (Gojo, etc.)',
    aliases: ['persona', 'animechat'],
    async execute(sock, msg, args, ctx) {
        const parts = args.join(' ').split('|');
        if (parts.length < 2) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'coze <Character Name> | <Your message>\nExample: ' + ctx.prefix + 'coze Satoru Gojo | Teach me how to use infinity' });

        const charName = parts[0].trim().toLowerCase();
        const userMessage = parts.slice(1).join('|').trim();

        await sock.sendMessage(ctx.sender, { text: `🔍 Finding persona "${charName}"...` });

        try {
            // Fetch the list of available bots from the API
            const res = await fetch(`https://omegatech-api.dixonomega.tech/api/ai/Meta?action=categories&prompt=${encodeURIComponent(userMessage)}`);
            const data = await res.json();

            if (!data.success || !data.data) throw new Error('Could not fetch personas.');

            let bot = null;
            // Search through the categories to find the matching character
            for (const category of data.data) {
                if (category.bots) {
                    bot = category.bots.find(b => b.bot_name.toLowerCase().includes(charName));
                    if (bot) break;
                }
            }

            if (!bot) throw new Error(`Persona "${charName}" not found. Try "Satoru Gojo" or "Mitsuri"`);

            await sock.sendMessage(ctx.sender, { text: `💬 Chatting with *${bot.bot_name}*...` });

            // Send the message to the specific bot using its ID
            const chatRes = await fetch(`https://omegatech-api.dixonomega.tech/api/ai/Meta?action=chat&bot_id=${bot.bot_id}&prompt=${encodeURIComponent(userMessage)}`);
            const chatData = await chatRes.json();

            const reply = chatData.reply || chatData.response || chatData.message;
            if (!reply) throw new Error('The persona did not reply.');

            await sock.sendMessage(ctx.sender, { text: reply });

        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Coze Error: ' + e.message });
        }
    }
};
