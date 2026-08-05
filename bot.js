const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin()); // Activate Stealth Mode to bypass Cloudflare
const fs = require('fs');
const http = require('http');

// =============================================================
// DUMMY HTTP SERVER (Safe Port Binding for Render Free Tier)
// =============================================================
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('500-0 Cloud Bot v35.0 is running 24/7!');
});

server.on('error', (err) => {
    console.log('HTTP Server notice:', err.message);
});

server.listen(PORT, () => {
    console.log(`Web server successfully bound to port ${PORT} for Render.`);
});

// =============================================================
// MAIN PUPPETEER BOT RUNNER
// =============================================================
async function runBot() {
    console.log("⚡ Starting Ultimate Drafter v35.0 (Smart Modal Resolver) on Render...");

    const browser = await puppeteer.launch({
        headless: false, // Xvfb virtual screen
        executablePath: '/usr/bin/google-chrome-stable',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1280,800',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // PIPE BROWSER LOGS TO RENDER DASHBOARD
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('[BOT]')) console.log(text);
    });

    // PERMANENT DATA SAVER
    await page.exposeFunction('saveScorecardToDisk', (matchData) => {
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const logEntry = `\n==================================================\n[${timestamp}] MATCH COMPLETED:\n${matchData}\n==================================================\n`;
        console.log(logEntry);
        fs.appendFileSync('simulation_results.txt', logEntry);
    });
