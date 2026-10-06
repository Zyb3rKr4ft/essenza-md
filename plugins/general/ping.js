module.exports = {
    name: 'ping',
    category: 'general',
    aliases: ['p'],
    async execute(sock, msg, args, ctx) {
        const msgTime = Number(msg.messageTimestamp) * 1000;
        const latency = Date.now() - msgTime;
        const response = Date.now() - ctx.startTime;
        await sock.sendMessage(ctx.sender, {
            text: '🏓 Pong! Essenza MD is Active ⚡.\n\n⚡ Latency: ' + latency + 'ms\n📡 Response: ' + response + 'ms'
        });
    }
};
