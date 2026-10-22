module.exports = {
    name: 'antidelete',
    category: 'security',
    description: 'Toggle anti-delete in this group',
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const a = (args[0] || '').toLowerCase();
        if (a === 'on') { ctx.groupSettings.antidelete = true; ctx.saveSettings(); return sock.sendMessage(ctx.sender, { text: '🛡 AntiDelete: *ON*' }); }
        if (a === 'off') { ctx.groupSettings.antidelete = false; ctx.saveSettings(); return sock.sendMessage(ctx.sender, { text: '🛡 AntiDelete: *OFF*' }); }
        await sock.sendMessage(ctx.sender, { text: '🛡 AntiDelete: ' + (ctx.groupSettings.antidelete ? 'ON' : 'OFF') + '\n\nUsage: ' + ctx.prefix + 'antidelete <on|off>' });
    }
};
