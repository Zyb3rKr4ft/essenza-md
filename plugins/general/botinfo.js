module.exports = {
    name: 'botinfo',
    category: 'general',
    aliases: ['info'],
    async execute(sock, msg, args, ctx) {
        const mem = (ctx.memory / 1024 / 1024).toFixed(1);
        await sock.sendMessage(ctx.sender, {
            text: '⚡ *' + ctx.config.botName + '*\n\n📦 Version: ' + ctx.version + '\n🔢 Commands: ' + ctx.commandCount + '\n💾 Memory: ' + mem + ' MB\n🔧 Prefix: ' + ctx.prefix + '\n🔒 Mode: ' + ctx.settings.mode + '\n💻 Platform: ' + process.platform + '\n🔢 Node: ' + process.version
        });
    }
};
