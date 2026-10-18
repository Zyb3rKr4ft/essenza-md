module.exports = {
    name: 'vcf',
    category: 'group',
    description: 'Export group members as a .vcf contact file',
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        try {
            const metadata = ctx.groupMetadata;
            let vcfData = '';

            metadata.participants.forEach(p => {
                const num = p.id.split('@')[0];
                vcfData += 'BEGIN:VCARD\nVERSION:3.0\n';
                vcfData += `FN:${num}\n`;
                vcfData += `TEL;type=CELL:+${num}\n`;
                vcfData += 'END:VCARD\n';
            });

            const buffer = Buffer.from(vcfData, 'utf-8');
            const safeName = metadata.subject.replace(/[^\w\s-]/g, '');

            await sock.sendMessage(ctx.sender, {
                document: buffer,
                mimetype: 'text/vcard',
                fileName: `${safeName}_contacts.vcf`,
                caption: `📇 Contacts for *${metadata.subject}*\n👥 ${metadata.participants.length} members exported.`
            });

        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Error: ' + e.message });
        }
    }
};
