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
    name: 'setunlock',
    category: 'group',
    description: 'Schedule automatic group unlock at a daily time',
    groupOnly: true,
    adminOnly: true,
    async execute(sock, msg, args, ctx) {
        if (!ctx.groupSettings.lockSchedule) {
            ctx.groupSettings.lockSchedule = { lockAt: null, unlockAt: null, lastLock: null, lastUnlock: null };
        }
        const sch = ctx.groupSettings.lockSchedule;
        const a = (args[0] || '').toLowerCase();

        if (a === 'off') {
            sch.unlockAt = null;
            ctx.saveSettings();
            return sock.sendMessage(ctx.sender, { text: '✅ Auto-unlock disabled.' });
        }

        const time = parseTime(a);
        if (!time) {
            return sock.sendMessage(ctx.sender, {
                text: '🕐 *Unlock Schedule*\n' +
                      'Lock: ' + (sch.lockAt || '(not set)') + '\n' +
                      'Unlock: ' + (sch.unlockAt || '(not set)') + '\n\n' +
                      '*Usage*\n' +
                      ctx.prefix + 'setunlock HH:MM — unlock daily at that time\n' +
                      ctx.prefix + 'setunlock off — disable\n' +
                      'Example: ' + ctx.prefix + 'setunlock 06:00'
            });
        }

        if (sch.lockAt === time) {
            return sock.sendMessage(ctx.sender, { text: '❌ Unlock and lock time can\'t be the same.' });
        }

        sch.unlockAt = time;
        ctx.saveSettings();
        await sock.sendMessage(ctx.sender, {
            text: '✅ Group will unlock daily at *' + time + '*.\n' +
                  'Use ' + ctx.prefix + 'setlock to schedule locking.'
        });
    }
};
