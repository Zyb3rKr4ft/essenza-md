const fetch = globalThis.fetch;

module.exports = {
    name: 'otp',
    category: 'tools',
    description: 'Fetch latest OTPs from temporary numbers',
    aliases: ['tempotp', 'smsotp'],
    async execute(sock, msg, args, ctx) {
        await sock.sendMessage(ctx.sender, { text: '📡 Fetching latest OTPs...' });

        try {
            const res = await fetch('https://api.omegatech.app/api/tools/Temp-number?action=otps', { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(30000) });
            const data = await res.json();

            if (!data.success || !data.data || !data.data.otps || data.data.otps.length === 0) {
                throw new Error('No OTPs found.');
            }

            // Show the latest 5 OTPs to avoid hitting WhatsApp message limits
            const latestOtps = data.data.otps.slice(0, 5);
            let text = '📱 *Latest Temporary OTPs*\n\n';

            latestOtps.forEach((otp, i) => {
                text += `*${i + 1}.* ${otp.flag} *${otp.country}*\n`;
                text += `📞 Number: ${otp.maskedNumber}\n`;
                text += `🏢 Sender: ${otp.sender}\n`;
                text += `🔑 Code: *${otp.otp}*\n`;
                text += `⏱️ Time: ${otp.time}\n\n`;
            });

            text += `_Total available: ${data.data.total}_`;

            await sock.sendMessage(ctx.sender, { text });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ OTP Error: ' + e.message });
        }
    }
};
