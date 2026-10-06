module.exports = {
    name: 'setvv',
    category: 'media',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const a = (args[0] || '').toLowerCase();
        if (a === 'on') { ctx.settings.vvToDM = true; ctx.saveSettings(); return sock.sendMessage(ctx.sender, { text: '📩 VV route: *DM*' }); }
        if (a === 'off') { ctx.settings.vvToDM = false; ctx.saveSettings(); return sock.sendMessage(ctx.sender, { text: '📩 VV route: *Current chat*' }); }
        await sock.sendMessage(ctx.sender, { text: '📩 VV route: ' + (ctx.settings.vvToDM ? 'DM' : 'Current chat') + '\n\nUsage: ' + ctx.prefix + 'setvv <on|off>' });
    }
};
