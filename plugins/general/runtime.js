module.exports = {
    name: 'runtime',
    category: 'general',
    async execute(sock, msg, args, ctx) {
        const up = Math.floor(ctx.uptime / 1000);
        const d = Math.floor(up / 86400);
        const h = Math.floor((up % 86400) / 3600);
        const m = Math.floor((up % 3600) / 60);
        const s = up % 60;
        const heap = (ctx.memory / 1024 / 1024).toFixed(1);
        const rss = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
        await sock.sendMessage(ctx.sender, {
            text: '⚙️ *Runtime*\n\n🕒 Uptime: ' + d + 'd ' + h + 'h ' + m + 'm ' + s + 's\n💾 Heap: ' + heap + ' MB\n📦 RSS: ' + rss + ' MB\n🔢 Node: ' + process.version
        });
    }
};
