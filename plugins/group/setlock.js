function parseTime(s) {
    if (!s) return null;
    const m = String(s).match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0');
}

module.exports = {
    name: 'setlock',
    category: 'group',
    description: 'Schedule automatic group lock at a daily time',
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        if (!ctx.groupSettings.lockSchedule) {
            ctx.groupSettings.lockSchedule = { lockAt: null, unlockAt: null, lastLock: null, lastUnlock: null };
        }
        const sch = ctx.groupSettings.lockSchedule;
        const a = (args[0] || '').toLowerCase();

        if (a === 'off') {
            sch.lockAt = null;
            ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '✅ Auto-lock disabled.' });
        }

        const time = parseTime(a);
        if (!time) {
            return sock.sendMessage(ctx.sender, {
                text: '🕐 *Lock Schedule*\n' +
                      'Lock: ' + (sch.lockAt || '(not set)') + '\n' +
                      'Unlock: ' + (sch.unlockAt || '(not set)') + '\n\n' +
                      '*Usage*\n' +
                      ctx.prefix + 'setlock HH:MM — lock daily at that time\n' +
                      ctx.prefix + 'setlock off — disable\n' +
                      'Example: ' + ctx.prefix + 'setlock 22:00'
            });
        }

        if (sch.unlockAt === time) {
            return sock.sendMessage(ctx.sender, { text: '❌ Lock and unlock time can\'t be the same.' });
        }

        sch.lockAt = time;
        ctx.saveSettings();
        await sock.sendMessage(ctx.sender, {
            text: '✅ Group will lock daily at *' + time + '*.\n' +
                  'Use ' + ctx.prefix + 'setunlock to schedule reopening.'
        });
    }
};
