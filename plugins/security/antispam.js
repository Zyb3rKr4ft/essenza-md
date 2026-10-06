module.exports = {
    name: 'antispam',
    category: 'security',
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const a = (args[0] || '').toLowerCase();
        if (a === 'on') { ctx.groupSettings.antispam = true; ctx.saveSettings(); return sock.sendMessage(ctx.sender, { text: '🛡 AntiSpam: *ON* (5 msgs / 5 sec)' }); }
        if (a === 'off') { ctx.groupSettings.antispam = false; ctx.saveSettings(); return sock.sendMessage(ctx.sender, { text: '🛡 AntiSpam: *OFF*' }); }
        await sock.sendMessage(ctx.sender, { text: '🛡 AntiSpam: ' + (ctx.groupSettings.antispam ? 'ON' : 'OFF') + '\n\nUsage: ' + ctx.prefix + 'antispam <on|off>' });
    }
};
