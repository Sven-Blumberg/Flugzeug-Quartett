/**
 * Verification script for Flugzeug Quartett CHEATS system
 * Run: node verify-cheats.js
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
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') results.consoleErrors.push(msg.text());
    });

    // 1. Navigate and start game
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    await page.click('button:has-text("Spiel starten")');
    await page.waitForSelector('#setup-screen.active', { timeout: 3000 });
    await page.click('#start-game-btn');
    await page.waitForSelector('#game-screen.active', { timeout: 5000 });
    await page.waitForTimeout(2000);
    results.passed.push('Game started');

    // 2. Open admin sidebar
    await page.click('.admin-gear');
    await page.waitForSelector('#admin-sidebar.open', { timeout: 2000 });
    await page.waitForTimeout(400);
    results.passed.push('Admin sidebar opened');

    // 3. Scroll to cheats section and take screenshot
    await page.locator('.cheats-section').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'cheat-01-sidebar.png') });
    results.passed.push('Screenshot: sidebar with cheats');

    // 4. Verify cheat buttons and sections
    const cheatButtons = await page.locator('.cheat-btn').count();
    const hasCheatsHeader = await page.locator('.cheats-header:has-text("CHEATS")').count() > 0;
    const hasMegaJetBtn = await page.locator('button:has-text("Mega Jet!")').count() > 0;
    const hasSpickenBtn = await page.locator('button:has-text("Spicken")').count() > 0;
    const hasZufallsBtn = await page.locator('button:has-text("Zufalls-Event")').count() > 0;
    const hasBuilder = await page.locator('.cheat-builder .builder-title:has-text("Mega Jet Builder")').count() > 0;
    const hasGiver = await page.locator('.cheat-giver .builder-title:has-text("Karte geben")').count() > 0;

    if (cheatButtons >= 8) results.passed.push(`Cheat buttons: ${cheatButtons} found`);
    else results.failed.push(`Expected 8+ cheat buttons, got ${cheatButtons}`);
    if (hasCheatsHeader) results.passed.push('CHEATS header visible');
    else results.failed.push('CHEATS header not found');
    if (hasMegaJetBtn) results.passed.push('Mega Jet! button visible');
    if (hasSpickenBtn) results.passed.push('Spicken button visible');
    if (hasZufallsBtn) results.passed.push('Zufalls-Event button visible');
    if (hasBuilder) results.passed.push('Mega Jet Builder section visible');
    else results.failed.push('Mega Jet Builder section not found');
    if (hasGiver) results.passed.push('Karte geben section visible');
    else results.failed.push('Karte geben section not found');

    // 5. Click Mega Jet! and verify toast + card change
    await page.click('button:has-text("Mega Jet!")');
    await page.waitForTimeout(600);
    const toastVisible = await page.locator('.toast').count() > 0;
    const hasMegaJetCard = await page.locator('#active-card:has-text("MEGA JET")').count() > 0;
    if (toastVisible) results.passed.push('Toast appeared after Mega Jet!');
    else results.failed.push('No toast after Mega Jet!');
    if (hasMegaJetCard) results.passed.push('Player card changed to Mega Jet');
    else results.failed.push('Card did not change to Mega Jet');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'cheat-02-mega-jet.png') });
    results.passed.push('Screenshot: mega jet card');

    // 6. Click Spicken - verify modal
    await page.click('button:has-text("Spicken")');
    await page.waitForSelector('#peek-modal.active', { timeout: 2000 });
    await page.waitForTimeout(400);
    const peekContent = await page.locator('#peek-content').textContent();
    const hasPeekContent = peekContent && peekContent.length > 10;
    if (hasPeekContent) results.passed.push('Peek modal shows opponent cards');
    else results.failed.push('Peek modal empty or not showing cards');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'cheat-03-peek-modal.png') });
    results.passed.push('Screenshot: peek modal');

    // 7. Close peek modal and sidebar (use sidebar close button, gear is obscured)
    await page.click('#peek-modal button:has-text("Schließen")');
    await page.waitForTimeout(300);
    await page.click('.sidebar-close');
    await page.waitForTimeout(500);

    // 8. Re-open sidebar and click Zufalls-Event
    await page.click('.admin-gear');
    await page.waitForSelector('#admin-sidebar.open', { timeout: 2000 });
    await page.locator('.cheats-section').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.click('button:has-text("Zufalls-Event")');
    await page.waitForTimeout(800);
    const toastAfterRandom = await page.locator('.toast').count() > 0;
    if (toastAfterRandom) results.passed.push('Toast appeared after Zufalls-Event');
    else results.failed.push('No toast after Zufalls-Event');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'cheat-04-random-event.png') });
    results.passed.push('Screenshot: after Zufalls-Event');

    // Check colorful button styling (cb-gold, cb-blue, etc.)
    const hasColorfulBtns = await page.locator('.cb-gold, .cb-blue, .cb-purple, .cb-green').count() > 0;
    if (hasColorfulBtns) results.passed.push('Cheat buttons have colorful styling (cb-* classes)');

  } catch (err) {
    results.failed.push(`Error: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }

  // Report
  console.log('\n=== Flugzeug Quartett Cheat System Verification ===\n');
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
