const MAP = {
    a: '🅰️', b: '🅱️', c: '©️', d: '🇩', e: '📧', f: '🎏', g: '🇬', h: '♓',
    i: 'ℹ️', j: '🎷', k: '🎋', l: '👢', m: 'Ⓜ️', n: '🇳', o: '⭕', p: '🅿️',
    q: '🇶', r: '®️', s: '💲', t: '🌴', u: '⛎', v: '✅', w: '〰️', x: '❌',
    y: '🍸', z: '💤',
    '0': '0️⃣', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣', '4': '4️⃣',
    '5': '5️⃣', '6': '6️⃣', '7': '7️⃣', '8': '8️⃣', '9': '9️⃣',
    '!': '❗', '?': '❓', ' ': '  '
};

function getText(msg, args) {
    const ci = msg.message.extendedTextMessage?.contextInfo;
    const quoted = ci?.quotedMessage?.conversation || ci?.quotedMessage?.extendedTextMessage?.text;
    if (quoted) return quoted;
    return args.join(' ');
}

module.exports = {
    name: 'emojify',
    category: 'fun',
    description: 'Turn text into emojis',
    async execute(sock, msg, args, ctx) {
        const text = getText(msg, args).toLowerCase();
        if (!text) return sock.sendMessage(ctx.sender, { text: 'Reply or type text to emojify.' });
        let out = '';
        for (const c of text) out += (MAP[c] || c) + ' ';
        await sock.sendMessage(ctx.sender, { text: out.trim() });
    }
};
