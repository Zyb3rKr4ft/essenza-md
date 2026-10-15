module.exports = {
    name: 'dice',
    category: 'fun',
    description: 'Roll a dice (1-6)',
    aliases: ['roll'],
    async execute(sock, msg, args, ctx) {
        const sides = parseInt(args[0]) || 6;
        if (sides < 2 || sides > 1000) return sock.sendMessage(ctx.sender, { text: 'Sides must be 2-1000.' });
        const result = Math.floor(Math.random() * sides) + 1;
        await sock.sendMessage(ctx.sender, { text: '🎲 You rolled: *' + result + '* (1-' + sides + ')' });
    }
};
