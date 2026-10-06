module.exports = {
    name: 'groupinfo',
    category: 'group',
    groupOnly: true,
    async execute(sock, msg, args, ctx) {
        const m = ctx.groupMetadata;
        const admins = m.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').length;
        await sock.sendMessage(ctx.sender, {
            text: '👥 *Group Info*\n\n📛 Name: ' + m.subject + '\n👤 Members: ' + m.participants.length + '\n👑 Admins: ' + admins + '\n📅 Created: ' + new Date(m.creation * 1000).toLocaleDateString() + '\n📝 Desc: ' + (m.desc || '(none)')
        });
    }
};
