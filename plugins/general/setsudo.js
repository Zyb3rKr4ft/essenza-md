module.exports = {
    name: 'setsudo',
    category: 'general',
    description: 'Grant sudo privileges to a number',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const num = (args[0] || '').replace(/[^0-9]/g, '');
        if (!num) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'setsudo <number>' });
        if (!Array.isArray(ctx.settings.sudo)) ctx.settings.sudo = [];
        if (ctx.settings.sudo.includes(num)) return sock.sendMessage(ctx.sender, { text: 'Already a sudo user.' });
        ctx.settings.sudo.push(num);
        ctx.saveSettings();
        await sock.sendMessage(ctx.sender, { text: '✅ +' + num + ' is now sudo.' });
    }
};
