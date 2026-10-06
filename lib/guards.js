const spamTracker = new Map();

function containsURL(text) {
    return /(https?:\/\/|www\.|chat\.whatsapp\.com\/|wa\.me\/)/i.test(text || '');
}

function extractDomains(text) {
    if (!text) return [];
    const matches = text.match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)/gi) || [];
    return matches.map(m => m.replace(/^https?:\/\//i, '').replace(/^www\./i, '').toLowerCase());
}

function domainMatches(candidate, blocked) {
    const c = candidate.toLowerCase();
    const b = blocked.toLowerCase().replace(/^www\./, '');
    return c === b || c.endsWith('.' + b);
}

async function runGuards(sock, msg, ctx) {
    try {
        if (ctx.isGroup && ctx.groupMetadata) {
            const gs = ctx.groupSettings || {};

            // Mute check (highest priority — even admins can be muted if owner mutes them)
            if (Array.isArray(gs.muted) && gs.muted.length && !ctx.isSuperSudo) {
                if (gs.muted.includes(ctx.realSender)) {
                    try { await sock.sendMessage(ctx.sender, { delete: msg.key }); } catch (e) {}
                    try {
                        await sock.sendMessage(ctx.realSender + '@s.whatsapp.net', {
                            text: '🔇 You are muted in this group.\nContact an admin to be unmuted.'
                        });
                    } catch (e) {}
                    return { blocked: true };
                }
            }

            // Anti-link (blocks ALL urls)
            if (gs.antilink && !ctx.isAdmin && !ctx.isSuperSudo && containsURL(ctx.text)) {
                try { await sock.sendMessage(ctx.sender, { delete: msg.key }); } catch (e) {}
                return { blocked: true };
            }

            // Anti-url (blocks SPECIFIC domains)
            if (gs.antiurl && gs.antiurl.enabled && Array.isArray(gs.antiurl.domains) && gs.antiurl.domains.length && !ctx.isAdmin && !ctx.isSuperSudo) {
                const found = extractDomains(ctx.text);
                let hit = false;
                for (const d of found) {
                    for (const b of gs.antiurl.domains) {
                        if (domainMatches(d, b)) { hit = true; break; }
                    }
                    if (hit) break;
                }
                if (hit) {
                    try { await sock.sendMessage(ctx.sender, { delete: msg.key }); } catch (e) {}
                    try {
                        await sock.sendMessage(ctx.sender, { text: '🚫 Blocked domain removed.', mentions: [ctx.participantNumber + '@s.whatsapp.net'] });
                    } catch (e) {}
                    return { blocked: true };
                }
            }

            // Anti-badwords
            const abw = gs.antibadwords;
            if (abw && abw.enabled && Array.isArray(abw.words) && abw.words.length && !ctx.isAdmin && !ctx.isSuperSudo) {
                const lower = (ctx.text || '').toLowerCase();
                const w = abw.words.find(x => lower.includes(String(x).toLowerCase()));
                if (w) {
                    try { await sock.sendMessage(ctx.sender, { delete: msg.key }); } catch (e) {}
                    return { blocked: true };
                }
            }

            // Anti-spam
            if (gs.antispam && !ctx.isAdmin && !ctx.isSuperSudo) {
                const key = ctx.sender + '|' + ctx.realSender;
                const now = Date.now();
                const window = 5000;
                const limit = 5;
                let arr = spamTracker.get(key) || [];
                arr = arr.filter(t => now - t < window);
                arr.push(now);
                spamTracker.set(key, arr);
                if (arr.length > limit) {
                    try { await sock.sendMessage(ctx.sender, { delete: msg.key }); } catch (e) {}
                    return { blocked: true };
                }
            }
        }
    } catch (e) {
        console.error('Guard error:', e.message);
    }
    return { blocked: false };
}

module.exports = { runGuards };
