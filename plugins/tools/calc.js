module.exports = {
    name: 'calc',
    category: 'tools',
    description: 'Evaluate a math expression',
    aliases: ['math', 'calculate'],
    async execute(sock, msg, args, ctx) {
        const expr = args.join(' ').trim();
        if (!expr) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'calc 2 + 2 * 3' });
        if (!/^[0-9+\-*/().%\s^]+$/.test(expr)) {
            return sock.sendMessage(ctx.sender, { text: '❌ Only numbers and + - * / ( ) % ^ allowed.' });
        }
        const safe = expr.replace(/\^/g, '**');
        let result;
        try {
            result = Function('"use strict"; return (' + safe + ')')();
        } catch (e) {
            return sock.sendMessage(ctx.sender, { text: '❌ Invalid expression.' });
        }
        if (typeof result !== 'number' || !isFinite(result)) {
            return sock.sendMessage(ctx.sender, { text: '❌ Not a valid number.' });
        }
        await sock.sendMessage(ctx.sender, { text: '🧮 ' + expr + ' = *' + result + '*' });
    }
};
