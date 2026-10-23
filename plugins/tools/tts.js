const fetch = globalThis.fetch;
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { maxBuffer: 100 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) reject(new Error((stderr || err.message || '').split('\n').slice(-2).join(' | ')));
            else resolve(stdout);
        });
    });
}

async function convertToOgg(inputBuffer) {
    const stamp = Date.now();
    const inFile = path.join(os.tmpdir(), `tts_in_${stamp}.mp3`);
    const outFile = path.join(os.tmpdir(), `tts_out_${stamp}.ogg`);
    fs.writeFileSync(inFile, inputBuffer);
    try {
        await run(`ffmpeg -y -hide_banner -loglevel error -i "${inFile}" -c:a libopus -b:a 64k -ar 48000 -ac 1 -f ogg "${outFile}"`);
        return fs.readFileSync(outFile);
    } finally {
        try { fs.unlinkSync(inFile); } catch (e) {}
        try { fs.unlinkSync(outFile); } catch (e) {}
    }
}

module.exports = {
    name: 'tts',
    category: 'tools',
    description: 'Convert text to speech (Basic)',
    aliases: ['speak', 'say'],
    async execute(sock, msg, args, ctx) {
        const text = args.join(' ').trim();
        if (!text) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'tts <text>' });

        await sock.sendMessage(ctx.sender, { text: '🗣️ Generating audio...' });

        try {
            // Using StreamElements (Joey - US Male) since it's the most reliable on this server
            const apiUrl = `https://api.streamelements.com/kappa/v2/speech?voice=Joey&text=${encodeURIComponent(text)}`;
            const res = await fetch(apiUrl, { signal: AbortSignal.timeout(30000) });
            if (!res.ok) throw new Error('API failed');
            
            const rawBuffer = Buffer.from(await res.arrayBuffer());
            const oggBuffer = await convertToOgg(rawBuffer);

            await sock.sendMessage(ctx.sender, { audio: oggBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true, fileName: 'tts.ogg' });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ TTS Error: ' + e.message });
        }
    }
};
