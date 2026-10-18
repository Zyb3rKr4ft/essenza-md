const fetch = globalThis.fetch;
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const googleTTS = require('google-tts-api');

// Available voices from StreamElements
const VOICES = {
    // US English
    'joey': { id: 'Joey', desc: 'US Male' },
    'salli': { id: 'Salli', desc: 'US Female' },
    'matthew': { id: 'Matthew', desc: 'US Male (Deep)' },
    'ivy': { id: 'Ivy', desc: 'US Female (Child)' },
    'justin': { id: 'Justin', desc: 'US Male (Child)' },
    
    // UK English
    'brian': { id: 'Brian', desc: 'UK Male' },
    'emma': { id: 'Emma', desc: 'UK Female' },
    'amy': { id: 'Amy', desc: 'UK Female' },
    
    // Indian English
    'raveena': { id: 'Raveena', desc: 'Indian Female' },
    'aditi': { id: 'Aditi', desc: 'Indian Female' },

    // Australian English
    'nicole': { id: 'Nicole', desc: 'Australian Female' },
    'russell': { id: 'Russell', desc: 'Australian Male' }
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
    const inFile = path.join(os.tmpdir(), `ttsx_in_${stamp}.mp3`);
    const outFile = path.join(os.tmpdir(), `ttsx_out_${stamp}.ogg`);
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
    name: 'ttsx',
    category: 'tools',
    description: 'Convert text to speech with StreamElements voices',
    aliases: ['speakx', 'sayx'],
    async execute(sock, msg, args, ctx) {
        let voiceKey = 'joey'; // Default
        let textArgs = args;

        // Check if first argument is a supported voice
        if (args[0] && VOICES[args[0].toLowerCase()]) {
            voiceKey = args[0].toLowerCase();
            textArgs = args.slice(1);
        }

        const text = textArgs.join(' ').trim();

        if (!text) {
            let voiceList = '🗣️ *TTSX - Available Voices:*\n';
            for (const [key, val] of Object.entries(VOICES)) {
                voiceList += `• \`${key}\` - ${val.desc}\n`;
            }
            return sock.sendMessage(ctx.sender, { 
                text: 'Usage: ' + ctx.prefix + 'ttsx [voice] <text>\n\n' + voiceList + '\nExample: ' + ctx.prefix + 'ttsx brian Hello mate!' 
            });
        }

        await sock.sendMessage(ctx.sender, { text: '🗣️ Generating audio...' });

        try {
            let rawBuffer = null;
            const voiceId = VOICES[voiceKey].id;
            const apiUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${voiceId}&text=${encodeURIComponent(text)}`;

            // 1. Try StreamElements (Supports Genders/Accents)
            try {
                const res = await fetch(apiUrl, { signal: AbortSignal.timeout(30000) });
                if (res.ok) {
                    rawBuffer = Buffer.from(await res.arrayBuffer());
                    console.log(`TTSX via StreamElements (${voiceId}) OK`);
                }
            } catch (e) {
                console.log('StreamElements failed:', e.message);
            }

            // 2. Fallback to Google TTS (No gender options, but very reliable)
            if (!rawBuffer) {
                console.log('Falling back to Google TTS...');
                const base64Audio = await googleTTS.getAudioBase64(text, { lang: 'en', slow: false, host: 'https://translate.google.com' });
                rawBuffer = Buffer.from(base64Audio, 'base64');
            }

            const oggBuffer = await convertToOgg(rawBuffer);
            console.log('TTSX generated: ' + (oggBuffer.length / 1024).toFixed(1) + ' KB');

            try {
                await sock.sendMessage(ctx.sender, {
                    audio: oggBuffer,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true,
                    fileName: 'ttsx.ogg'
                });
                console.log('TTSX sent as voice note');
            } catch (sendErr) {
                console.log('Voice note failed, sending as normal audio:', sendErr.message);
                await sock.sendMessage(ctx.sender, {
                    audio: oggBuffer,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: false,
                    fileName: 'ttsx.ogg'
                });
            }

        } catch (e) {
            console.log('TTSX error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ TTSX Error: ' + e.message });
        }
    }
};
