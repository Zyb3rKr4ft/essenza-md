const fetch = globalThis.fetch;

module.exports = {
    name: 'translate',
    category: 'tools',
    description: 'Translate text to another language',
    aliases: ['tr', 'trans'],
    async execute(sock, msg, args, ctx) {
        const langCode = args[0];
        const text = args.slice(1).join(' ').trim();

        if (!langCode || !text) {
            return sock.sendMessage(ctx.sender, { 
                text: 'Usage: ' + ctx.prefix + 'translate <lang_code> <text>\nExample: ' + ctx.prefix + 'translate es Hello, how are you?\n(es = Spanish, fr = French, yo = Yoruba, ha = Hausa, ig = Igbo)' 
            });
        }

        await sock.sendMessage(ctx.sender, { text: '🌐 Translating...' });

        try {
            const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`;
            const res = await fetch(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(15000) });
            
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();

            const translatedText = data[0].map(item => item[0]).join('');
            
            if (!translatedText) throw new Error('Translation failed');

            await sock.sendMessage(ctx.sender, { 
                text: `🌐 *Translated to ${langCode}:*\n\n${translatedText}` 
            });
        } catch (e) {
            console.log('Translate error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ Translation Error: ' + e.message });
        }
    }
};
