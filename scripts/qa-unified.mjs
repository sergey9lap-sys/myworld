import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const output = '.impeccable/review';
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const checks = [
  { name: 'archive', path: '/', fullPage: false },
  { name: 'elmira', path: '/p/elmira', fullPage: true },
  { name: 'julia', path: '/p/julia', fullPage: true },
];

for (const [viewportName, width, height] of [['desktop', 1280, 720], ['mobile', 390, 844]]) {
  for (const check of checks) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const response = await page.goto(`http://127.0.0.1:4190${check.path}`, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(async image => {
        image.loading = 'eager';
        try { await image.decode(); } catch {}
      }));
    });

    const state = await page.evaluate(() => ({
      statusWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
      stylesheets: document.styleSheets.length,
      images: [...document.images].every(image => image.complete && image.naturalWidth > 0),
    }));

    if (!response?.ok() || state.statusWidth > state.viewportWidth || !state.stylesheets || !state.images || errors.length) {
      throw new Error(`${viewportName}/${check.name}: ${JSON.stringify({ response: response?.status(), state, errors })}`);
    }

    if (check.name === 'elmira') {
      const caseButton = page.locator('.cases-button');
      const background = await caseButton.evaluate(element => getComputedStyle(element).backgroundColor);
      if (background === 'rgba(0, 0, 0, 0)') throw new Error('Elmira cases button has no fill.');
      await caseButton.click();
      await page.waitForLoadState('networkidle');
      if (!page.url().includes('/p/elmira/cases.html')) throw new Error(`Cases route is broken: ${page.url()}`);
    }

    if (check.name === 'julia') {
      const legend = page.locator('.brief-form legend').first();
      if (await legend.evaluate(element => parseFloat(getComputedStyle(element).paddingTop)) < 20) throw new Error('Request label top spacing is too small.');
      await page.locator('#method-tab-2').click();
      if (!(await page.locator('#method-panel-2').isVisible())) throw new Error('Lesson method tabs are broken.');
    }

    await page.goto(`http://127.0.0.1:4190${check.path}`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${output}/${check.name}-${viewportName}.png`, fullPage: check.fullPage });
    console.log(viewportName, check.name, state);
    await page.close();
  }
}

await browser.close();
console.log('Unified-site QA passed.');
