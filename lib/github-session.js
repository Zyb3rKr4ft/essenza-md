const fetch = globalThis.fetch;
const fs = require('fs');
const path = require('path');

const REPO = process.env.SESSION_REPO;
const TOKEN = process.env.SESSION_GITHUB_TOKEN;
const FILE_PATH = 'session.json';

function enabled() {
    return !!(REPO && TOKEN);
}

async function ghRequest(url, options = {}) {
    return fetch(url, {
        ...options,
        headers: {
            'Authorization': 'token ' + TOKEN,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'EssenzaMD',
            ...(options.headers || {})
        }
    });
}

async function fetchRemote() {
    const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
    const res = await ghRequest(url);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('GitHub fetch failed: HTTP ' + res.status);
    const data = await res.json();
    const content = Buffer.from(data.content, 'base64').toString('utf8');
    return { files: JSON.parse(content), sha: data.sha };
}

async function pushRemote(filesObj, sha) {
    const content = Buffer.from(JSON.stringify(filesObj)).toString('base64');

    // Always fetch the latest SHA before pushing (fixes 422 after fresh restore)
    let latestSha = sha;
    try {
        const check = await ghRequest(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`);
        if (check.ok) {
            const meta = await check.json();
            latestSha = meta.sha;
        } else if (check.status === 404) {
            latestSha = null;
        }
    } catch (e) {
        console.error('[github-session] SHA fetch failed:', e.message);
    }

    const body = {
        message: 'session sync ' + new Date().toISOString(),
        content,
        ...(latestSha ? { sha: latestSha } : {})
    };
    const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
    const res = await ghRequest(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error('GitHub push failed: HTTP ' + res.status + ' ' + err.slice(0, 200));
    }
    const data = await res.json();
    return data.content.sha;
}
function serializeFolder(folder) {
    const out = {};
    if (!fs.existsSync(folder)) return out;
    for (const file of fs.readdirSync(folder)) {
        const p = path.join(folder, file);
        if (fs.statSync(p).isFile()) {
            out[file] = fs.readFileSync(p).toString('base64');
        }
    }
    return out;
}

function restoreFolder(folder, filesObj) {
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    let count = 0;
    for (const [name, b64] of Object.entries(filesObj)) {
        fs.writeFileSync(path.join(folder, name), Buffer.from(b64, 'base64'));
        count++;
    }
    return count;
}

async function restoreIfNeeded(sessionFolder) {
    if (!enabled()) {
        console.log('[github-session] Disabled (missing REPO or TOKEN)');
        return { restored: false };
    }
    const hasLocal = fs.existsSync(sessionFolder) &&
        fs.readdirSync(sessionFolder).some(f => f.endsWith('.json'));
    if (hasLocal) {
        console.log('[github-session] Local session found — skipping restore');
        return { restored: false };
    }
    try {
        const remote = await fetchRemote();
        if (!remote) {
            console.log('[github-session] No remote session found — will pair fresh');
            return { restored: false };
        }
        const count = restoreFolder(sessionFolder, remote.files);
        console.log('[github-session] Restored ' + count + ' files from GitHub');
        return { restored: true, sha: remote.sha };
    } catch (e) {
        console.error('[github-session] Restore failed:', e.message);
        return { restored: false };
    }
}

let lastPush = 0;
let currentSha = null;
let pushTimer = null;
let pendingFolder = null;

async function pushSession(sessionFolder) {
    if (!enabled()) return;
    const now = Date.now();
    if (now - lastPush < 30000) {
        // Debounce: schedule a push after cooldown
        pendingFolder = sessionFolder;
        if (pushTimer) return;
        pushTimer = setTimeout(async () => {
            pushTimer = null;
            const f = pendingFolder;
            pendingFolder = null;
            if (f) await pushSession(f);
        }, 30000 - (now - lastPush));
        return;
    }
    lastPush = now;
    try {
        const files = serializeFolder(sessionFolder);
        currentSha = await pushRemote(files, currentSha);
        console.log('[github-session] Pushed ' + Object.keys(files).length + ' files to GitHub');
    } catch (e) {
        console.error('[github-session] Push failed:', e.message);
    }
}

module.exports = { restoreIfNeeded, pushSession, enabled };
