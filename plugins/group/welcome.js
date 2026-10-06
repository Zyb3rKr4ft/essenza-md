module.exports = {
    name: 'welcome',
    category: 'group',
    description: 'Manage welcome messages for new members',
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const a = (args[0] || '').toLowerCase();
        const cfg = ctx.groupSettings.welcome || { enabled: false, message: null };

        if (a === 'on') {
            cfg.enabled = true;
            ctx.groupSettings.welcome = cfg;
            ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '👋 Welcome: *ON*' });
        }
        if (a === 'off') {
            cfg.enabled = false;
            ctx.groupSettings.welcome = cfg;
            ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '👋 Welcome: *OFF*' });
        }
        if (a === 'set') {
            const newMsg = args.slice(1).join(' ');
            if (!newMsg) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'welcome set <message>\n\nPlaceholders: {user}, {group}, {count}' });
            cfg.message = newMsg;
            cfg.enabled = true;
            ctx.groupSettings.welcome = cfg;
            ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '✅ Welcome message set.\n\nPreview:\n' + newMsg });
        }
        if (a === 'reset') {
            cfg.message = null;
            ctx.groupSettings.welcome = cfg;
            ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '✅ Welcome message reset to default.' });
        }

        const status = cfg.enabled ? 'ON' : 'OFF';
        const preview = cfg.message || 'Welcome {user} to {group}! 👋 (default)';
        await sock.sendMessage(ctx.sender, {
            text: '👋 *Welcome*\nStatus: ' + status + '\nMessage: ' + preview + '\n\n*Usage*\n' + ctx.prefix + 'welcome on|off\n' + ctx.prefix + 'welcome set <message>\n' + ctx.prefix + 'welcome reset\n\nPlaceholders: {user}, {group}, {count}'
        });
    }
};
