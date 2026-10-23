module.exports = {
    name: 'exit',
    category: 'group',
    description: 'Bot leaves the group dramatically',
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        await sock.sendMessage(ctx.sender, { 
            text: '⚠️ *INITIATING EXIT PROTOCOL* ⚠️\n\nZone 8 Sector 42 has been cleared. The Doom approaches.\n\n*OBLITERATE.*' 
        });
        await new Promise(r => setTimeout(r, 2000));
        await sock.groupLeave(ctx.sender);
    }
};
