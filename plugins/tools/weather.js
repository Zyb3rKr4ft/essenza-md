const fetch = globalThis.fetch;

module.exports = {
    name: 'weather',
    category: 'tools',
    description: 'Get the current weather for a city',
    async execute(sock, msg, args, ctx) {
        const city = args.join(' ').trim();
        if (!city) return sock.sendMessage(ctx.sender, { text: 'Usage: ' + ctx.prefix + 'weather <city>\nExample: ' + ctx.prefix + 'weather Lagos' });

        await sock.sendMessage(ctx.sender, { text: '🌤️ Fetching weather for ' + city + '...' });

        try {
            // 1. Get coordinates for the city
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
            const geoRes = await fetch(geoUrl);
            const geoData = await geoRes.json();

            if (!geoData.results || geoData.results.length === 0) {
                throw new Error('City not found');
            }

            const { latitude, longitude, name, country } = geoData.results[0];

            // 2. Get weather for those coordinates
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
            const weatherRes = await fetch(weatherUrl);
            const weatherData = await weatherRes.json();

            const w = weatherData.current_weather;
            if (!w) throw new Error('Weather data unavailable');

            const text = `🌍 *Weather for ${name}, ${country}*\n\n` +
                         `🌡️ *Temperature:* ${w.temperature}°C\n` +
                         `💨 *Wind Speed:* ${w.windspeed} km/h\n` +
                         `🧭 *Wind Direction:* ${w.winddirection}°\n` +
                         `⏱️ *Time:* ${new Date(w.time).toLocaleString()}`;

            await sock.sendMessage(ctx.sender, { text: text });
        } catch (e) {
            console.log('Weather error:', e.message);
            await sock.sendMessage(ctx.sender, { text: '❌ Weather Error: ' + e.message });
        }
    }
};
