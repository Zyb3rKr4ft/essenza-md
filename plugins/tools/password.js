module.exports = {
    name: 'password',
    category: 'tools',
    description: 'Generate a secure random password',
    aliases: ['passgen', 'genpass'],
    async execute(sock, msg, args, ctx) {
        const length = parseInt(args[0]) || 16;
        if (length < 8 || length > 64) {
            return sock.sendMessage(ctx.sender, { text: '❌ Password length must be between 8 and 64.' });
        }

        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
        let password = "";
        
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }

        await sock.sendMessage(ctx.sender, { 
            text: `🔐 *Generated Password (${length} chars):*\n\n\`${password}\`\n\n_Tap to copy._` 
        });
    }
};
