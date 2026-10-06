module.exports = {
    name: 'delsudo',
    category: 'general',
    description: 'Remove a number from sudo/super-sudo',
    ownerOnly: true,
    aliases: ['removesudo'],
    async execute(sock, msg, args, ctx) {
        const num = (args[0] || '').replace(/[^0-9]/g, '');
        if (!num) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'delsudo <number>' });
        let removed = false;
        if (Array.isArray(ctx.settings.sudo)) {
            const before = ctx.settings.sudo.length;
            ctx.settings.sudo = ctx.settings.sudo.filter(n => n !== num);
            if (ctx.settings.sudo.length < before) removed = true;
        }
        if (Array.isArray(ctx.settings.superSudo)) {
            const before = ctx.settings.superSudo.length;
            ctx.settings.superSudo = ctx.settings.superSudo.filter(n => n !== num);
            if (ctx.settings.superSudo.length < before) removed = true;
        }
        ctx.saveSettings();
        await sock.sendMessage(ctx.sender, { text: removed ? '✅ Removed +' + num : '❌ Not in sudo list.' });
    }
};
