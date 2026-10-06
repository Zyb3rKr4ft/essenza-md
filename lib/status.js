const recent = new Set();

function pickDelay(cfg) {
    if (cfg.mode === 'instant') return 1000;
    if (cfg.mode === 'fixed') return Math.max(1000, cfg.fixedDelayMs || 30000);
    const min = cfg.randomMinMs || 5000;
    const max = cfg.randomMaxMs || 90000;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickEmoji(pool) {
    if (!Array.isArray(pool) || !pool.length) return '❤️';
    return pool[Math.floor(Math.random() * pool.length)];
}

async function handleStatus(sock, msg, settings, saveSettings) {
    try {
        const s = settings.status;
        if (!s) return;
        const keyId = msg.key.id + '|' + (msg.key.participant || msg.participant || '');
        if (recent.has(keyId)) return;
        recent.add(keyId);
        setTimeout(() => recent.delete(keyId), 300000);

        const participant = msg.key.participant || msg.participant;
        if (!participant) return;

        if (s.autoView?.enabled) {
            const delay = pickDelay(s.autoView);
            setTimeout(async () => {
                try { await sock.readMessages([msg.key]); } catch (e) {}
            }, delay);
        }

        if (s.autoReact?.enabled) {
            const delay = pickDelay(s.autoReact);
            setTimeout(async () => {
                try {
                    const emoji = pickEmoji(s.autoReact.emojiPool);
                    await sock.sendMessage('status@broadcast', {
                        react: { text: emoji, key: msg.key }
                    }, { statusJidList: [participant] });
                } catch (e) {}
            }, delay + 500);
        }
    } catch (e) {
        console.error('Status handler error:', e.message);
    }
}

module.exports = { handleStatus };
