const fs = require('fs');

const SETTINGS_FILE = './essenza_settings.json';

const DEFAULTS = {
    mode: 'private',
    prefix: '$',
    anticall: false,
    vvToDM: false,
    menuImage: null,
    afk: { enabled: false, since: null, message: null, replied: [] },
    sudo: [],
    superSudo: [],
    status: {
        autoView: { enabled: false, mode: 'random', fixedDelayMs: 30000, randomMinMs: 5000, randomMaxMs: 90000 },
        autoReact: { enabled: false, mode: 'random', fixedDelayMs: 60000, randomMinMs: 10000, randomMaxMs: 120000, emojiPool: ['🔥', '❤️', '👍', '😂', '💯', '😍'] }
    },
    groups: {}
};

function load() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const s = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
            return Object.assign({}, DEFAULTS, s);
        }
    } catch (e) { console.error('Settings load error:', e.message); }
    save(DEFAULTS);
    return Object.assign({}, DEFAULTS);
}

function save(s) {
    try { fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2)); }
    catch (e) { console.error('Settings save error:', e.message); }
}

function getGroup(settings, jid) {
    if (!settings.groups[jid]) {
        settings.groups[jid] = {};
    }
    const g = settings.groups[jid];
    if (g.antilink === undefined) g.antilink = false;
    if (g.antispam === undefined) g.antispam = false;
    if (!g.antibadwords) g.antibadwords = { enabled: false, words: [] };
    if (g.antidelete === undefined) g.antidelete = false;
    if (g.antibot === undefined) g.antibot = false;
    if (!g.welcome || typeof g.welcome !== 'object') g.welcome = { enabled: false, message: null };
    if (!g.goodbye || typeof g.goodbye !== 'object') g.goodbye = { enabled: false, message: null };
    if (!g.antiurl) g.antiurl = { enabled: false, domains: [] };
    if (!Array.isArray(g.muted)) g.muted = [];
    if (!g.lockSchedule) g.lockSchedule = { lockAt: null, unlockAt: null, lastLock: null, lastUnlock: null };
    return g;
}

module.exports = { load, save, getGroup };
