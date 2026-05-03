import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const IG_URL = 'https://www.instagram.com/stracuzziautomobili/';
const SCRAPED_DIR = './scraped';
const IMAGES_DIR = './images';

fs.mkdirSync(SCRAPED_DIR, { recursive: true });
fs.mkdirSync(IMAGES_DIR, { recursive: true });

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => { fs.unlink(dest, () => {}); reject(err); });
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  console.log('Loading Instagram profile...');
  await page.goto(IG_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Screenshot full profile
  await page.screenshot({ path: `${SCRAPED_DIR}/profile.png`, fullPage: false });
  console.log('Profile screenshot saved');

  // Extract bio text
  const bioText = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="description"]');
    return meta ? meta.content : '';
  });
  console.log('Bio meta:', bioText);

  // Extract page title
  const title = await page.title();
  console.log('Title:', title);

  // Collect all image URLs from the feed
  const imageUrls = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs
      .filter(img => img.src && img.src.includes('cdninstagram') && img.width > 100)
      .map(img => ({ src: img.src, alt: img.alt, width: img.width, height: img.height }));
  });

  console.log(`Found ${imageUrls.length} images`);

  // Scroll down to load more posts
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(1500);
  }

  // Take scrolled screenshot
  await page.screenshot({ path: `${SCRAPED_DIR}/feed.png`, fullPage: true });
  console.log('Feed screenshot saved');

  // Collect images again after scroll
  const allImageUrls = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs
      .filter(img => img.src && img.src.includes('cdninstagram') && img.width > 100)
      .map(img => ({ src: img.src, alt: img.alt, width: img.width, height: img.height }));
  });

  console.log(`Total images after scroll: ${allImageUrls.length}`);

  // Save metadata
  const data = {
    url: IG_URL,
    title,
    bio: bioText,
    scrapedAt: new Date().toISOString(),
    images: allImageUrls
  };
  fs.writeFileSync(`${SCRAPED_DIR}/data.json`, JSON.stringify(data, null, 2));
  console.log('Data saved to scraped/data.json');

  // Download images
  let downloaded = 0;
  for (let i = 0; i < allImageUrls.length; i++) {
    const img = allImageUrls[i];
    const ext = img.src.split('?')[0].split('.').pop() || 'jpg';
    const dest = path.join(IMAGES_DIR, `car-${String(i + 1).padStart(2, '0')}.${ext}`);
    try {
      await downloadImage(img.src, dest);
      downloaded++;
      console.log(`Downloaded: ${dest}`);
    } catch (e) {
      console.log(`Failed ${i}: ${e.message}`);
    }
  }

  console.log(`\nDone. Downloaded ${downloaded}/${allImageUrls.length} images`);

  await browser.close();
})();
