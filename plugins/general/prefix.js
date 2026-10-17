module.exports = {
    name: 'prefix',
    category: 'general',
    ownerOnly: true,
    aliases: ['setprefix'],
    description: 'Manage bot prefixes',
    async execute(sock, msg, args, ctx) {
        const action = (args[0] || '').toLowerCase();
        
        // Ensure settings.prefixes exists
        if (!Array.isArray(ctx.settings.prefixes)) {
            ctx.settings.prefixes = [ctx.settings.prefix || '.'];
        }

        if (action === 'add' && args[1]) {
            const newPrefix = args[1];
            if (ctx.settings.prefixes.includes(newPrefix)) {
                return sock.sendMessage(ctx.sender, { text: '❌ Prefix already exists.' });
            }
            ctx.settings.prefixes.push(newPrefix);
            ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '✅ Added prefix: ' + newPrefix + '\nActive prefixes: ' + ctx.settings.prefixes.join(' ')});
        }

        if (action === 'remove' && args[1]) {
            const remPrefix = args[1];
            if (ctx.settings.prefixes.length <= 1) {
                return sock.sendMessage(ctx.sender, { text: '❌ Cannot remove the only prefix. Add another first.' });
            }
            ctx.settings.prefixes = ctx.settings.prefixes.filter(p => p !== remPrefix);
            ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '✅ Removed prefix: ' + remPrefix + '\nActive prefixes: ' + ctx.settings.prefixes.join(' ')});
        }

        if (action === 'list') {
            return sock.sendMessage(ctx.sender, { text: '⚙️ Active prefixes: ' + ctx.settings.prefixes.join(' ')});
        }

        // Default fallback: replace all prefixes with a single new one
        const singlePrefix = args[0];
        if (singlePrefix && !['add', 'remove', 'list'].includes(singlePrefix)) {
            ctx.settings.prefixes = [singlePrefix];
            ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '✅ Reset to single prefix: ' + singlePrefix });
        }

        await sock.sendMessage(ctx.sender, { 
            text: '⚙️ *Prefix Manager*\n\n' +
                  'Current: ' + ctx.settings.prefixes.join(' ') + '\n\n' +
                  '*Usage:*\n' +
                  ctx.prefix + 'prefix add $\n' +
                  ctx.prefix + 'prefix remove $\n' +
                  ctx.prefix + 'prefix list\n' +
                  ctx.prefix + 'prefix ! (replaces all with !)'
        });
    }
};
