const fetch = globalThis.fetch;
const AdmZip = require('adm-zip');

module.exports = {
    name: 'code',
    category: 'ai',
    description: 'Generate a full web app from a text prompt',
    aliases: ['llamacoder', 'buildapp'],
    async execute(sock, msg, args, ctx) {
        const prompt = args.join(' ').trim();
        if (!prompt) {
            return sock.sendMessage(ctx.sender, { 
                text: 'Usage: ' + ctx.prefix + 'code <describe the app you want to build>\nExample: ' + ctx.prefix + 'code A simple todo list app with React and Tailwind' 
            });
        }

        await sock.sendMessage(ctx.sender, { text: '🤖 Generating app code... This may take 30-60 seconds.' });

        try {
            const apiUrl = `https://api.omegatech.app/api/ai/llamacoder?action=create&prompt=${encodeURIComponent(prompt)}&quality=low`;
            
            const res = await fetch(apiUrl, { 
                headers: { 'User-Agent': 'Mozilla/5.0' },
                signal: AbortSignal.timeout(120000) 
            });
            
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            
            console.log(`Llamacoder generated ${data.filesCount} files.`);

            if (!data.success || !data.files || data.files.length === 0) {
                throw new Error('Failed to generate code or no files returned.');
            }

            // Create a zip file in memory
            const zip = new AdmZip();
            
            for (const file of data.files) {
                // Add each file to the zip archive
                zip.addFile(file.path, Buffer.from(file.content, 'utf8'));
            }

            const zipBuffer = zip.toBuffer();
            const sizeMB = (zipBuffer.length / 1024 / 1024).toFixed(2);
            console.log(`Zipped project size: ${sizeMB} MB`);

            const caption = `💻 *App Generated Successfully!*\n\n` +
                            `📝 *Prompt:* ${prompt}\n` +
                            `📁 *Files:* ${data.filesCount}\n` +
                            `📦 *Size:* ${sizeMB} MB\n\n` +
                            `_Extract the .zip file, run \`npm install\`, and \`npm run dev\` to start._`;

            await sock.sendMessage(ctx.sender, {
                document: zipBuffer,
                mimetype: 'application/zip',
                fileName: 'llamacoder_project.zip',
                caption: caption
            });

        } catch (e) {
            console.log('Llamacoder error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ Code Gen Error: ' + e.message });
        }
    }
};
