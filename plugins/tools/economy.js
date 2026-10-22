module.exports = {
    name: 'daily',
    category: 'tools',
    description: 'Claim your daily 500 coins',
    async execute(sock, msg, args, ctx) {
        if (!ctx.settings.economy) ctx.settings.economy = {};
        const user = ctx.realSender;
        const now = Date.now();
        const lastClaim = ctx.settings.economy[user]?.lastDaily || 0;
        const cooldown = 24 * 60 * 60 * 1000; // 24 hours

        if (now - lastClaim < cooldown) {
            const hoursLeft = Math.ceil((cooldown - (now - lastClaim)) / (1000 * 60 * 60));
            return sock.sendMessage(ctx.sender, { text: `⏳ You already claimed your daily! Come back in *${hoursLeft} hours*.` });
        }

        ctx.settings.economy[user] = {
            ...ctx.settings.economy[user],
            wallet: (ctx.settings.economy[user]?.wallet || 0) + 500,
            lastDaily: now
        };
        ctx.saveSettings();
        await sock.sendMessage(ctx.sender, { text: `💰 You claimed your daily 500 coins!\n💳 New Balance: *${ctx.settings.economy[user].wallet}*` });
    }
};
