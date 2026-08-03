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
    res.end('500-0 Cloud Bot v28.1 is running 24/7!');
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
    console.log("⚡ Starting Ultimate Drafter v28.1 (Anti-Crash Edition) on Render...");

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

    // ==========================================
    // INJECTING LOGIC (SURVIVES PAGE CHANGES)
    // ==========================================
    await page.evaluateOnNewDocument(() => {
        window.addEventListener('load', () => {
            setTimeout(() => {
                let isRunning = true;
                let spinCount = 0;
                let reRollUsed = false;
                let lastPlayerDrafted = null;
                let isWaitingForRestart = false;
                let isTransitioning = false; 

                function uiPause(ms) {
                    isTransitioning = true;
                    setTimeout(() => isTransitioning = false, ms);
                }

                // 1. RANKED PLAYER DATABASE
                const rankedDatabase = {
                    "afghanistan_2020s": ["Rashid Khan", "Mujeeb Ur Rahman", "Rahmanullah Gurbaz"],
                    "australia_1990s": ["Shane Warne", "Glenn McGrath", "Michael Slater", "Ricky Ponting", "Mark Waugh"],
                    "australia_2000s": ["Shane Warne", "Glenn McGrath", "Adam Gilchrist", "Brett Lee", "Andrew Symonds"],
                    "australia_2010s": ["Glenn Maxwell", "Mitchell Starc", "David Warner", "Mitchell Johnson", "Shane Watson"],
                    "australia_2020s": ["Glenn Maxwell", "Travis Head", "Mitchell Starc", "David Warner", "Pat Cummins"],
                    "bangladesh_2010s": ["Mustafizur Rahman", "Soumya Sarkar", "Shakib Al Hasan", "Sabbir Rahman", "Mashrafe Mortaza"],
                    "england_2000s": ["Andrew Flintoff", "Kevin Pietersen", "Marcus Trescothick", "Owais Shah", "Andrew Strauss"],
                    "england_2010s": ["Jos Buttler", "Jason Roy", "Jonny Bairstow", "Jofra Archer", "Eoin Morgan"],
                    "england_2020s": ["Jos Buttler", "Jonny Bairstow", "Phil Salt", "Liam Livingstone", "Jofra Archer"],
                    "india_2000s": ["MS Dhoni", "Sachin Tendulkar", "Virender Sehwag", "Yuvraj Singh", "Zaheer Khan"],
                    "india_2010s": ["Virat Kohli", "Jasprit Bumrah", "Rohit Sharma", "Hardik Pandya", "Suresh Raina"],
                    "india_2020s": ["Rohit Sharma", "Virat Kohli", "Jasprit Bumrah", "Hardik Pandya", "Suryakumar Yadav"],
                    "ireland_2010s": ["Kevin O'Brien", "Boyd Rankin", "Tim Murtagh", "George Dockrell"],
                    "kenya_2000s": ["Martin Suji", "Peter Ongondo", "Collins Obuya"],
                    "netherland_2020s": ["Logan van Beek", "Teja Nidamanuru", "Scott Edwards", "Bas de Leede"],
                    "netherlands_2020s": ["Logan van Beek", "Teja Nidamanuru", "Scott Edwards", "Bas de Leede"],
                    "new zealand_1990s": ["Chris Cairns", "Martin Crowe", "Stephen Fleming"],
                    "new zealand_2000s": ["Shane Bond", "Brendon McCullum", "Daniel Vettori", "Chris Cairns", "Craig McMillan"],
                    "new zealand_2010s": ["Corey Anderson", "Trent Boult", "Martin Guptill", "Luke Ronchi"],
                    "new zealand_2020s": ["Trent Boult", "Finn Allen", "Glenn Phillips", "Matt Henry", "Daryl Mitchell"],
                    "pakistan_1990s": ["Wasim Akram", "Waqar Younis", "Saqlain Mushtaq", "Saeed Anwar", "Ijaz Ahmed"],
                    "pakistan_2000s": ["Shahid Afridi", "Shoaib Akhtar", "Abdul Razzaq", "Kamran Akmal", "Umar Gul"],
                    "pakistan_2010s": ["Shahid Afridi", "Saeed Ajmal", "Mohammad Amir", "Babar Azam", "Umar Akmal"],
                    "pakistan_2020s": ["Shaheen Afridi", "Iftikhar Ahmed", "Haris Rauf"],
                    "south africa_1990s": ["Lance Klusener", "Allan Donald", "Shaun Pollock", "Jonty Rhodes", "Mark Boucher"],
                    "south africa_2000s": ["Justin Kemp", "AB de Villiers", "Makhaya Ntini", "Mark Boucher"],
                    "south africa_2010s": ["AB de Villiers", "Dale Steyn", "David Miller", "Imran Tahir", "Quinton de Kock"],
                    "south africa_2020s": ["Heinrich Klaasen", "David Miller", "Quinton de Kock", "Kagiso Rabada", "Anrich Nortje"],
                    "sri lanka_2000s": ["Muttiah Muralitharan", "Sanath Jayasuriya", "Lasith Malinga", "Chaminda Vaas"],
                    "sri lanka_2020s": ["Wanindu Hasaranga", "Pathum Nissanka"],
                    "west indies_1980s": ["Viv Richards", "Malcolm Marshall", "Joel Garner", "Michael Holding", "Andy Roberts"],
                    "west indies_1990s": ["Curtly Ambrose", "Brian Lara", "Courtney Walsh", "Carl Hooper", "Ian Bishop"],
                    "west indies_2010s": ["Chris Gayle", "Andre Russell", "Kieron Pollard", "Sunil Narine", "Johnson Charles"],
                    "west indies_2020s": ["Nicholas Pooran", "Evin Lewis", "Shimron Hetmyer", "Rovman Powell", "Jason Holder"]
                };

                // 2. OPTIMAL BATTING POSITIONS
                const optimalPositions = {
                    "Rohit Sharma": [1, 2], "Sachin Tendulkar": [1, 2, 4, 3], "Travis Head": [1, 2],
                    "Adam Gilchrist": [1, 2, 3], "Chris Gayle": [1, 2], "Babar Azam": [1, 3],
                    "Sanath Jayasuriya": [1, 2], "David Warner": [2, 1], "Hashim Amla": [1],
                    "Saeed Anwar": [1], "Martin Guptill": [1], "Pathum Nissanka": [1],
                    "Virat Kohli": [3, 2], "Jonny Bairstow": [2], "Brian Lara": [4, 2, 3],
                    "Kumar Sangakkara": [3, 2], "Kevin Pietersen": [4, 3], "Viv Richards": [4, 3],
                    "AB de Villiers": [5, 4, 3], "Andy Flower": [4], "Aravinda de Silva": [5],
                    "Heinrich Klaasen": [6, 5, 4], "Jos Buttler": [6, 7, 5], "Nicholas Pooran": [6, 5],
                    "Neil Fairbrother": [7], "MS Dhoni": [7, 6, 5], "Glenn Maxwell": [7, 6],
                    "Michael Bevan": [6, 7], "Shahid Afridi": [7, 6], "Lance Klusener": [7, 6],
                    "David Miller": [7], "Chris Cairns": [7], "Glenn Phillips": [7],
                    "Imran Khan": [7], "Shaun Pollock": [7], "Anil Kumble": [7],
                    "Chaminda Vaas": [7], "Wanindu Hasaranga": [7], "Wasim Akram": [8],
                    "Shane Warne": [8, 10, 9], "Rashid Khan": [9, 7], "Malcolm Marshall": [8, 10, 9],
                    "Mitchell Starc": [8, 9, 10, 11], "Shane Bond": [9, 8, 10, 11], "Saeed Ajmal": [8, 11],
                    "Dale Steyn": [9, 10, 8], "Shoaib Akhtar": [11, 9, 10, 8], "Curtly Ambrose": [11, 9, 8],
                    "Shaheen Afridi": [9, 11], "Muttiah Muralitharan": [11, 10, 8], "Lasith Malinga": [11, 8],
                    "Trent Boult": [10, 11], "Waqar Younis": [11, 10], "Allan Donald": [10, 11], "Jasprit Bumrah": [11, 8]
                };

                const ui = document.createElement('div');
                ui.id = 'bot-ui-container';
                ui.innerHTML = `
                    <div style="font-weight: bold; font-size: 13px; color: #ffeb3b; margin-bottom: 5px;">⚡ Infinite Bot v28.1</div>
                    <div id="bot-action" style="font-size: 11px; margin-bottom: 8px; color: white;">Initializing...</div>
                `;
                ui.style.cssText = `position:fixed; bottom:20px; right:20px; z-index:999999; background:rgba(0,0,0,0.9); padding:10px; border-radius:5px; width:160px; font-family:sans-serif;`;
                document.body.appendChild(ui);

                function log(actionText) {
                    const actionEl = document.getElementById('bot-action');
                    if (actionEl) actionEl.textContent = actionText;
                    console.log(`[BOT] ${actionText}`); 
                }

                function isElementOnTop(element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) return false;
                    const x = rect.left + (rect.width / 2);
                    const y = rect.top + (rect.height / 2);
                    const topElement = document.elementFromPoint(x, y);
                    return topElement && (topElement === element || element.contains(topElement) || topElement.contains(element));
                }

                function triggerPixelClick(element) {
                    const target = element.closest('button, [role="button"]') || element;
                    const rect = target.getBoundingClientRect();
                    const x = rect.left + (rect.width / 2);
                    const y = rect.top + (rect.height / 2);
                    const props = { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window };
                    ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(evt => {
                        target.dispatchEvent(evt.includes('pointer') ? new PointerEvent(evt, props) : new MouseEvent(evt, props));
                    });
                    if (typeof target.click === 'function') target.click();
                    return true;
                }

                function isRowDisabled(element) {
                    let node = element;
                    let depth = 0;
                    while (node && node.tagName !== 'BODY' && depth < 12) {
                        const text = (node.textContent || "").toLowerCase().trim();
                        if (text.length > 300) break;
                        if (text.includes("(picked)")) return true;
                        const style = window.getComputedStyle(node);
                        if (parseFloat(style.opacity) < 1 || style.pointerEvents === 'none') return true;
                        node = node.parentElement;
                        depth++;
                    }
                    return false;
                }

                function createSafeTreeWalker(root) {
                    return document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                        acceptNode: function(node) {
                            if (node.parentElement && node.parentElement.closest('#bot-ui-container')) return NodeFilter.FILTER_REJECT;
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    }, false);
                }

                // REMOVED "requireButton" flag. Now works with all HTML tags flawlessly.
                function findAndClick(targetText, exact = true, requireRightSideOnly = false) {
                    targetText = targetText.toLowerCase().trim();
                    const walker = createSafeTreeWalker(document.body);
                    let node;
                    const screenMiddle = window.innerWidth / 2;

                    while ((node = walker.nextNode())) {
                        const text = node.nodeValue.trim().toLowerCase();
                        if (!text) continue;

                        if ((exact && text === targetText) || (!exact && text.includes(targetText))) {
                            if (targetText === "spin" && text.includes("spinning")) continue;

                            const parent = node.parentElement;

                            if (window.getComputedStyle(parent).display !== 'none' && isElementOnTop(parent)) {
                                const rect = parent.getBoundingClientRect();
                                const elementCenterX = rect.left + (rect.width / 2);
                                if (requireRightSideOnly) {
                                    if (elementCenterX < screenMiddle) continue;
                                    if (isRowDisabled(parent)) continue;
                                }
                                triggerPixelClick(parent);
                                return true;
                            }
                        }
                    }
                    return false;
                }

                function clickPositionNumber(targetNumber) {
                    const walker = createSafeTreeWalker(document.body);
                    let node;
                    let modal = null;
                    while ((node = walker.nextNode())) {
                        if (node.nodeValue.toLowerCase().includes("choose a batting position") || node.nodeValue.toLowerCase().includes("choose batting position")) {
                            modal = node.parentElement;
                            for (let i = 0; i < 5; i++) { if (modal.parentElement && modal.tagName !== 'BODY') modal = modal.parentElement; }
                            break;
                        }
                    }
                    if (!modal) return false;
                    const innerWalker = createSafeTreeWalker(modal);
                    while ((node = innerWalker.nextNode())) {
                        if (node.nodeValue.trim() === targetNumber.toString()) {
                            const parent = node.parentElement;
                            if (isElementOnTop(parent)) {
                                triggerPixelClick(parent);
                                return true;
                            }
                        }
                    }
                    return false;
                }

                function checkWinCondition() {
                    const pageText = document.body.innerText.toLowerCase();
                    if (pageText.includes("history rewritten") || pageText.includes("claim your spot")) return true;
                    const match = document.body.innerText.match(/\b([5-9]\d{2}|\d{4,})\s*\/\s*\d+\b/);
                    if (match) {
                        const score = parseInt(match[1]);
                        if (score >= 501) return true;
                    }
                    return false;
                }

                function hasPlayerRating90OrAbove() {
                    const walker = createSafeTreeWalker(document.body);
                    let node;
                    const screenMiddle = window.innerWidth / 2;
                    while ((node = walker.nextNode())) {
                        const text = node.nodeValue.trim();
                        const num = parseInt(text);
                        if (!isNaN(num) && num >= 90 && num <= 99 && text === num.toString()) {
                            const parent = node.parentElement;
                            if (window.getComputedStyle(parent).display !== 'none' && isElementOnTop(parent)) {
                                const rect = parent.getBoundingClientRect();
                                if (rect.left + (rect.width / 2) >= screenMiddle && !isRowDisabled(parent)) return true;
                            }
                        }
                    }
                    return false;
                }

                function draftHighestAvailableRating() {
                    const walker = createSafeTreeWalker(document.body);
                    let node;
                    let bestNode = null;
                    let bestRating = -1;
                    const screenMiddle = window.innerWidth / 2;
                    while ((node = walker.nextNode())) {
                        const text = node.nodeValue.trim();
                        const num = parseInt(text);
                        if (!isNaN(num) && num >= 0 && num <= 99 && text === num.toString()) {
                            const parent = node.parentElement;
                            if (window.getComputedStyle(parent).display !== 'none' && isElementOnTop(parent)) {
                                const rect = parent.getBoundingClientRect();
                                if (rect.left + (rect.width / 2) >= screenMiddle && !isRowDisabled(parent)) {
                                    if (num > bestRating) {
                                        bestRating = num;
                                        bestNode = parent;
                                    }
                                }
                            }
                        }
                    }
                    if (bestNode) {
                        triggerPixelClick(bestNode);
                        log(`Drafted Rating: ${bestRating}`);
                        lastPlayerDrafted = null;
                        return true;
                    }
                    return false;
                }

                function detectCurrentTeamEraKey() {
                    const pageText = document.body.innerText.toLowerCase();
                    for (let key of Object.keys(rankedDatabase)) {
                        const parts = key.split('_');
                        if (pageText.includes(parts[0]) && pageText.includes(parts[1])) return key;
                    }
                    return null;
                }

                // CRITICAL FIX: isWaitingForRestart is NO LONGER wiped here. It survives!
                function resetDraftState() {
                    spinCount = 0;
                    reRollUsed = false;
                    lastPlayerDrafted = null;
                }

                log("Bot injected and running at High Speed!");

                // ===============================================
                // MAIN LOOP - HIGH SPEED (400ms) with UI SYNC
                // ===============================================
                setInterval(() => {
                    if (!isRunning || isWaitingForRestart || isTransitioning) return;

                    const pageText = document.body.innerText.toLowerCase();
                    const rawText = document.body.innerText;

                    // STEP 1: INITIAL ENTRY
                    if (pageText.includes("choose difficulty") || pageText.includes("unofficial fan draft game")) {
                        log("Starting New Draft...");
                        resetDraftState();
                        isWaitingForRestart = false; // Safely set here on fresh launch
                        findAndClick("draft", true); 
                        uiPause(800);
                        return;
                    }

                    // STEP 2: SKIP TO END & SIMULATE PHASE
                    if (findAndClick("skip to end", false)) {
                        log("Skipping to end...");
                        uiPause(800);
                        return;
                    }
                    if (findAndClick("simulate", true) || findAndClick("simulate", false)) {
                        log("Match simulating...");
                        uiPause(800);
                        return;
                    }

                    // STEP 3: RESTART / END OF MATCH LOGIC
                    if (pageText.includes("game over") || pageText.includes("final score") || pageText.includes("draft again") || pageText.includes("play again") || pageText.includes("claim your spot")) {
                        
                        if (!isWaitingForRestart) {
                            const scoreMatch = rawText.match(/\b([5-9]\d{2}|\d{4,})\s*\/\s*\d+\b/);
                            const oversMatch = rawText.match(/\b\d{1,2}\.\d OVERS\b/i);
                            let matchReport = "";
                            if (scoreMatch) matchReport += `SCORE: ${scoreMatch[0]}`;
                            if (oversMatch) matchReport += ` in ${oversMatch[0]}`;
                            matchReport += `\n\nTEAM SNAPSHOT:\n` + rawText.substring(0, 400).replace(/\n\n+/g, '\n');
                            window.saveScorecardToDisk(matchReport);
                        }

                        const wonMatch = checkWinCondition();

                        if (wonMatch) {
                            log("🏆 WIN/501+ SCORE! Submitting to Leaderboard...");
                            isWaitingForRestart = true;
                            
                            findAndClick("claim your spot", false);
                            
                            setTimeout(() => {
                                const randomNum = Math.floor(1000 + Math.random() * 9000);
                                const username = "KUNJAN" + randomNum;
                                
                                const inputs = document.querySelectorAll('input');
                                inputs.forEach(input => {
                                    input.value = username;
                                    input.dispatchEvent(new Event('input', { bubbles: true }));
                                    input.dispatchEvent(new Event('change', { bubbles: true }));
                                });

                                setTimeout(() => {
                                    findAndClick("submit", false) || findAndClick("post", false) || findAndClick("enter", false);
                                    
                                    setTimeout(() => {
                                        log("60s completed. Starting next...");
                                        resetDraftState();
                                        if (!findAndClick("draft again", false)) {
                                            if (!findAndClick("play again", false)) {
                                                findAndClick("draft", true);
                                            }
                                        }
                                        isWaitingForRestart = false;
                                    }, 60000);

                                }, 1000);
                            }, 1500);

                        } else {
                            log("Drafting again...");
                            isWaitingForRestart = true; 
                            resetDraftState();
                            
                            if (!findAndClick("draft again", false)) {
                                if (!findAndClick("play again", false)) {
                                    findAndClick("draft", true); 
                                }
                            }
                            
                            // Safe timeout. Gives time to click, then resumes scanning.
                            setTimeout(() => {
                                isWaitingForRestart = false;
                            }, 1500); 
                        }
                        return;
                    }

                    // STEP 4: BATTING POSITION POPUP
                    if (pageText.includes("batting position")) { 
                        let clickedPosition = false;
                        if (lastPlayerDrafted && optimalPositions[lastPlayerDrafted]) {
                            for (let pos of optimalPositions[lastPlayerDrafted]) {
                                if (clickPositionNumber(pos)) {
                                    log(`Pos ${pos} for ${lastPlayerDrafted}`);
                                    clickedPosition = true;
                                    uiPause(600);
                                    break;
                                }
                            }
                        }
                        if (!clickedPosition) {
                            for (let i = 1; i <= 11; i++) {
                                if (clickPositionNumber(i)) {
                                    log(`Selected Pos ${i} as fallback`);
                                    uiPause(600);
                                    break;
                                }
                            }
                        }
                        return; 
                    }

                    // STEP 5: SPIN PHASE
                    if (findAndClick("spin", true)) {
                        spinCount++;
                        log(`Spin #${spinCount} Initiated`);
                        uiPause(800);
                        return;
                    }

                    // STEP 6: DRAFTING / RE-ROLL LOGIC
                    if (pageText.includes("pow") || pageText.includes("bat") || pageText.includes("bwl")) {
                        const has90Plus = hasPlayerRating90OrAbove();

                        if (spinCount >= 2 && !reRollUsed) {
                            if (!has90Plus) {
                                log("No 90+ Player Found. Executing RE-ROLL...");
                                reRollUsed = true;
                                if (findAndClick("re-roll", false) || findAndClick("reroll", false)) {
                                    uiPause(800);
                                    return;
                                }
                            }
                        }

                        const teamKey = detectCurrentTeamEraKey();
                        if (teamKey && rankedDatabase[teamKey]) {
                            const rankedList = rankedDatabase[teamKey];
                            for (let i = 0; i < rankedList.length; i++) {
                                const playerName = rankedList[i];
                                if (findAndClick(playerName, true, true)) {
                                    log(`Drafted VIP: ${playerName}`);
                                    lastPlayerDrafted = playerName;
                                    uiPause(800); 
                                    return;
                                }
                            }
                        }

                        log("Drafting by rating...");
                        if (draftHighestAvailableRating()) {
                            uiPause(800); 
                            return;
                        }
                    }

                }, 400); 

            }, 1000); 
        });
    });

    console.log("Navigating to 500-0.com...");
    try {
        await page.goto('https://500-0.com', { waitUntil: 'domcontentloaded', timeout: 0 });
        console.log("Page base loaded. Bot script injected and running.");
    } catch (e) {
        console.log("Warning during navigation:", e.message);
    }
}

runBot();
