module.exports = {
    name: 'list',
    category: 'general',
    description: 'Get a plain text list of all commands',
    aliases: ['commands', 'cmdlist'],
    async execute(sock, msg, args, ctx) {
        const categories = {};
        const seen = new Set();

        // Group commands by category and remove aliases/duplicates
        for (const plugin of ctx.commands.values()) {
            if (seen.has(plugin.name)) continue;
            seen.add(plugin.name);
            
            const cat = plugin.category || 'general';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(plugin.name);
        }

        let out = `📋 *${ctx.config.botName} Commands*\n`;
        out += `Prefix: [ ${ctx.settings.prefixes.join(' ')} ]\n`;
        out += `Total: ${seen.size} commands\n\n`;

        const icons = { general: '🛠', group: '👥', security: '🛡', media: '🎨', tools: '🧰', downloads: '📥', fun: '🎮', ai: '🤖' };

        // Build the text list
        for (const cat of Object.keys(categories).sort()) {
            out += `${icons[cat] || '📦'} *${cat.toUpperCase()}*\n`;
            // Join commands with commas
            out += categories[cat].map(cmd => ctx.prefix + cmd).join(', ') + '\n\n';
        }

        out += `_Use ${ctx.prefix}help <command> for more info._`;

        // WhatsApp text limit is ~65k characters. This will easily fit in one message.
        await sock.sendMessage(ctx.sender, { text: out });
    }
};
