module.exports = {
    name: 'antibadwords',
    category: 'security',
    aliases: ['abw'],
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const a = (args[0] || '').toLowerCase();
        const bw = ctx.groupSettings.antibadwords || { enabled: false, words: [] };
        if (a === 'on') { bw.enabled = true; ctx.groupSettings.antibadwords = bw; ctx.saveSettings(); return sock.sendMessage(ctx.sender, { text: '🛡 AntiBadWords: *ON*' }); }
        if (a === 'off') { bw.enabled = false; ctx.groupSettings.antibadwords = bw; ctx.saveSettings(); return sock.sendMessage(ctx.sender, { text: '🛡 AntiBadWords: *OFF*' }); }
        if (a === 'add' && args[1]) { bw.words.push(args[1]); bw.enabled = true; ctx.groupSettings.antibadwords = bw; ctx.saveSettings(); return sock.sendMessage(ctx.sender, { text: '✅ Added: ' + args[1] }); }
        if (a === 'remove' && args[1]) { bw.words = bw.words.filter(w => w !== args[1]); ctx.groupSettings.antibadwords = bw; ctx.saveSettings(); return sock.sendMessage(ctx.sender, { text: '✅ Removed: ' + args[1] }); }
        if (a === 'list') { return sock.sendMessage(ctx.sender, { text: 'Words: ' + (bw.words.length ? bw.words.join(', ') : '(none)') }); }
        await sock.sendMessage(ctx.sender, { text: '🛡 AntiBadWords: ' + (bw.enabled ? 'ON' : 'OFF') + '\nWords: ' + bw.words.length + '\n\nUsage:\n' + ctx.prefix + 'antibadwords <on|off>\n' + ctx.prefix + 'antibadwords add <word>\n' + ctx.prefix + 'antibadwords remove <word>\n' + ctx.prefix + 'antibadwords list' });
    }
};
