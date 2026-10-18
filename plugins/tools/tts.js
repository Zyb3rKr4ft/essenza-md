const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { synthesize } = require('@echristian/edge-tts');

// Curated list of global voices using Edge TTS (Microsoft)
const VOICES = {
    // --- Nigerian Accents ---
    'ng-female': { id: 'en-NG-EzinneNeural', desc: 'Nigerian Female' },
    'ng-male': { id: 'en-NG-AbeoNeural', desc: 'Nigerian Male' },

    // --- Ghanaian Accents ---
    'gh-female': { id: 'en-GH-AmaNeural', desc: 'Ghanaian Female' },
    'gh-male': { id: 'en-GH-KwameNeural', desc: 'Ghanaian Male' },

    // --- Kenyan Accents ---
    'ke-female': { id: 'en-KE-AsiliaNeural', desc: 'Kenyan Female' },
    'ke-male': { id: 'en-KE-ChilembaNeural', desc: 'Kenyan Male' },

    // --- South African Accents ---
    'za-female': { id: 'af-ZA-AdriNeural', desc: 'South African Female (Afrikaans)' },
    'za-male': { id: 'af-ZA-WillemNeural', desc: 'South African Male (Afrikaans)' },

    // --- Arabic Accents ---
    'ae-female': { id: 'ar-AE-FatimaNeural', desc: 'Arabic (UAE) Female' },
    'ae-male': { id: 'ar-AE-HamdanNeural', desc: 'Arabic (UAE) Male' },
    'eg-female': { id: 'ar-EG-SalmaNeural', desc: 'Arabic (Egypt) Female' },
    'eg-male': { id: 'ar-EG-ShakirNeural', desc: 'Arabic (Egypt) Male' },

    // --- UK & US Accents ---
    'us-female': { id: 'en-US-AriaNeural', desc: 'US Female' },
    'us-male': { id: 'en-US-GuyNeural', desc: 'US Male' },
    'uk-female': { id: 'en-GB-SoniaNeural', desc: 'UK Female' },
    'uk-male': { id: 'en-GB-RyanNeural', desc: 'UK Male' },
    
    // --- Indian & Australian Accents ---
    'in-female': { id: 'en-IN-NeerjaNeural', desc: 'Indian Female' },
    'in-male': { id: 'en-IN-PrabhatNeural', desc: 'Indian Male' },
    'au-female': { id: 'en-AU-NatashaNeural', desc: 'Australian Female' },
    'au-male': { id: 'en-AU-WilliamNeural', desc: 'Australian Male' }
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
    description: 'Convert text to speech with global accents',
    aliases: ['speak', 'say'],
    async execute(sock, msg, args, ctx) {
        let voiceKey = 'ng-female'; // Default to Nigerian Female (since you loved it)
        let textArgs = args;

        if (args[0] && VOICES[args[0].toLowerCase()]) {
            voiceKey = args[0].toLowerCase();
            textArgs = args.slice(1);
        }

        const text = textArgs.join(' ').trim();

        if (!text) {
            let voiceList = '🌍 *Available Global Voices:*\n\n';
            for (const [key, val] of Object.entries(VOICES)) {
                voiceList += `• \`${key}\` - ${val.desc}\n`;
            }
            return sock.sendMessage(ctx.sender, { 
                text: 'Usage: ' + ctx.prefix + 'tts [voice] <text>\n\n' + voiceList + '\nExample: ' + ctx.prefix + 'tts ng-male How far, my brother?' 
            });
        }

        await sock.sendMessage(ctx.sender, { text: `🗣️ Generating audio (${VOICES[voiceKey].desc})...` });

        try {
            const voiceId = VOICES[voiceKey].id;
            
            // Generate audio using Microsoft Edge TTS
            const { audio } = await synthesize({
                text: text,
                voice: voiceId,
                outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
            });

            const rawBuffer = Buffer.from(audio);
            const oggBuffer = await convertToOgg(rawBuffer);
            console.log(`TTS (${voiceId}) generated: ` + (oggBuffer.length / 1024).toFixed(1) + ' KB');

            try {
                await sock.sendMessage(ctx.sender, {
                    audio: oggBuffer,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true,
                    fileName: 'tts.ogg'
                });
                console.log('TTS sent as voice note');
            } catch (sendErr) {
                console.log('Voice note failed, sending as normal audio:', sendErr.message);
                await sock.sendMessage(ctx.sender, {
                    audio: oggBuffer,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: false,
                    fileName: 'tts.ogg'
                });
            }

        } catch (e) {
            console.log('TTS error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ TTS Error: ' + e.message });
        }
    }
};
