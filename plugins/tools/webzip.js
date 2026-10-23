const fetch = globalThis.fetch;

module.exports = {
    name: 'webzip',
    category: 'tools',
    description: 'Download any webpage as a ZIP file',
    aliases: ['zipweb'],
    async execute(sock, msg, args, ctx) {
        const url = args[0];
        if (!url || !url.startsWith('http')) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'webzip <url>' });

        await sock.sendMessage(ctx.sender, { text: '⏳ Zipping webpage...' });

        try {
            const res = await fetch(`https://api.omegatech.app/api/tools/webtozip?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            
            if (!data.success || !data.result || !data.result.downloadUrl) {
                throw new Error('Failed to zip webpage.');
            }

            const { downloadUrl, copiedFilesAmount } = data.result;
            await sock.sendMessage(ctx.sender, { text: `📦 Downloading ZIP (${copiedFilesAmount} files)...` });

            const zipRes = await fetch(downloadUrl, { signal: AbortSignal.timeout(120000) });
            const zipBuf = Buffer.from(await zipRes.arrayBuffer());

            await sock.sendMessage(ctx.sender, {
                document: zipBuf,
                mimetype: 'application/zip',
                fileName: `webpage_${Date.now()}.zip`,
                caption: `📦 *Webpage Downloaded*\n🔗 ${url}\n📄 Files: ${copiedFilesAmount}`
            });
        } catch (e) { await sock.sendMessage(ctx.sender, { text: '❌ Error: ' + e.message }); }
    }
};
