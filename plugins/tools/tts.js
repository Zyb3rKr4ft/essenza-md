const fetch = globalThis.fetch;

module.exports = {
    name: 'tts',
    category: 'tools',
    description: 'Convert text to speech (voice note)',
    aliases: ['speak', 'say'],
    async execute(sock, msg, args, ctx) {
        // Basic parsing: .tts [voice] [language] <text>
        let voice = 'woman1';
        let language = 'English';
        let textArgs = args;

        // Simple check for voice (e.g., woman1, man1)
        if (args[0] && /^[a-zA-Z]+[0-9]$/.test(args[0])) {
            voice = args[0];
            textArgs = args.slice(1);
        }

        // Simple check for language (if the next arg is a known language name)
        const knownLanguages = ['English', 'Yoruba', 'Hausa', 'Igbo', 'French', 'Spanish', 'Arabic', 'Swahili'];
        if (textArgs[0] && knownLanguages.includes(textArgs[0])) {
            language = textArgs[0];
            textArgs = textArgs.slice(1);
        }

        const text = textArgs.join(' ').trim();
        if (!text) {
            return sock.sendMessage(ctx.sender, { 
                text: 'Usage: ' + ctx.prefix + 'tts [voice] [language] <text>\n' +
                      'Example: ' + ctx.prefix + 'tts woman1 English Hello, how are you?\n' +
                      'Example: ' + ctx.prefix + 'tts man1 Yoruba E kaaro' 
            });
        }

        await sock.sendMessage(ctx.sender, { text: '🗣️ Generating audio...' });

        try {
            const apiUrl = `https://api.omegatech.app/api/ai/text2speech-v3?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}&language=${encodeURIComponent(language)}`;
            const res = await fetch(apiUrl, { 
                headers: { 'User-Agent': 'Mozilla/5.0' },
                signal: AbortSignal.timeout(60000) 
            });
            
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            console.log('TTS RESPONSE:', JSON.stringify(data, null, 2));

            if (!data.success || !data.audio) {
                throw new Error('No audio URL returned from API');
            }

            const audioRes = await fetch(data.audio);
            if (!audioRes.ok) throw new Error('Failed to download audio file');
            const buffer = Buffer.from(await audioRes.arrayBuffer());

            try {
                await sock.sendMessage(ctx.sender, {
                    audio: buffer,
                    mimetype: 'audio/mp4',
                    ptt: true, // Send as voice note
                    fileName: 'tts.mp3'
                });
                console.log('TTS sent as voice note');
            } catch (sendErr) {
                console.log('Voice note failed, sending as document:', sendErr.message);
                await sock.sendMessage(ctx.sender, {
                    document: buffer,
                    mimetype: 'audio/mp3',
                    fileName: 'tts.mp3',
                    caption: '🗣️ ' + text
                });
            }

        } catch (e) {
            console.log('TTS error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ TTS Error: ' + e.message });
        }
    }
};
