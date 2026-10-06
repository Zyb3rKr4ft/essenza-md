module.exports = {
    name: 'anticall',
    category: 'security',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const a = (args[0] || '').toLowerCase();
        if (a === 'on') { ctx.settings.anticall = true; ctx.saveSettings(); return sock.sendMessage(ctx.sender, { text: '🛡 AntiCall: *ON*' }); }
        if (a === 'off') { ctx.settings.anticall = false; ctx.saveSettings(); return sock.sendMessage(ctx.sender, { text: '🛡 AntiCall: *OFF*' }); }
        await sock.sendMessage(ctx.sender, { text: '🛡 AntiCall: ' + (ctx.settings.anticall ? 'ON' : 'OFF') + '\n\nUsage: ' + ctx.prefix + 'anticall <on|off>' });
    }
};
