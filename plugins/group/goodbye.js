module.exports = {
    name: 'goodbye',
    category: 'group',
    description: 'Manage goodbye messages for leaving members',
    aliases: ['bye'],
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const a = (args[0] || '').toLowerCase();
        const cfg = ctx.groupSettings.goodbye || { enabled: false, message: null };

        if (a === 'on') {
            cfg.enabled = true;
            ctx.groupSettings.goodbye = cfg;
            ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '👋 Goodbye: *ON*' });
        }
        if (a === 'off') {
            cfg.enabled = false;
            ctx.groupSettings.goodbye = cfg;
            ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '👋 Goodbye: *OFF*' });
        }
        if (a === 'set') {
            const newMsg = args.slice(1).join(' ');
            if (!newMsg) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'goodbye set <message>\n\nPlaceholders: {user}, {group}, {count}' });
            cfg.message = newMsg;
            cfg.enabled = true;
            ctx.groupSettings.goodbye = cfg;
            ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '✅ Goodbye message set.\n\nPreview:\n' + newMsg });
        }
        if (a === 'reset') {
            cfg.message = null;
            ctx.groupSettings.goodbye = cfg;
            ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '✅ Goodbye message reset to default.' });
        }

        const status = cfg.enabled ? 'ON' : 'OFF';
        const preview = cfg.message || 'Goodbye {user}! 👋 (default)';
        await sock.sendMessage(ctx.sender, {
            text: '👋 *Goodbye*\nStatus: ' + status + '\nMessage: ' + preview + '\n\n*Usage*\n' + ctx.prefix + 'goodbye on|off\n' + ctx.prefix + 'goodbye set <message>\n' + ctx.prefix + 'goodbye reset\n\nPlaceholders: {user}, {group}, {count}'
        });
    }
};
