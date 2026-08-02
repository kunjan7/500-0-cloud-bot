const puppeteer = require('puppeteer');

async function runBot() {
    console.log("Starting 500-0 Cloud Bot on Render...");

    const browser = await puppeteer.launch({
        headless: false, // Xvfb will render it on a virtual screen
        executablePath: '/usr/bin/google-chrome-stable',
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--window-size=1280,800',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log("Navigating to 500-0.com...");
    await page.goto('https://500-0.com', { waitUntil: 'networkidle2' });

    // Inject Bot State Machine into the browser
    await page.evaluate(() => {
        let isProcessingVictory = false;

        function triggerPixelClick(element) {
            const rect = element.getBoundingClientRect();
            const x = rect.left + (rect.width / 2);
            const y = rect.top + (rect.height / 2);
            const props = { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window };
            ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(evt => {
                element.dispatchEvent(evt.includes('pointer') ? new PointerEvent(evt, props) : new MouseEvent(evt, props));
            });
            if (typeof element.click === 'function') element.click();
        }

        function findAndClick(targetText, exact = false) {
            const elements = Array.from(document.querySelectorAll('*'));
            for (let el of elements) {
                if (el.children.length === 0) {
                    const text = el.textContent.toLowerCase().trim();
                    if ((exact && text === targetText.toLowerCase()) || (!exact && text.includes(targetText.toLowerCase()))) {
                        triggerPixelClick(el);
                        return true;
                    }
                }
            }
            return false;
        }

        setInterval(() => {
            if (isProcessingVictory) return; // Pause main loop while posting name

            const pageText = document.body.innerText.toLowerCase();

            // ----------------------------------------------------------------
            // 1. VICTORY HANDLER: "CLAIM YOUR SPOT" OR 500+ DETECTED
            // ----------------------------------------------------------------
            if (pageText.includes("claim your spot") || pageText.includes("history rewritten")) {
                isProcessingVictory = true;
                console.log("🏆 500+ DETECTED! CLICKING 'CLAIM YOUR SPOT'...");

                // Step A: Click "CLAIM YOUR SPOT" button if it exists
                findAndClick("claim your spot", false);

                setTimeout(() => {
                    // Step B: Generate username (e.g. KUNJAN7482)
                    const randomNum = Math.floor(1000 + Math.random() * 9000);
                    const username = "KUNJAN" + randomNum;
                    console.log(`Entering username: ${username}`);

                    // Step C: Fill input field
                    const inputs = document.querySelectorAll('input');
                    inputs.forEach(input => {
                        input.value = username;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    });

                    // Step D: Click Submit/Post/Enter button
                    setTimeout(() => {
                        const submitted = findAndClick("submit", false) || findAndClick("post", false) || findAndClick("enter", false);
                        console.log(`Leaderboard submission status: ${submitted}`);

                        // Resume drafting after 5 seconds
                        setTimeout(() => {
                            isProcessingVictory = false;
                            findAndClick("draft again", false) || findAndClick("play again", false);
                        }, 5000);
                    }, 1000);
                }, 1500);

                return;
            }

            // ----------------------------------------------------------------
            // 2. NORMAL DRAFTING LOOP
            // ----------------------------------------------------------------
            if (pageText.includes("choose difficulty") || pageText.includes("unofficial fan draft game")) {
                findAndClick("draft", true);
            } else if (findAndClick("skip to end", false) || findAndClick("simulate", false)) {
                // progressing match
            } else if (pageText.includes("game over") || pageText.includes("draft again") || pageText.includes("play again")) {
                if (!findAndClick("draft again", false)) findAndClick("play again", false);
            } else if (findAndClick("spin", true)) {
                // spinning
            }
        }, 1500);
    });
}

runBot();
