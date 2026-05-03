import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOTS_DIR = path.join(__dirname, 'temporary screenshots');
fs.mkdirSync(SHOTS_DIR, { recursive: true });

const url = process.argv[2] || 'http://localhost:3001';
const label = process.argv[3] || '';

function nextIndex() {
  const files = fs.readdirSync(SHOTS_DIR).filter(f => f.endsWith('.png'));
  let max = 0;
  files.forEach(f => { const n = parseInt(f.match(/\d+/)?.[0] || '0'); if (n > max) max = n; });
  return max + 1;
}

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1200);
    const n = nextIndex();
    const suffix = label ? `-${label}` : '';
    const file = path.join(SHOTS_DIR, `screenshot-${n}-${vp.name}${suffix}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`Saved: ${path.basename(file)}`);
    await page.close();
  }
  await browser.close();
})();
