const ANSWERS = [
    'It is certain.', 'It is decidedly so.', 'Without a doubt.',
    'Yes, definitely.', 'You may rely on it.', 'As I see it, yes.',
    'Most likely.', 'Outlook good.', 'Yes.', 'Signs point to yes.',
    'Reply hazy, try again.', 'Ask again later.', 'Better not tell you now.',
    'Cannot predict now.', 'Concentrate and ask again.',
    'Do not count on it.', 'My reply is no.', 'My sources say no.',
    'Outlook not so good.', 'Very doubtful.'
];

module.exports = {
    name: '8ball',
    category: 'fun',
    description: 'Ask the magic 8-ball a yes/no question',
    aliases: ['eightball', 'magic8'],
    async execute(sock, msg, args, ctx) {
        const q = args.join(' ');
        if (!q) return sock.sendMessage(ctx.sender, { text: 'Ask a yes/no question: ' + ctx.prefix + '8ball Will I be rich?' });
        const answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
        await sock.sendMessage(ctx.sender, { text: '🎱 *Question:* ' + q + '\n\n*Answer:* ' + answer });
    }
};
