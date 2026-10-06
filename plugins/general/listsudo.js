module.exports = {
    name: 'listsudo',
    category: 'general',
    description: 'List all sudo and super-sudo users',
    sudoOnly: true,
    async execute(sock, msg, args, ctx) {
        const ss = ctx.settings.superSudo || [];
        const sd = ctx.settings.sudo || [];
        let out = '╭━━━〔 🔑 SUDO LIST 〕━━━┈⊷\n';
        out += '┃\n';
        out += '┃ 👑 *Super-sudo* (' + ss.length + ')\n';
        if (ss.length) for (const n of ss) out += '┃   ▸ +' + n + '\n';
        else out += '┃   (none)\n';
        out += '┃\n';
        out += '┃ 🔑 *Sudo* (' + sd.length + ')\n';
        if (sd.length) for (const n of sd) out += '┃   ▸ +' + n + '\n';
        else out += '┃   (none)\n';
        out += '┃\n';
        out += '╰━━━━━━━━━━━━━━━┈⊷';
        await sock.sendMessage(ctx.sender, { text: out });
    }
};
