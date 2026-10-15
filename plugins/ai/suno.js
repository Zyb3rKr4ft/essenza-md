const fetch = globalThis.fetch;

async function startGeneration(prompt) {
    const res = await fetch('https://api.omegatech.app/api/ai/sonu3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', prompt: prompt })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
}

async function pollResult(taskId) {
    const url = 'https://api.omegatech.app/api/ai/sonu3?action=result&taskId=' + encodeURIComponent(taskId);
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
}

async function downloadBuffer(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Download failed: HTTP ' + res.status);
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
}

module.exports = {
    name: 'suno',
    category: 'ai',
    description: 'Generate AI music from a text prompt',
    aliases: ['music', 'song'],
    async execute(sock, msg, args, ctx) {
        const prompt = args.join(' ').trim();
        if (!prompt) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'suno <describe the music>' });

        await sock.sendMessage(ctx.sender, { text: '🎵 Starting generation...' });

        try {
            const gen = await startGeneration(prompt);
            console.log('SUNO GENERATE:', JSON.stringify(gen, null, 2));

            const taskId = gen.taskId || gen.task_id || gen.data?.taskId;
            if (!taskId) throw new Error('No taskId returned.');

            await sock.sendMessage(ctx.sender, { text: '⏳ Generating... this takes ~90s. I will send it when ready.' });

            let result = null;
            let consecutiveErrors = 0;
            for (let i = 0; i < 30; i++) {
                await new Promise(r => setTimeout(r, 10000));
                try {
                    const poll = await pollResult(taskId);
                    console.log('SUNO POLL ' + (i + 1) + ' status=' + (poll.status || '?'));

                    if (poll && poll.success === false) {
                        throw new Error(poll.error || 'Generation failed');
                    }

                    const songData = poll.data || poll;
                    const url = songData.url || songData.audio_url;
                    if (url) {
                        result = songData;
                        break;
                    }
                    consecutiveErrors = 0;
                } catch (e) {
                    consecutiveErrors++;
                    console.log('Poll error (' + consecutiveErrors + '):', e.message);
                    if (consecutiveErrors >= 3) throw new Error('Poll failed 3x: ' + e.message);
                }
            }

            if (!result) throw new Error('Timed out after 5 minutes.');

            const title = result.title || 'AI Song';
            const tags = result.tags || '';
            const duration = result.duration ? Math.floor(result.duration / 60) + 'm ' + (result.duration % 60) + 's' : '';
            const lyrics = result.lyrics || '';
            const audioUrl = result.url || result.audio_url;

            // Send metadata first
            await sock.sendMessage(ctx.sender, {
                text: '🎵 *' + title + '*\n🏷 ' + tags + '\n⏱ ' + duration + '\n📝 ' + prompt
            });

            // Download the audio ourselves, then send as buffer
            await sock.sendMessage(ctx.sender, { text: '⬇️ Downloading audio...' });
            const audioBuf = await downloadBuffer(audioUrl);
            console.log('Downloaded audio: ' + audioBuf.length + ' bytes');

            await sock.sendMessage(ctx.sender, {
                audio: audioBuf,
                mimetype: 'audio/mpeg',
                ptt: false
            });

            // Send lyrics
            if (lyrics) {
                await sock.sendMessage(ctx.sender, { text: '📜 *Lyrics*\n\n' + lyrics });
            }
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Suno Error: ' + e.message });
        }
    }
};
