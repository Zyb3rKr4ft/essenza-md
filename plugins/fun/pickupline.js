const LINES = [
    'Are you a magician? Because whenever I look at you, everyone else disappears.',
    'Do you have a map? I keep getting lost in your eyes.',
    'Are you a parking ticket? Because you have FINE written all over you.',
    'Do you believe in love at first sight, or should I walk by again?',
    'Are you a camera? Because every time I look at you, I smile.',
    'Is your name Google? Because you have everything I have been searching for.',
    'Are you a time traveler? Because I see you in my future.',
    'Do you have a Band-Aid? Because I just scraped my knee falling for you.',
    'If you were a vegetable, you would be a cute-cumber.',
    'Are you an interior decorator? Because when I saw you, the room became beautiful.',
    'Are you Wi-Fi? Because I am feeling a connection.',
    'Do you have a sunburn, or are you always this hot?',
    'Are you a magician? Because every time you walk in, the room lights up.',
    'Do you have a pencil? Because I want to erase your past and write our future.',
    'Are you a bank loan? Because you have my interest.'
];

module.exports = {
    name: 'pickupline',
    category: 'fun',
    description: 'Get a random pickup line',
    aliases: ['pickup', 'flirt'],
    async execute(sock, msg, args, ctx) {
        const line = LINES[Math.floor(Math.random() * LINES.length)];
        await sock.sendMessage(ctx.sender, { text: '😘 ' + line });
    }
};
