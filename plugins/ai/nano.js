const baileys = require('@whiskeysockets/baileys');
const fetch = globalThis.fetch;

global.nanoSessions = global.nanoSessions || {};

async function uploadToCatbox(buffer) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', new Blob([buffer]), 'image.jpg');
    const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form });
    if (!res.ok) throw new Error('Upload failed');
    return (await res.text()).trim();
}

module.exports = {
    name: 'nano',
    category: 'ai',
    description: 'Nano-Banana image generation and editing',
    aliases: ['nanopro'],
    async execute(sock, msg, args, ctx) {
        const command = ctx.text.slice(ctx.prefix.length).trim().split(/\s+/)[0].toLowerCase();
        const isPro = command === 'nanopro';
        const prompt = args.join(' ').trim();
        const sender = ctx.realSender;

        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMsg = quoted?.imageMessage || msg.message.imageMessage;

        // --- NANOPRO COLLECTOR MODE ---
        if (isPro) {
            if (!global.nanoSessions[sender]) global.nanoSessions[sender] = [];

            if (prompt.toLowerCase().startsWith('done')) {
                const finalPrompt = prompt.replace(/done/i, '').trim();
                const images = global.nanoSessions[sender];
                
                if (images.length < 2) return sock.sendMessage(ctx.sender, { text: '⚠️ Add at least 2 images before finishing.' });
                if (!finalPrompt) return sock.sendMessage(ctx.sender, { text: '⚠️ Provide a prompt: ' + ctx.prefix + 'nanopro done <prompt>' });

                await sock.sendMessage(ctx.sender, { text: '🕒 Blending images... This may take a minute.' });
                try {
                    let apiUrl = `https://omegatech-api.dixonomega.tech/api/ai/nanobana-pro-v3?prompt=${encodeURIComponent(finalPrompt)}`;
                    images.forEach((url, i) => { apiUrl += `&image${i + 1}=${encodeURIComponent(url)}`; });

                    const res = await fetch(apiUrl);
                    const data = await res.json();
                    if (!data.success) throw new Error('Blend failed');

                    const taskId = data.task_id;
                    let resultUrl = null;
                    for (let i = 0; i < 25; i++) {
                        await new Promise(r => setTimeout(r, 5000));
                        const check = await (await fetch(`https://omegatech-api.dixonomega.tech/api/ai/nano-banana2-result?task_id=${taskId}`)).json();
                        if (check.status === 'completed') { resultUrl = check.image_url; break; }
                        if (check.status === 'failed') throw new Error('Server failed to blend.');
                    }

                    if (!resultUrl) throw new Error('Timed out.');
                    
                    const imgRes = await fetch(resultUrl);
                    const buffer = Buffer.from(await imgRes.arrayBuffer());
                    
                    await sock.sendMessage(ctx.sender, { image: buffer, caption: `🍌 *NANO-BANANA PRO*\n\n🖼️ Blended: ${images.length} images\n📝 Prompt: ${finalPrompt}` });
                    delete global.nanoSessions[sender];
                } catch (e) {
                    await sock.sendMessage(ctx.sender, { text: '❌ Error: ' + e.message });
                    delete global.nanoSessions[sender];
                }
                return;
            }

            if (imageMsg) {
                if (global.nanoSessions[sender].length >= 4) return sock.sendMessage(ctx.sender, { text: '❌ Max 4 images.' });
                const stream = await baileys.downloadContentFromMessage(imageMsg, 'image');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                
                const url = await uploadToCatbox(buffer);
                global.nanoSessions[sender].push(url);
                return sock.sendMessage(ctx.sender, { text: `✅ Image ${global.nanoSessions[sender].length}/4 added.\nSend more or type ${ctx.prefix}nanopro done <prompt>` });
            }

            return sock.sendMessage(ctx.sender, { text: `📸 Send images to blend (up to 4).\nType ${ctx.prefix}nanopro done <prompt> when ready.` });
        }

        // --- REGULAR NANO ---
        if (!prompt && !imageMsg) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'nano <prompt>\nOr reply to an image with ' + ctx.prefix + 'nano <prompt>' });

        await sock.sendMessage(ctx.sender, { text: '🎨 Generating...' });

        try {
            if (imageMsg) {
                const stream = await baileys.downloadContentFromMessage(imageMsg, 'image');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                const imageUrl = await uploadToCatbox(buffer);

                const init = await (await fetch(`https://omegatech-api.dixonomega.tech/api/ai/nano-banana2?prompt=${encodeURIComponent(prompt)}&image=${encodeURIComponent(imageUrl)}`)).json();
                let resultUrl = null;
                for (let i = 0; i < 20; i++) {
                    await new Promise(r => setTimeout(r, 5000));
                    const check = await (await fetch(`https://omegatech-api.dixonomega.tech/api/ai/nano-banana2-result?task_id=${init.task_id}`)).json();
                    if (check.status === 'completed') { resultUrl = check.image_url; break; }
                }
                if (!resultUrl) throw new Error('Timed out.');

                const imgRes = await fetch(resultUrl);
                const outBuf = Buffer.from(await imgRes.arrayBuffer());
                await sock.sendMessage(ctx.sender, { image: outBuf, caption: `✨ *NANO EDIT*\n📝 Prompt: ${prompt}` });
            } else {
                const data = await (await fetch(`https://omegatech-api.dixonomega.tech/api/ai/nano-banana-pro?prompt=${encodeURIComponent(prompt)}`)).json();
                if (!data.image) throw new Error('No image generated.');
                
                const imgRes = await fetch(data.image);
                const buffer = Buffer.from(await imgRes.arrayBuffer());
                await sock.sendMessage(ctx.sender, { image: buffer, caption: `🍌 *NANO PRO*\n📝 Prompt: ${prompt}` });
            }
        } catch (e) {
            await sock.sendMessage(ctx.sender, { text: '❌ Error: ' + e.message });
        }
    }
};
