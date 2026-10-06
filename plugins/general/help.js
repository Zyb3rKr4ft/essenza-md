module.exports = {
    name: 'help',
    category: 'general',
    description: 'Show detailed info about a specific command',
    async execute(sock, msg, args, ctx) {
        const target = (args[0] || '').toLowerCase().replace(/^[^a-z0-9]+/, '');
        if (!target) {
            return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'help <command>\nExample: ' + ctx.prefix + 'help ping' });
        }
        const p = ctx.commands.get(target);
        if (!p) return sock.sendMessage(ctx.sender, { text: '❌ Unknown command: ' + target });
        let out = '⚡ *' + ctx.prefix + p.name + '*\n\n';
        out += '📦 Category: ' + (p.category || 'general') + '\n';
        if (p.description) out += '📝 ' + p.description + '\n';
        if (Array.isArray(p.aliases) && p.aliases.length) out += '🔗 Aliases: ' + p.aliases.map(a => ctx.prefix + a).join(', ') + '\n';
        const perms = [];
        if (p.ownerOnly) perms.push('owner');
        if (p.adminOnly) perms.push('admin');
        if (p.groupOnly) perms.push('group');
        if (perms.length) out += '🔒 Requires: ' + perms.join(', ') + '\n';
        await sock.sendMessage(ctx.sender, { text: out });
    }
};
