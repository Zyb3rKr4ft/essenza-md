module.exports = {
    name: 'notify',
    category: 'general',
    description: 'Toggle the connection notification',
    ownerOnly: true,
    aliases: ['notifications'],
    async execute(sock, msg, args, ctx) {
        const action = (args[0] || '').toLowerCase();
        
        if (action === 'on') {
            ctx.settings.reconnectNotification = true;
            ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '✅ Connection notifications enabled.' });
        }
        if (action === 'off') {
            ctx.settings.reconnectNotification = false;
            ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '❌ Connection notifications disabled.' });
        }
        
        await sock.sendMessage(ctx.sender, { 
            text: `🔔 *Notification Status:* ${ctx.settings.reconnectNotification ? 'ON' : 'OFF'}\n\nUsage:\n${ctx.prefix}notify on\n${ctx.prefix}notify off` 
        });
    }
};
