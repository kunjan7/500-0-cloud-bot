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
    res.end('500-0 Cloud Bot v34.0 is running 24/7!');
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
    console.log("⚡ Starting Ultimate Drafter v34.0 (Spatial Isolation Engine) on Render...");

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
    // INJECTING SPATIALLY ISOLATED TM LOGIC
    // ==========================================
    await page.evaluateOnNewDocument(() => {
        if (window.top !== window) return; // Prevent iframe duplicates

        window.addEventListener('load', () => {
            setTimeout(() => {
                let isRunning = true;
                let spinCount = 0;
                let reRollUsed = false;
                let lastPlayerDrafted = null;
                let isWaitingForRestart = false;
                let isTransitioning = false; 

                let idleLoops = 0; 
                let blacklistedPlayers = new Set();
                let failedPlayerClicks = {};

                function uiPause(ms) {
                    isTransitioning = true;
                    setTimeout(() => isTransitioning = false, ms);
                }

                function log(actionText) {
                    const actionEl = document.getElementById('bot-action');
                    if (actionEl) actionEl.textContent = actionText;
                    console.log(`[BOT] ${actionText}`); 
                }

                // 1. FIRST SPIN TARGET PLAYERS
                const firstSpinTargets = [
                    "AB de Villiers", "Viv Richards", "Heinrich Klaasen",
                    "Muttiah Muralitharan", "Virat Kohli", "Shane Warne",
                    "Jos Buttler", "Sachin Tendulkar", "Shahid Afridi",
                    "Rohit Sharma", "Wasim Akram", "Malcolm Marshall",
                    "Mitchell Starc", "Travis Head", "Brian Lara", "Glenn Maxwell"
                ];

                // 2. RANKED PLAYER DATABASE
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

                // 3. OPTIMAL BATTING POSITIONS
                const optimalPositions = {
                    "Rohit Sharma": [1, 2], "Sachin Tendulkar": [1, 2, 4, 3], "Travis Head": [1, 2],
                    "Adam Gilchrist": [1, 2, 3], "Chris Gayle": [1, 2], "Babar Azam": [1, 3],
                    "Sanath Jayasuriya": [1, 2], "David Warner": [2, 1], "Hashim Amla": [1],
                    "Saeed Anwar": [1], "Martin Guptill": [1], "Pathum Nissanka": [1],
                    "Virat Kohli": [3, 2], "Jonny Bairstow": [2], "Brian Lara": [4, 2, 3], 
                    "Viv Richards": [4, 3], "AB de Villiers": [5, 4, 3], "Heinrich Klaasen": [6, 5, 4], 
                    "Jos Buttler": [6, 7, 5], "Nicholas Pooran": [6, 5], "MS Dhoni": [7, 6, 5], 
                    "Glenn Maxwell": [7, 6], "Michael Bevan": [6, 7], "Shahid Afridi": [7, 6], 
                    "Lance Klusener": [7, 6], "David Miller": [7], "Chris Cairns": [7], 
                    "Glenn Phillips": [7], "Imran Khan": [7], "Shaun Pollock": [7], 
                    "Wanindu Hasaranga": [7], "Wasim Akram": [8], "Shane Warne": [8, 10, 9], 
                    "Rashid Khan": [9, 7], "Malcolm Marshall": [8, 10, 9], "Mitchell Starc": [8, 9, 10, 11],
                    "Shane Bond": [9, 8, 10, 11], "Saeed Ajmal": [8, 11], "Dale Steyn": [9, 10, 8],
                    "Shoaib Akhtar": [11, 9, 10, 8], "Curtly Ambrose": [11, 9, 8], "Shaheen Afridi": [9, 11],
                    "Muttiah Muralitharan": [11, 10, 8], "Lasith Malinga": [11, 8], "Trent Boult": [10, 11],
                    "Waqar Younis": [11, 10], "Allan Donald": [10, 11], "Jasprit Bumrah": [11, 8]
                };

                const ui = document.createElement('div');
                ui.id = 'bot-ui-container';
                ui.innerHTML = `
                    <div style="font-weight: bold; font-size: 13px; color: #ffeb3b; margin-bottom: 5px;">⚡ Infinite Bot v34.0</div>
                    <div id="bot-action" style="font-size: 11px; margin-bottom: 8px; color: white;">Initializing...</div>
                `;
                ui.style.cssText = `position:fixed; bottom:20px; right:20px; z-index:999999; background:rgba(0,0,0,0.9); padding:10px; border-radius:5px; width:170px; font-family:sans-serif;`;
                document.body.appendChild(ui);

                function triggerPixelClick(element) {
                    idleLoops = 0; 
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
                        if (parseFloat(style.opacity) < 0.85 || style.pointerEvents === 'none') return true;
                        if (style.filter && (style.filter.includes('grayscale') || style.filter.includes('contrast'))) return true;
                        if (node.classList && (node.classList.contains('disabled') || node.classList.contains('picked') || node.classList.contains('greyed'))) return true;

                        node = node.parentElement;
                        depth++;
                    }
                    return false;
                }

                function aggressiveClick(textTarget) {
                    const elements = Array.from(document.querySelectorAll('button, div, span, a'));
                    for (let el of elements) {
                        const text = (el.textContent || '').toLowerCase().trim();
                        if (text.includes(textTarget.toLowerCase()) && el.children.length === 0) {
                            const rect = el.getBoundingClientRect();
                            if (rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none') {
                                triggerPixelClick(el);
                                return true;
                            }
                        }
                    }
                    return false;
                }

                // STRICT RIGHT-SIDE CLICKER FOR PLAYERS
                function smartClick(text, exactMatch = false, rightSideOnly = true) {
                    text = text.toLowerCase().trim();
                    const elements = Array.from(document.querySelectorAll('button, div, span, p, a, li'));
                    const rightSideBoundary = window.innerWidth * 0.45; // Must be in right 55% of screen
                    
                    for (let i = elements.length - 1; i >= 0; i--) {
                        const el = elements[i];
                        if (el.closest('#bot-ui-container')) continue;
                        
                        const elText = (el.textContent || '').toLowerCase().trim();
                        if (!elText) continue;

                        const isMatch = exactMatch ? elText === text : elText.includes(text);
                        if (isMatch) {
                            if (text === "spin" && elText.includes("spinning")) continue;

                            const style = window.getComputedStyle(el);
                            const rect = el.getBoundingClientRect();
                            
                            if (rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden') {
                                // SPATIAL ISOLATION: Require element to be on right side
                                if (rightSideOnly && (rect.left + (rect.width / 2) < rightSideBoundary)) continue;
                                if (isRowDisabled(el)) continue; 

                                triggerPixelClick(el);
                                return true;
                            }
                        }
                    }
                    return false;
                }

                // ISOLATED POPUP MODAL CLICKER FOR BATTING POSITIONS
                function clickPositionNumber(targetNumber) {
                    // Find active position popup modal container
                    const allDivs = Array.from(document.querySelectorAll('div, [role="dialog"]'));
                    let modalContainer = null;

                    for (let div of allDivs) {
                        const text = (div.textContent || '').toLowerCase();
                        if ((text.includes("choose a batting position") || text.includes("choose batting position")) && div.children.length > 0) {
                            const style = window.getComputedStyle(div);
                            if (style.display !== 'none' && style.visibility !== 'hidden') {
                                modalContainer = div;
                                break;
                            }
                        }
                    }

                    if (!modalContainer) return false;

                    // Strictly click number inside modal container
                    const modalElements = Array.from(modalContainer.querySelectorAll('button, div, span, a, p'));
                    for (let i = modalElements.length - 1; i >= 0; i--) {
                        const el = modalElements[i];
                        const text = (el.textContent || '').trim();
                        if (text === targetNumber.toString()) {
                            const rect = el.getBoundingClientRect();
                            const style = window.getComputedStyle(el);
                            if (rect.width > 0 && rect.height > 0 && style.display !== 'none') {
                                triggerPixelClick(el);
                                return true;
                            }
                        }
                    }
                    return false;
                }

                function isAnyPlayerAvailable(playerList) {
                    const pageText = document.body.innerText.toLowerCase();
                    for (let player of playerList) {
                        if (blacklistedPlayers.has(player.toLowerCase())) continue;
                        if (pageText.includes(player.toLowerCase())) {
                            if (smartClick(player, false, true)) return true;
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

                function draftHighestAvailableRating() {
                    const elements = Array.from(document.querySelectorAll('div, span'));
                    let bestNode = null;
                    let bestRating = -1;
                    const rightSideBoundary = window.innerWidth * 0.45;

                    for (let el of elements) {
                        const text = (el.textContent || '').trim();
                        const num = parseInt(text);
                        if (!isNaN(num) && num >= 0 && num <= 99 && text === num.toString()) {
                            const rect = el.getBoundingClientRect();
                            const style = window.getComputedStyle(el);
                            if (rect.width > 0 && rect.height > 0 && style.display !== 'none') {
                                // Strictly right-side player cards only
                                if (rect.left + (rect.width / 2) >= rightSideBoundary) {
                                    if (!isRowDisabled(el) && num > bestRating) {
                                        if (!blacklistedPlayers.has("rating_" + num)) {
                                            bestRating = num;
                                            bestNode = el;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (bestNode) {
                        const key = "rating_" + bestRating;
                        failedPlayerClicks[key] = (failedPlayerClicks[key] || 0) + 1;
                        if (failedPlayerClicks[key] >= 3) {
                            blacklistedPlayers.add(key);
                            log(`Blacklisted rating ${bestRating}`);
                        }

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

                function resetDraftState() {
                    spinCount = 0;
                    reRollUsed = false;
                    lastPlayerDrafted = null;
                    isWaitingForRestart = false;
                    blacklistedPlayers.clear();
                    failedPlayerClicks = {};
                }

                log("Bot injected. Spatial Isolation v34.0 active!");

                // ==========================================
                // MAIN AUTOMATION LOOP (400ms)
                // ==========================================
                setInterval(() => {
                    if (!isRunning || isWaitingForRestart || isTransitioning) return;

                    idleLoops++;
                    if (idleLoops > 62) { // 25s idle safety reload
                        log("Emergency: Bot idle > 25s. Force reloading...");
                        isWaitingForRestart = true;
                        location.reload();
                        return;
                    }

                    const pageText = document.body.innerText.toLowerCase();
                    const rawText = document.body.innerText;

                    // STEP 1: INITIAL ENTRY
                    if (pageText.includes("choose difficulty") || pageText.includes("unofficial fan draft game")) {
                        log("Starting New Draft...");
                        resetDraftState();
                        smartClick("draft", true, false);
                        uiPause(800);
                        return;
                    }

                    // STEP 2: SKIP TO END & SIMULATE PHASE
                    if (smartClick("skip to end", false, false)) {
                        log("Skipping to end...");
                        uiPause(800);
                        return;
                    }
                    if (smartClick("simulate", false, false)) {
                        log("Match simulating...");
                        uiPause(800);
                        return;
                    }

                    // STEP 3: RESTART / END OF MATCH CHECK
                    if (pageText.includes("game over") || pageText.includes("final score") || pageText.includes("claim your spot") || pageText.includes("play again") || pageText.includes("draft again")) {
                        
                        const scoreMatch = rawText.match(/\b([5-9]\d{2}|\d{4,})\s*\/\s*\d+\b/);
                        const oversMatch = rawText.match(/\b\d{1,2}\.\d OVERS\b/i);
                        let matchReport = "";
                        if (scoreMatch) matchReport += `SCORE: ${scoreMatch[0]}`;
                        if (oversMatch) matchReport += ` in ${oversMatch[0]}`;
                        matchReport += `\n\nTEAM SNAPSHOT:\n` + rawText.substring(0, 400).replace(/\n\n+/g, '\n');
                        
                        window.saveScorecardToDisk(matchReport);

                        const wonMatch = checkWinCondition();

                        if (wonMatch) {
                            log("🏆 WIN/501+ SCORE! Claiming Spot...");
                            isWaitingForRestart = true;
                            
                            smartClick("claim your spot", false, false);
                            
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
                                    smartClick("submit", false, false) || smartClick("post", false, false) || smartClick("enter", false, false);
                                    log("Score submitted. Reloading in 60s...");
                                    setTimeout(() => { location.reload(); }, 60000);
                                }, 1000);
                            }, 1500);
                        } else {
                            log("Loss detected. Reloading to restart...");
                            isWaitingForRestart = true; 
                            setTimeout(() => { location.reload(); }, 1500); 
                        }
                        return;
                    }

                    // STEP 4: BATTING POSITION POPUP (ISOLATED MODAL CLICK)
                    if (pageText.includes("choose a batting position") || pageText.includes("choose batting position")) {
                        let clickedPosition = false;

                        if (lastPlayerDrafted && optimalPositions[lastPlayerDrafted]) {
                            for (let pos of optimalPositions[lastPlayerDrafted]) {
                                if (clickPositionNumber(pos)) {
                                    log(`Pos ${pos} selected for ${lastPlayerDrafted}`);
                                    clickedPosition = true;
                                    uiPause(1000); 
                                    break;
                                }
                            }
                        }

                        if (!clickedPosition) {
                            for (let i = 1; i <= 11; i++) {
                                if (clickPositionNumber(i)) {
                                    log(`Pos ${i} selected as fallback`);
                                    uiPause(1000);
                                    break;
                                }
                            }
                        }
                        return;
                    }

                    // STEP 5: SPIN PHASE
                    if (smartClick("spin", true, false)) {
                        spinCount++;
                        reRollUsed = false;
                        blacklistedPlayers.clear();
                        failedPlayerClicks = {};
                        log(`Spin #${spinCount} Initiated`);
                        uiPause(3500); // Wait for wheel spin animation
                        return;
                    }

                    // STEP 6: DRAFTING / RE-ROLL LOGIC
                    if (pageText.includes("pow") || pageText.includes("bat") || pageText.includes("bwl")) {

                        // --- FIRST SPIN TARGET ---
                        if (spinCount === 1) {
                            if (!isAnyPlayerAvailable(firstSpinTargets)) {
                                log("Spin 1: Target player not found! Reloading...");
                                isWaitingForRestart = true;
                                setTimeout(() => { location.reload(); }, 500);
                                return;
                            }
                        }

                        // --- SPINS 2 TO 11 RE-ROLL RULE ---
                        if (spinCount >= 2 && spinCount <= 11 && !reRollUsed) {
                            const optimalPlayersList = Object.keys(optimalPositions);
                            if (!isAnyPlayerAvailable(optimalPlayersList)) {
                                log("No Optimal Player. Attempting RE-ROLL...");
                                if (aggressiveClick("⟳") || smartClick("re-roll", false, false) || smartClick("reroll", false, false)) {
                                    reRollUsed = true; 
                                    blacklistedPlayers.clear();
                                    failedPlayerClicks = {};
                                    uiPause(1200);
                                    return;
                                }
                            }
                        }

                        // --- PLAYER SELECTION ---
                        const teamKey = detectCurrentTeamEraKey();
                        if (teamKey && rankedDatabase[teamKey]) {
                            const rankedList = rankedDatabase[teamKey];
                            for (let i = 0; i < rankedList.length; i++) {
                                const playerName = rankedList[i];
                                if (blacklistedPlayers.has(playerName.toLowerCase())) continue;

                                if (optimalPositions[playerName] && smartClick(playerName, false, true)) {
                                    failedPlayerClicks[playerName] = (failedPlayerClicks[playerName] || 0) + 1;
                                    if (failedPlayerClicks[playerName] >= 3) {
                                        blacklistedPlayers.add(playerName.toLowerCase());
                                        log(`Greyed-out detected: Blacklisted ${playerName}`);
                                    }

                                    log(`Drafted Rank ${i+1}: ${playerName}`);
                                    lastPlayerDrafted = playerName;
                                    uiPause(1000);
                                    return;
                                }
                            }
                        }

                        // --- OPTIMAL FALLBACK ---
                        const optimalPlayersList = Object.keys(optimalPositions);
                        for (let player of optimalPlayersList) {
                            if (blacklistedPlayers.has(player.toLowerCase())) continue;

                            if (smartClick(player, false, true)) {
                                failedPlayerClicks[player] = (failedPlayerClicks[player] || 0) + 1;
                                if (failedPlayerClicks[player] >= 3) {
                                    blacklistedPlayers.add(player.toLowerCase());
                                    log(`Greyed-out detected: Blacklisted ${player}`);
                                }

                                log(`Drafted Optimal: ${player}`);
                                lastPlayerDrafted = player;
                                uiPause(1000);
                                return;
                            }
                        }

                        // --- ULTIMATE FALLBACK ---
                        log("Drafting by highest rating fallback...");
                        if (draftHighestAvailableRating()) {
                            uiPause(1000);
                            return;
                        }
                    }

                }, 400); 

            }, 2000); 
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
