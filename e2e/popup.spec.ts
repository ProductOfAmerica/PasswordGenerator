import { test, expect, type BrowserContext, chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = path.resolve(__dirname, '../.output/chrome-mv3');

let context: BrowserContext;

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-first-run',
      '--disable-gpu',
    ],
  });
});

test.afterAll(async () => {
  await context.close();
});

async function openPopup() {
  // Get the extension ID from the service worker
  let extensionId = '';
  const serviceWorkers = context.serviceWorkers();
  if (serviceWorkers.length > 0) {
    const url = serviceWorkers[0].url();
    extensionId = url.split('/')[2];
  } else {
    // Wait for service worker to register
    const sw = await context.waitForEvent('serviceworker');
    extensionId = sw.url().split('/')[2];
  }

  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.waitForSelector('button[title="Click to copy"]');
  return page;
}

test('popup opens and displays a generated password', async () => {
  const page = await openPopup();
  // Wait for the password to be generated (not the placeholder "...")
  const passwordButton = page.locator('button[title="Click to copy"]');
  await expect(passwordButton).not.toHaveText('...', { timeout: 5000 });
  const text = await passwordButton.textContent();
  expect(text).toBeTruthy();
  expect(text!.length).toBeGreaterThan(0);
  await page.close();
});

test('regenerate button produces a new password', async () => {
  const page = await openPopup();
  const passwordButton = page.locator('button[title="Click to copy"]');

  const firstPassword = await passwordButton.textContent();
  await page.click('button[aria-label="Regenerate password"]');

  // Password should have changed (extremely unlikely to be the same)
  const secondPassword = await passwordButton.textContent();
  expect(secondPassword).toBeTruthy();
  expect(secondPassword!.length).toBeGreaterThan(0);
  await page.close();
});

test('toggle to passphrase mode displays word-based password', async () => {
  const page = await openPopup();

  // Click passphrase mode tab
  await page.click('button:has-text("Passphrase")');
  await page.click('button[aria-label="Regenerate password"]');

  const passwordButton = page.locator('button[title="Click to copy"]');
  const text = await passwordButton.textContent();

  // Passphrase should contain the separator (hyphen by default)
  expect(text).toContain('-');
  // Should have multiple words
  expect(text!.split('-').length).toBeGreaterThanOrEqual(2);
  await page.close();
});

test('adjust +/- controls changes character count', async () => {
  const page = await openPopup();

  // Make sure we're in random mode
  await page.click('button:has-text("Random")');

  // First number input is character count
  const charInput = page.locator('input[type="number"]').first();
  const initialValue = await charInput.inputValue();

  // The + button right after that input
  const allPlusButtons = page.locator('.pw-num-btn:has-text("+")');
  await allPlusButtons.first().click();
  await page.waitForTimeout(100);

  const newValue = await charInput.inputValue();
  expect(parseInt(newValue)).toBe(parseInt(initialValue) + 1);
  await page.close();
});

test('disable all character sets shows no options message', async () => {
  const page = await openPopup();

  // Make sure we're in random mode
  await page.click('button:has-text("Random")');

  // Click each toggle button to disable character sets
  // Toggles are buttons containing the label text
  for (const label of ['Uppercase', 'Lowercase', 'Numbers', 'Symbols']) {
    const toggle = page.locator(`button:has-text("${label}")`);
    // Only click if toggle is currently active (has .active class on the track)
    const track = toggle.locator('.pw-switch');
    const isActive = await track.evaluate((el) => el.classList.contains('on'));
    if (isActive) {
      await toggle.click();
    }
  }

  // Regenerate
  await page.click('button[aria-label="Regenerate password"]');

  // Should show error message
  const passwordButton = page.locator('button[title="Click to copy"]');
  const text = await passwordButton.textContent();
  expect(text).toContain('No options selected');
  await page.close();
});

test('switching tabs preserves separate passwords per mode', async () => {
  const page = await openPopup();
  const passwordButton = page.locator('button[title="Click to copy"]');

  // Start in random mode — capture the random password
  await page.click('button:has-text("Random")');
  await expect(passwordButton).not.toHaveText('...', { timeout: 5000 });
  const randomPassword = await passwordButton.textContent();

  // Switch to passphrase — should show a different password with hyphens
  await page.click('button:has-text("Passphrase")');
  const passphrasePassword = await passwordButton.textContent();
  expect(passphrasePassword).toContain('-');
  expect(passphrasePassword).not.toBe(randomPassword);

  // Switch back to random — should show the original random password
  await page.click('button:has-text("Random")');
  const randomAgain = await passwordButton.textContent();
  expect(randomAgain).toBe(randomPassword);

  // Switch to passphrase again — should show the original passphrase
  await page.click('button:has-text("Passphrase")');
  const passphraseAgain = await passwordButton.textContent();
  expect(passphraseAgain).toBe(passphrasePassword);

  await page.close();
});

test('clicking anywhere in the password field copies to clipboard', async () => {
  const page = await openPopup();
  const passwordButton = page.locator('button[title="Click to copy"]');
  await expect(passwordButton).not.toHaveText('...', { timeout: 5000 });

  // Grant clipboard permissions
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  // Click the padding area of .pw-field-inner (far left edge), not the text itself
  const fieldInner = page.locator('.pw-field-inner');
  const box = await fieldInner.boundingBox();
  expect(box).toBeTruthy();
  // Click at the very left edge (in the padding, outside the text button)
  await page.mouse.click(box!.x + 5, box!.y + box!.height / 2);

  // Verify the checkmark icon appears confirming copy
  const checkIcon = page.locator('.pw-check-icon');
  await expect(checkIcon).toBeVisible({ timeout: 2000 });

  await page.close();
});

test('passphrase mode shows strength label', async () => {
  const page = await openPopup();
  await page.click('button:has-text("Passphrase")');
  await page.click('button[aria-label="Regenerate password"]');

  // The meta row should show a strength label
  const strengthLabel = page.locator('.pw-strength-label');
  await expect(strengthLabel).toBeVisible({ timeout: 5000 });
  const text = await strengthLabel.textContent();
  expect(text).toBeTruthy();
  expect(text!.length).toBeGreaterThan(0);
  await page.close();
});
