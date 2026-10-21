module.exports = {
    name: 'ping',
    category: 'general',
    aliases: ['p'],
    async execute(sock, msg, args, ctx) {
        // Calculate stats
        const msgTime = Number(msg.messageTimestamp) * 1000;
        const latency = Date.now() - msgTime;
        const response = Date.now() - ctx.startTime;
        
        const text = `🏓 Pong! ${ctx.config.botName} is Active ⚡.\n\n⚡ Latency: ${latency}ms\n📡 Response: ${response}ms`;

        // 👇 PUT YOUR IMAGE URL HERE 👇
        const customImageUrl = 'https://files.catbox.moe/uld5m1.png'; 

        try {
            if (customImageUrl && customImageUrl.startsWith('http')) {
                await sock.sendMessage(ctx.sender, { 
                    image: { url: customImageUrl }, 
                    caption: text 
                });
                return;
            }
        } catch (e) {
            console.log('Failed to send custom ping image:', e.message);
        }

        // Fallback if the URL is broken or missing
        await sock.sendMessage(ctx.sender, { text: text });
    }
};
