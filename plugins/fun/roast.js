const fetch = globalThis.fetch;

module.exports = {
    name: 'roast',
    category: 'fun',
    description: 'AI roasts a user or a replied message',
    async execute(sock, msg, args, ctx) {
        const ci = msg.message.extendedTextMessage?.contextInfo;
        const mentioned = ci?.mentionedJid || [];
        const quotedText = ci?.quotedMessage?.conversation || ci?.quotedMessage?.extendedTextMessage?.text || '';
        const target = mentioned[0] || ci?.participant || ctx.realSender;
        
        await sock.sendMessage(ctx.sender, { text: '🔥 Generating a savage roast...' });
        
        let prompt = "Write a short, funny, and brutal roast. ";
        if (quotedText) {
            prompt += `Base the roast on this message they sent: "${quotedText}". `;
        }
        if (target !== ctx.realSender) {
            prompt += `Roast the user with this phone number: ${target.split('@')[0]}. `;
        }
        prompt += "Max 2 sentences. Do not hold back.";

        const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`);
        const roast = await res.text();
        
        await sock.sendMessage(ctx.sender, { 
            text: `🔥 @${target.split('@')[0]}, ${roast}`, 
            mentions: [target] 
        });
    }
};
