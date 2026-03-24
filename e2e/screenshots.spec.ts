import { test, type BrowserContext, type Page, chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = path.resolve(__dirname, '../.output/chrome-mv3');
const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots');
const TEMPLATE_PATH = path.resolve(__dirname, 'promo-template.html');

let context: BrowserContext;

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext('', {
    headless: false,
    deviceScaleFactor: 2,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-first-run',
      '--disable-gpu',
      '--force-device-scale-factor=2',
    ],
  });
});

test.afterAll(async () => {
  await context.close();
});

async function getExtensionId(): Promise<string> {
  const serviceWorkers = context.serviceWorkers();
  if (serviceWorkers.length > 0) {
    return serviceWorkers[0].url().split('/')[2];
  }
  const sw = await context.waitForEvent('serviceworker');
  return sw.url().split('/')[2];
}

async function capturePopup(colorScheme: 'light' | 'dark', tab: 'random' | 'passphrase'): Promise<Buffer> {
  const extensionId = await getExtensionId();
  const page = await context.newPage();
  await page.emulateMedia({ colorScheme });
  await page.setViewportSize({ width: 380, height: 600 });
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.waitForSelector('.pw-password-text');
  await page.waitForTimeout(400);

  if (tab === 'passphrase') {
    await page.click('button:has-text("Passphrase")');
    await page.waitForTimeout(300);
  }

  const popup = page.locator('.pw-layout');
  const buffer = await popup.screenshot({ scale: 'device' });
  await page.close();
  return buffer;
}

async function createPromoPage(): Promise<Page> {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 440 });
  const template = readFileSync(TEMPLATE_PATH, 'utf-8');
  await page.setContent(template);
  return page;
}

/**
 * Build a promo slide using safe DOM APIs.
 * All text values are set via textContent; only trusted base64 image data is used in src attributes.
 */
async function buildPromoSlide(
  page: Page,
  opts: {
    badge: string;
    headline: string;
    subhead: string;
    popupB64: string;
  },
) {
  await page.evaluate(({ badge, headline, subhead, popupB64 }) => {
    const content = document.getElementById('content')!;
    content.textContent = '';

    const textSide = document.createElement('div');
    textSide.className = 'text-side';

    const badgeEl = document.createElement('div');
    badgeEl.className = 'badge';
    badgeEl.textContent = badge;

    const headlineEl = document.createElement('div');
    headlineEl.className = 'headline';
    // headline uses <br> — split on \n and insert BR nodes
    headline.split('\n').forEach((line, i) => {
      if (i > 0) headlineEl.appendChild(document.createElement('br'));
      headlineEl.appendChild(document.createTextNode(line));
    });

    const subheadEl = document.createElement('div');
    subheadEl.className = 'subhead';
    subheadEl.textContent = subhead;

    textSide.append(badgeEl, headlineEl, subheadEl);

    const frame = document.createElement('div');
    frame.className = 'popup-frame';
    const img = document.createElement('img');
    img.src = `data:image/png;base64,${popupB64}`;
    frame.appendChild(img);

    content.append(textSide, frame);
  }, opts);
}

async function buildSideBySideSlide(
  page: Page,
  opts: {
    badge: string;
    headline: string;
    subhead: string;
    darkB64: string;
    lightB64: string;
  },
) {
  await page.evaluate(({ badge, headline, subhead, darkB64, lightB64 }) => {
    document.body.classList.add('side-by-side');
    const content = document.getElementById('content')!;
    content.textContent = '';

    const textSide = document.createElement('div');
    textSide.className = 'text-side';

    const badgeEl = document.createElement('div');
    badgeEl.className = 'badge';
    badgeEl.textContent = badge;

    const headlineEl = document.createElement('div');
    headlineEl.className = 'headline';
    headline.split('\n').forEach((line, i) => {
      if (i > 0) headlineEl.appendChild(document.createElement('br'));
      headlineEl.appendChild(document.createTextNode(line));
    });

    const subheadEl = document.createElement('div');
    subheadEl.className = 'subhead';
    subheadEl.textContent = subhead;

    textSide.append(badgeEl, headlineEl, subheadEl);

    const popups = document.createElement('div');
    popups.className = 'popups';

    const frame1 = document.createElement('div');
    frame1.className = 'popup-frame';
    const img1 = document.createElement('img');
    img1.src = `data:image/png;base64,${darkB64}`;
    frame1.appendChild(img1);

    const frame2 = document.createElement('div');
    frame2.className = 'popup-frame secondary';
    const img2 = document.createElement('img');
    img2.src = `data:image/png;base64,${lightB64}`;
    frame2.appendChild(img2);

    popups.append(frame1, frame2);
    content.append(textSide, popups);
  }, opts);
}

// --- Screenshot 1: Hero - Dark random ---
test('promo: hero dark random', async () => {
  const popupBuf = await capturePopup('dark', 'random');
  const page = await createPromoPage();
  await buildPromoSlide(page, {
    badge: 'Cryptographically Secure',
    headline: 'Strong Passwords,\nOne Click',
    subhead:
      "Generate random passwords with customizable length, character types, and minimum requirements. Powered by your browser's CSPRNG.",
    popupB64: popupBuf.toString('base64'),
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/promo-1-hero.png`, scale: 'device' });
  await page.close();
});

// --- Screenshot 2: Passphrase dark ---
test('promo: passphrase dark', async () => {
  const popupBuf = await capturePopup('dark', 'passphrase');
  const page = await createPromoPage();
  await buildPromoSlide(page, {
    badge: 'Easy to Remember',
    headline: 'Memorable\nPassphrases',
    subhead: 'Generate word-based passphrases with configurable word count and separators. Secure and easy to type.',
    popupB64: popupBuf.toString('base64'),
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/promo-2-passphrase.png`, scale: 'device' });
  await page.close();
});

// --- Screenshot 3: Both themes side by side ---
test('promo: dark and light side by side', async () => {
  const darkBuf = await capturePopup('dark', 'random');
  const lightBuf = await capturePopup('light', 'random');
  const page = await createPromoPage();
  await buildSideBySideSlide(page, {
    badge: 'Adapts to You',
    headline: 'Light &\nDark Mode',
    subhead: 'Automatically matches your system theme. Looks great either way.',
    darkB64: darkBuf.toString('base64'),
    lightB64: lightBuf.toString('base64'),
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/promo-3-themes.png`, scale: 'device' });
  await page.close();
});
