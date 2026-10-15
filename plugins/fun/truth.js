const QUESTIONS = [
    'What is your biggest fear?',
    'Who was your first crush?',
    'What is the most embarrassing thing you have done?',
    'Have you ever lied to your best friend?',
    'What is your biggest regret?',
    'Have you ever stolen anything?',
    'What is the worst gift you have ever received?',
    'Who do you secretly dislike?',
    'What is your most used emoji?',
    'Have you ever cried watching a movie?',
    'What is the silliest thing you have cried about?',
    'What is the biggest lie you have told your parents?',
    'Who is your secret crush right now?',
    'Have you ever cheated on a test?',
    'What is the most childish thing you still do?'
];

module.exports = {
    name: 'truth',
    category: 'fun',
    description: 'Get a random truth question',
    async execute(sock, msg, args, ctx) {
        const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
        await sock.sendMessage(ctx.sender, { text: '🎯 *Truth*\n\n' + q });
    }
};
