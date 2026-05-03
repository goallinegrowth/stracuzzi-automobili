import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOTS_DIR = path.join(__dirname, 'temporary screenshots');
fs.mkdirSync(SHOTS_DIR, { recursive: true });

const url = process.argv[2] || 'http://localhost:3001';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });

  // Scroll through full page to trigger all IntersectionObservers
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  const step = 600;
  for (let y = 0; y <= pageHeight; y += step) {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);

  // Full page
  await page.screenshot({ path: path.join(SHOTS_DIR, 'full-desktop.png'), fullPage: true });
  console.log('Saved: full-desktop.png');

  // Hero
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SHOTS_DIR, 'section-hero.png') });
  console.log('Saved: section-hero.png');

  // Scroll to About
  await page.locator('#about').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOTS_DIR, 'section-about.png') });
  console.log('Saved: section-about.png');

  // Scroll to Services
  await page.locator('#services').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOTS_DIR, 'section-services.png') });
  console.log('Saved: section-services.png');

  // Scroll to Gallery
  await page.locator('#gallery').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOTS_DIR, 'section-gallery.png') });
  console.log('Saved: section-gallery.png');

  // Scroll to Contact
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOTS_DIR, 'section-contact.png') });
  console.log('Saved: section-contact.png');

  // Mobile full page
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
  const mHeight = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y <= mHeight; y += 500) {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(100);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SHOTS_DIR, 'full-mobile.png'), fullPage: true });
  console.log('Saved: full-mobile.png');

  await browser.close();
})();
