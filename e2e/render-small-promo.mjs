import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const templatePath = path.join(root, 'e2e', 'small-promo-template.html');
const jpegOutputPath = path.join(root, 'screenshots', 'small-promo-tile.jpg');
const pngOutputPath = path.join(root, 'screenshots', 'small-promo-tile.png');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 440, height: 280 }, deviceScaleFactor: 1 });

await page.goto(pathToFileURL(templatePath).href);
await page.screenshot({
  path: jpegOutputPath,
  type: 'jpeg',
  quality: 96,
  scale: 'css',
});
await page.screenshot({
  path: pngOutputPath,
  type: 'png',
  scale: 'css',
});

await browser.close();
console.log(jpegOutputPath);
console.log(pngOutputPath);
