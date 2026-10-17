const fetch = globalThis.fetch;

module.exports = {
    name: 'tts',
    category: 'tools',
    description: 'Convert text to speech (voice note)',
    aliases: ['speak', 'say'],
    async execute(sock, msg, args, ctx) {
        // Basic parsing: .tts [voice] [language] <text>
        // If the first argument is a known voice (e.g., woman1), use it.
        // If the second is a known language, use it.
        // This is a simple heuristic. A more robust parser could be added later.
        let voice = 'woman1';
        let language = 'English';
        let textArgs = args;

        // Simple check for voice
        if (args[0] && /^[a-zA-Z]+[0-9]$/.test(args[0])) {
            voice = args[0];
            textArgs = args.slice(1);
        }

        // Simple check for language (if the next arg is a known language name)
        if (textArgs[0] && ['English', 'Yoruba', 'Hausa', 'Igbo', 'French', 'Spanish', 'Arabic', 'Swahili'].includes(textArgs[0])) {
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
            // Build the API URL
            const apiUrl = `https://api.omegatech.app/api/ai/text2speech-v3?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}&language=${encodeURIComponent(language)}`;
            console.log('TTS URL:', apiUrl);

            const res = await fetch(apiUrl, { signal: AbortSignal.timeout(60000) });
            if (!res.ok) throw new Error('HTTP ' + res.status);

            const data = await res.json();
            console.log('TTS RESPONSE:', JSON.stringify(data, null, 2));

            if (!data.success || !data.audio) {
                throw new Error('No audio URL returned from API');
            }

            const audioUrl = data.audio;

            // Download the audio file
            const audioRes = await fetch(audioUrl);
            if (!audioRes.ok) throw new Error('Failed to download audio file');
            const buffer = Buffer.from(await audioRes.arrayBuffer());

            const sizeKB = (buffer.length / 1024).toFixed(1);
            console.log('TTS Audio downloaded: ' + sizeKB + ' KB');

            // Send as a voice note (ptt: true)
            try {
                await sock.sendMessage(ctx.sender, {
                    audio: buffer,
                    mimetype: 'audio/mp4', // TTS outputs mp3, but mp4 mime is safer for WhatsApp
                    ptt: true, // Send as a voice note
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
