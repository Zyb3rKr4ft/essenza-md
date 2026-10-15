const DARES = [
    'Send a selfie without any filter.',
    'Text your crush "I like you".',
    'Speak in a British accent for the next 10 minutes.',
    'Do 20 push-ups.',
    'Send your most recent photo in your gallery.',
    'Sing a song out loud.',
    'Let someone post anything on your status.',
    'Do your best impression of another group member.',
    'Send your last WhatsApp search.',
    'Say the alphabet backwards in 15 seconds.',
    'Do 10 squats while singing the alphabet.',
    'Post a throwback photo of yourself.',
    'Send a voice note singing your favourite song.',
    'Let the group pick your next profile picture.',
    'Reveal the last thing you searched online.'
];

module.exports = {
    name: 'dare',
    category: 'fun',
    description: 'Get a random dare challenge',
    async execute(sock, msg, args, ctx) {
        const d = DARES[Math.floor(Math.random() * DARES.length)];
        await sock.sendMessage(ctx.sender, { text: '🔥 *Dare*\n\n' + d });
    }
};
