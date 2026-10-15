function toFancy(text) {
    const normal = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const fancy  = '𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩0123456789';
    let out = '';
    for (const c of text) {
        const i = normal.indexOf(c);
        out += i >= 0 ? fancy[i] : c;
    }
    return out;
}

function getText(msg, args) {
    const ci = msg.message.extendedTextMessage?.contextInfo;
    const quoted = ci?.quotedMessage?.conversation || ci?.quotedMessage?.extendedTextMessage?.text;
    if (quoted) return quoted;
    return args.join(' ');
}

module.exports = {
    name: 'fancy',
    category: 'fun',
    description: 'Convert text to fancy Unicode',
    aliases: ['style'],
    async execute(sock, msg, args, ctx) {
        const text = getText(msg, args);
        if (!text) return sock.sendMessage(ctx.sender, { text: 'Reply or type text to convert.' });
        await sock.sendMessage(ctx.sender, { text: toFancy(text) });
    }
};
