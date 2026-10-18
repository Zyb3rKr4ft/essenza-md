module.exports = {
    name: 'calc',
    category: 'tools',
    description: 'Evaluate a math expression',
    aliases: ['math', 'calculate'],
    async execute(sock, msg, args, ctx) {
        const expr = args.join(' ').trim();
        if (!expr) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'calc 2 + 2 * 3' });

        // Only allow numbers, math operators, and basic functions
        if (!/^[0-9+\-*/().%\s^a-z]+$/i.test(expr)) {
            return sock.sendMessage(ctx.sender, { text: '❌ Invalid characters in expression.' });
        }

        try {
            // Replace common math functions with JS equivalents
            let safeExpr = expr
                .replace(/\^/g, '**')
                .replace(/sqrt/gi, 'Math.sqrt')
                .replace(/sin/gi, 'Math.sin')
                .replace(/cos/gi, 'Math.cos')
                .replace(/tan/gi, 'Math.tan')
                .replace(/pi/gi, 'Math.PI');

            // Evaluate
            const result = Function('"use strict"; return (' + safeExpr + ')')();
            
            if (typeof result !== 'number' || !isFinite(result)) {
                throw new Error('Result is not a valid number');
            }

            await sock.sendMessage(ctx.sender, { text: '🧮 ' + expr + ' = *' + result + '*' });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Invalid math expression.' });
        }
    }
};
