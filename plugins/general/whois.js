function resolveTarget(msg, args) {
    const ci = msg.message.extendedTextMessage?.contextInfo;
    if (ci?.mentionedJid?.length) return { jid: ci.mentionedJid[0], pushName: null };
    if (ci?.participant) return { jid: ci.participant, pushName: ci.pushName || null };
    if (args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num) return { jid: num + '@s.whatsapp.net', pushName: null };
    }
    return null;
}

module.exports = {
    name: 'whois',
    category: 'general',
    description: 'Show info about a user (reply, mention, or number)',
    aliases: ['userinfo', 'whoami'],
    async execute(sock, msg, args, ctx) {
        const resolved = resolveTarget(msg, args);
        if (!resolved) return sock.sendMessage(ctx.sender, { text: 'Reply to a user, mention them, or give a number.' });

        const { jid, pushName } = resolved;
        const num = String(jid).match(/^(\d+)/)?.[1] || '';
        const isLid = String(jid).endsWith('@lid');

        let ppUrl = null, status = null, business = null;

        try { ppUrl = await sock.profilePictureUrl(jid, 'image'); } catch (e) {}

        try {
            const s = await sock.fetchStatus(jid);
            status = s && s.status ? s.status : null;
        } catch (e) {}

        try {
            business = await sock.getBusinessProfile(jid);
        } catch (e) {}

        let out = '╭━━━〔 👤 USER INFO 〕━━━┈⊷\n';
        out += '┃ 📛 Push name: ' + (pushName || 'Unknown') + '\n';
        out += '┃ 🔢 Number: ' + (isLid ? 'Hidden' : '+' + num) + '\n';
        out += '┃ 🆔 ' + (isLid ? 'LID' : 'JID') + ': ' + num + '\n';
        out += '┃ 💼 Business: ' + (business && business.wid ? 'Yes' : 'No') + '\n';
        out += '┃ 📝 Status: ' + (status || 'Hidden') + '\n';
        out += '╰━━━━━━━━━━━━━━━┈⊷';

        if (ppUrl) {
            await sock.sendMessage(ctx.sender, { image: { url: ppUrl }, caption: out });
        } else {
            await sock.sendMessage(ctx.sender, { text: out });
        }
    }
};
