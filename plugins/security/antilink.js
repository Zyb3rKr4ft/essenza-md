module.exports = {
    name: 'antilink',
    category: 'security',
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const a = (args[0] || '').toLowerCase();
        if (a === 'on') { ctx.groupSettings.antilink = true; ctx.saveSettings(); return sock.sendMessage(ctx.sender, { text: '🛡 AntiLink: *ON*' }); }
        if (a === 'off') { ctx.groupSettings.antilink = false; ctx.saveSettings(); return sock.sendMessage(ctx.sender, { text: '🛡 AntiLink: *OFF*' }); }
        await sock.sendMessage(ctx.sender, { text: '🛡 AntiLink: ' + (ctx.groupSettings.antilink ? 'ON' : 'OFF') + '\n\nUsage: ' + ctx.prefix + 'antilink <on|off>' });
    }
};
