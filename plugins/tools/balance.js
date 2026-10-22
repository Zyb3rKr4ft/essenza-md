module.exports = {
    name: 'balance',
    category: 'tools',
    description: 'Check your coin balance',
    aliases: ['bal', 'wallet'],
    async execute(sock, msg, args, ctx) {
        if (!ctx.settings.economy) ctx.settings.economy = {};
        const user = ctx.realSender;
        const wallet = ctx.settings.economy[user]?.wallet || 0;

        await sock.sendMessage(ctx.sender, { text: `💳 *Your Balance:* ${wallet} coins` });
    }
};
