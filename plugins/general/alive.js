module.exports = {
    name: 'alive',
    category: 'general',
    async execute(sock, msg, args, ctx) {
        const up = Math.floor(ctx.uptime / 1000);
        const d = Math.floor(up / 86400);
        const h = Math.floor((up % 86400) / 3600);
        const m = Math.floor((up % 3600) / 60);
        await sock.sendMessage(ctx.sender, {
            text: '⚡ *' + ctx.config.botName + '* is alive!\n\n🕒 Uptime: ' + d + 'd ' + h + 'h ' + m + 'm\n📦 Version: ' + ctx.version
        });
    }
};
