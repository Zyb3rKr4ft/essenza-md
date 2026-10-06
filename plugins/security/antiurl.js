module.exports = {
    name: 'antiurl',
    category: 'security',
    description: 'Block specific domains in this group',
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const a = (args[0] || '').toLowerCase();
        const cfg = ctx.groupSettings.antiurl || { enabled: false, domains: [] };

        if (a === 'on') {
            cfg.enabled = true;
            ctx.groupSettings.antiurl = cfg;
            ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '🛡 AntiUrl: *ON* (' + cfg.domains.length + ' domains)' });
        }
        if (a === 'off') {
            cfg.enabled = false;
            ctx.groupSettings.antiurl = cfg;
            ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '🛡 AntiUrl: *OFF*' });
        }
        if (a === 'add') {
            const items = args.slice(1).map(d => d.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '').toLowerCase()).filter(Boolean);
            if (!items.length) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'antiurl add <domain> [domain2] ...' });
            for (const d of items) {
                if (!cfg.domains.includes(d)) cfg.domains.push(d);
            }
            ctx.groupSettings.antiurl = cfg;
            ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '✅ Added: ' + items.join(', ') + '\nTotal: ' + cfg.domains.length + ' domains' });
        }
        if (a === 'remove' || a === 'del') {
            const items = args.slice(1).map(d => d.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '').toLowerCase()).filter(Boolean);
            if (!items.length) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'antiurl remove <domain>' });
            const before = cfg.domains.length;
            cfg.domains = cfg.domains.filter(d => !items.includes(d));
            ctx.groupSettings.antiurl = cfg;
            ctx.saveSettings();
            const removed = before - cfg.domains.length;
            return sock.sendMessage(ctx.sender, { text: '✅ Removed ' + removed + ' domain(s).' });
        }
        if (a === 'list') {
            if (!cfg.domains.length) return sock.sendMessage(ctx.sender, { text: 'No domains blocked.' });
            let out = '🛡 *Blocked Domains* (' + cfg.domains.length + ')\n\n';
            cfg.domains.forEach((d, i) => { out += (i + 1) + '. ' + d + '\n'; });
            return sock.sendMessage(ctx.sender, { text: out });
        }

        const status = cfg.enabled ? 'ON' : 'OFF';
        await sock.sendMessage(ctx.sender, {
            text: '🛡 AntiUrl: *' + status + '*\n' +
                  'Blocked: ' + cfg.domains.length + ' domains\n\n' +
                  '*Usage*\n' +
                  ctx.prefix + 'antiurl on|off\n' +
                  ctx.prefix + 'antiurl add <domain> [domain2] ...\n' +
                  ctx.prefix + 'antiurl remove <domain>\n' +
                  ctx.prefix + 'antiurl list'
        });
    }
};
