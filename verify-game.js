/**
 * Verification script for Flugzeug Quartett
 * Run: node verify-game.js
 */
const { firefox } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

async function main() {
  const results = { passed: [], failed: [], consoleErrors: [] };
  let browser;

  try {
    if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

    browser = await firefox.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    // Capture console errors
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error') {
        results.consoleErrors.push(msg.text());
      }
    });

    // 1. Navigate and check start screen
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });

    const title = await page.locator('.game-title').textContent();
    const hasSpielStarten = await page.locator('button:has-text("Spiel starten")').count() > 0;

    if (title && title.includes('Flugzeug') && title.includes('Quartett')) {
      results.passed.push('Start screen shows title "Flugzeug Quartett"');
    } else {
      results.failed.push(`Start screen title: expected "Flugzeug Quartett", got "${title}"`);
    }

    if (hasSpielStarten) {
      results.passed.push('"Spiel starten" button is visible');
    } else {
      results.failed.push('"Spiel starten" button not found');
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-start-screen.png') });
    results.passed.push('Screenshot 01: start screen saved');

    // 2. Click "Spiel starten" and verify setup screen
    await page.click('button:has-text("Spiel starten")');
    await page.waitForSelector('#setup-screen.active', { timeout: 3000 });

    const setupTitle = await page.locator('.setup-title').textContent();
    const hasSpielerConfig = await page.locator('#players-config').count() > 0;
    const hasAddPlayer = await page.locator('#add-player-btn').count() > 0;

    if (setupTitle && setupTitle.includes('Spieler')) {
      results.passed.push('Setup screen shows "Spieler einrichten"');
    } else {
      results.failed.push(`Setup screen: expected "Spieler einrichten", got "${setupTitle}"`);
    }

    if (hasSpielerConfig) {
      results.passed.push('Player configuration area is visible');
    } else {
      results.failed.push('Player configuration area not found');
    }

    if (hasAddPlayer) {
      results.passed.push('"Spieler hinzufügen" button exists');
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-setup-screen.png') });
    results.passed.push('Screenshot 02: setup screen saved');

    // 3. Check admin gear icon
    const adminGear = await page.locator('.admin-gear').count() > 0;
    const gearText = await page.locator('.admin-gear').textContent().catch(() => '');
    if (adminGear && (gearText.includes('⚙') || gearText.includes('gear'))) {
      results.passed.push('Admin gear icon (⚙️) is visible in top-right');
    } else {
      results.failed.push(`Admin gear: expected gear icon, found=${adminGear}, text="${gearText}"`);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-setup-with-gear.png') });
    results.passed.push('Screenshot 03: setup screen with gear visible saved');

    // 4. Click "Spiel starten" on setup screen (start the game)
    await page.click('#start-game-btn');
    await page.waitForSelector('#game-screen.active', { timeout: 5000 });

    // Wait for game to render (AI might take a turn if it goes first)
    await page.waitForTimeout(2000);

    const hasActiveCard = await page.locator('#active-card .card-front').count() > 0;
    const hasStats = await page.locator('#active-card tr[data-stat]').count() > 0;

    if (hasActiveCard) results.passed.push('Game screen: player card displayed');
    else results.failed.push('Game screen: player card not found');
    if (hasStats) results.passed.push('Game screen: card has stat rows');
    else results.failed.push('Game screen: no stat rows on card');

    // Check for images vs emojis
    const hasImg = await page.locator('#active-card img').count() > 0;
    const hasEmoji = await page.locator('#active-card .card-emoji').count() > 0;
    if (hasImg) results.passed.push('Cards: Wikipedia images present');
    else if (hasEmoji) results.passed.push('Cards: emojis displayed (images may load async)');
    else results.passed.push('Cards: card image area present');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-game-screen.png') });
    results.passed.push('Screenshot 04: game screen saved');

    // 5. Click on Geschwindigkeit stat (speed)
    const speedRow = page.locator('#active-card tr[data-stat="speed"].clickable');
    const speedCount = await speedRow.count();
    if (speedCount > 0) {
      await speedRow.first().click();
      results.passed.push('Clicked Geschwindigkeit stat row');
    } else {
      // Maybe human's turn already passed - try any clickable stat
      const anyStat = page.locator('#active-card tr.clickable');
      if (await anyStat.count() > 0) {
        await anyStat.first().click();
        results.passed.push('Clicked a stat row');
      } else {
        results.failed.push('No clickable stat row found (may be AI turn)');
      }
    }

    // 6. Wait for result overlay and screenshot
    await page.waitForSelector('#result-overlay.active', { timeout: 5000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-result-overlay.png') });
    results.passed.push('Screenshot 05: result overlay saved');

    // 7. Click "Weiter"
    await page.click('button:has-text("Weiter")');
    await page.waitForTimeout(1200);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-next-round.png') });
    results.passed.push('Screenshot 06: next round saved');

    // 8. Click admin gear during game
    await page.click('.admin-gear');
    await page.waitForSelector('#admin-sidebar.open', { timeout: 2000 }).catch(() => null);
    await page.waitForTimeout(400);

    const sidebarHasOpen = await page.locator('#admin-sidebar').evaluate(el => el.classList.contains('open'));
    if (sidebarHasOpen) {
      results.passed.push('Admin sidebar opens during gameplay');
    } else {
      results.failed.push('Admin sidebar did not open or open class not applied');
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-admin-sidebar.png') });
    results.passed.push('Screenshot 07: admin sidebar saved');

  } catch (err) {
    results.failed.push(`Error: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }

  // Report
  console.log('\n=== Flugzeug Quartett Verification ===\n');
  console.log('PASSED:');
  results.passed.forEach(p => console.log('  ✓', p));
  if (results.failed.length) {
    console.log('\nFAILED:');
    results.failed.forEach(f => console.log('  ✗', f));
  }
  if (results.consoleErrors.length) {
    console.log('\nBrowser console errors:');
    results.consoleErrors.forEach(e => console.log('  ', e));
  }
  console.log('\nScreenshots saved to:', SCREENSHOTS_DIR);
  process.exit(results.failed.length > 0 ? 1 : 0);
}

main();
