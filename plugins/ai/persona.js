const fetch = globalThis.fetch;

async function askAI(prompt) {
    const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`, { signal: AbortSignal.timeout(30000) });
    return await res.text();
}

module.exports = {
    name: 'essenza',
    category: 'ai',
    description: 'Chat with the Essenza AI persona',
    aliases: ['ess'],
    async execute(sock, msg, args, ctx) {
        const prompt = args.join(' ');
        if (!prompt) return sock.sendMessage(ctx.sender, { text: 'Say something to Essenza!' });
        
        await sock.sendMessage(ctx.sender, { text: '🤖 Thinking...' });
        
        const sysPrompt = `You are Essenza, a highly intelligent, sassy, and helpful WhatsApp assistant created by ZyberDevPriest. Keep your answers short, punchy, and engaging. Never say you are an AI language model. User says: ${prompt}`;
        const reply = await askAI(sysPrompt);
        
        await sock.sendMessage(ctx.sender, { text: reply });
    }
};
