const fetch = globalThis.fetch;
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const VOICES = {
    'us-female': 'Salli', 'us-male': 'Joey', 'uk-male': 'Brian', 'uk-female': 'Emma',
    'in-female': 'Raveena', 'au-female': 'Nicole', 'au-male': 'Russell'
};

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
    const inFile = path.join(os.tmpdir(), `ttsp_in_${stamp}.mp3`);
    const outFile = path.join(os.tmpdir(), `ttsp_out_${stamp}.ogg`);
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
    name: 'ttspro',
    category: 'tools',
    description: 'Advanced TTS with accents',
    aliases: ['speakpro'],
    async execute(sock, msg, args, ctx) {
        let voiceKey = 'us-male';
        let textArgs = args;

        if (args[0] && VOICES[args[0].toLowerCase()]) {
            voiceKey = args[0].toLowerCase();
            textArgs = args.slice(1);
        }

        const text = textArgs.join(' ').trim();
        if (!text) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'ttspro [voice] <text>' });

        await sock.sendMessage(ctx.sender, { text: `🗣️ Generating (${VOICES[voiceKey]})...` });

        try {
            const apiUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${VOICES[voiceKey]}&text=${encodeURIComponent(text)}`;
            const res = await fetch(apiUrl, { signal: AbortSignal.timeout(30000) });
            if (!res.ok) throw new Error('API failed');
            
            const rawBuffer = Buffer.from(await res.arrayBuffer());
            const oggBuffer = await convertToOgg(rawBuffer);

            await sock.sendMessage(ctx.sender, { audio: oggBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true, fileName: 'ttspro.ogg' });
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ TTSPro Error: ' + e.message });
        }
    }
};
