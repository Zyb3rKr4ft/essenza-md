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

        try {
            // Attempt to fetch the bot's profile picture
            const ppUrl = await sock.profilePictureUrl(sock.user.id, 'image');
            
            // If successful, send the image with the text as the caption
            if (ppUrl) {
                await sock.sendMessage(ctx.sender, { 
                    image: { url: ppUrl }, 
                    caption: text 
                });
                return;
            }
        } catch (e) {
            // Silently catch errors (e.g., if the bot has no PP set)
            console.log('Could not fetch bot PP for ping command.');
        }

        // Fallback: If no PP or if fetching failed, just send the text
        await sock.sendMessage(ctx.sender, { text: text });
    }
};
