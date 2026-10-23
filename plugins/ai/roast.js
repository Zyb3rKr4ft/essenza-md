const fetch = globalThis.fetch;
module.exports = {
    name: 'roast', category: 'ai', description: 'AI roasts a user', 
    async execute(sock, msg, args, ctx) {
        const ci = msg.message.extendedTextMessage?.contextInfo;
        const target = ci?.participant || ctx.realSender;
        await sock.sendMessage(ctx.sender, { text: '🔥 Generating roast...' });
        const prompt = `Write a short, funny, and savage roast for a WhatsApp user. Max 2 sentences.`;
        const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`);
        const roast = await res.text();
        await sock.sendMessage(ctx.sender, { text: `🔥 @${target.split('@')[0]}, ${roast}`, mentions: [target] });
    }
};
