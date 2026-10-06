module.exports = {
    name: 'setsupersudo',
    category: 'general',
    description: 'Grant super-sudo privileges to a number',
    ownerOnly: true,
    aliases: ['setss'],
    async execute(sock, msg, args, ctx) {
        const num = (args[0] || '').replace(/[^0-9]/g, '');
        if (!num) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'setsupersudo <number>' });
        if (!Array.isArray(ctx.settings.superSudo)) ctx.settings.superSudo = [];
        if (ctx.settings.superSudo.includes(num)) return sock.sendMessage(ctx.sender, { text: 'Already a super-sudo user.' });
        ctx.settings.superSudo.push(num);
        ctx.saveSettings();
        await sock.sendMessage(ctx.sender, { text: '✅ +' + num + ' is now super-sudo.' });
    }
};
