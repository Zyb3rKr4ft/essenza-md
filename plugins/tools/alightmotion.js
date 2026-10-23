const fetch = globalThis.fetch;
module.exports = {
    name: 'alightmotion',
    category: 'tools',
    description: 'Generate a Premium Alight Motion account',
    aliases: ['alight', 'am'],
    async execute(sock, msg, args, ctx) {
        await sock.sendMessage(ctx.sender, { text: '⏳ Generating Alight Motion Premium account...' });
        try {
            const res = await fetch('https://omegatech-api.dixonomega.tech/api/tools/Alightmotion-Prem-gen?action=generate', { signal: AbortSignal.timeout(30000) });
            const data = await res.json();
            
            if (!data.success || !data.data || !data.data.accounts || data.data.accounts.length === 0) {
                throw new Error('Failed to generate account.');
            }

            const acc = data.data.accounts[0];
            let text = `🎬 *Alight Motion Premium*\n\n`;
            text += `📧 *Email:* ${acc.email}\n`;
            text += `🔗 *Magic Link:* ${acc.link}\n\n`;
            text += `_Click the link to log in. Enjoy your premium features!_`;
            
            await sock.sendMessage(ctx.sender, { text });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Error: ' + e.message });
        }
    }
};
