module.exports = {
    name: 'flip',
    category: 'fun',
    description: 'Flip a coin',
    aliases: ['coinflip', 'coin'],
    async execute(sock, msg, args, ctx) {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        const emoji = result === 'Heads' ? '🪙' : '🪙';
        await sock.sendMessage(ctx.sender, { text: emoji + ' ' + result + '!' });
    }
};
