const fetch = globalThis.fetch;

module.exports = {
    name: 'nicevoice',
    category: 'tools',
    description: 'Premium TTS with ElevenLabs voices',
    aliases: ['nv', 'premiumtts'],
    async execute(sock, msg, args, ctx) {
        let voice = 'elevenlabs-adam';
        let textArgs = args;

        // Allow user to pick a voice as the first argument (e.g., .nv elevenlabs-rachel Hello)
        if (args[0] && args[0].startsWith('elevenlabs-')) {
            voice = args[0];
            textArgs = args.slice(1);
        }

        const text = textArgs.join(' ').trim();
        if (!text) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'nicevoice [voice] <text>' });

        await sock.sendMessage(ctx.sender, { text: '🎙️ Generating premium audio...' });

        try {
            // 1. Submit the task
            const submitUrl = `https://api.omegatech.app/api/ai/Nicevoice?action=tts&text=${encodeURIComponent(text)}&voice=${voice}&wait=false`;
            const submitRes = await fetch(submitUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const submitData = await submitRes.json();

            if (!submitData.success || !submitData.data || !submitData.data.taskSn) {
                throw new Error('Failed to create TTS task.');
            }

            const { taskSn, account, token } = submitData.data;
            console.log('NiceVoice Task:', taskSn);

            // 2. Poll for result
            let audioUrl = null;
            for (let i = 0; i < 20; i++) {
                await new Promise(r => setTimeout(r, 3000)); // Wait 3 seconds
                const statusUrl = `https://api.omegatech.app/api/ai/Nicevoice?action=result&taskSn=${taskSn}&account=${account}&token=${token}`;
                const statusRes = await fetch(statusUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                const statusData = await statusRes.json();

                if (statusData.success && statusData.data) {
                    if (statusData.data.audioUrl || statusData.data.url) {
                        audioUrl = statusData.data.audioUrl || statusData.data.url;
                        break;
                    }
                    if (statusData.data.status === 'failed') {
                        throw new Error('Audio generation failed on the server.');
                    }
                }
            }

            if (!audioUrl) throw new Error('Audio generation timed out.');

            // 3. Download and send
            await sock.sendMessage(ctx.sender, { text: '⬇️ Downloading audio...' });
            const audioRes = await fetch(audioUrl);
            const buffer = Buffer.from(await audioRes.arrayBuffer());

            await sock.sendMessage(ctx.sender, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: 'nicevoice.mp3'
            });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ NiceVoice Error: ' + e.message });
        }
    }
};
