const { chromium } = require('playwright-core');
const chromiumBin = require('@sparticuz/chromium');

(async () => {
  const ep = await chromiumBin.executablePath();
  const browser = await chromium.launch({
    executablePath: ep,
    args: chromiumBin.args,
    headless: true,
  });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  const logs = [];
  page.on('console', msg => {
    logs.push({ type: 'console', level: msg.type(), text: msg.text() });
  });
  page.on('pageerror', err => {
    logs.push({ type: 'pageerror', text: String(err && err.stack ? err.stack : err) });
  });
  page.on('requestfailed', req => {
    logs.push({ type: 'requestfailed', text: `${req.method()} ${req.url()} :: ${req.failure()?.errorText}` });
  });

  const targets = [
    'https://cognito-seven.vercel.app',
    'https://cognito-seven.vercel.app/chat',
  ];

  for (const url of targets) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(5000);
      logs.push({ type: 'marker', text: `loaded ${url} title=${await page.title()}` });
    } catch (e) {
      logs.push({ type: 'marker', text: `goto failed ${url}: ${String(e)}` });
    }
  }

  try {
    const previewBtn = page.locator('text=Preview').first();
    if (await previewBtn.count()) {
      await previewBtn.click({ timeout: 5000 });
      await page.waitForTimeout(3000);
      logs.push({ type: 'marker', text: 'clicked Preview' });
    } else {
      logs.push({ type: 'marker', text: 'Preview button not found' });
    }
  } catch (e) {
    logs.push({ type: 'marker', text: `click Preview failed: ${String(e)}` });
  }

  const bodyText = await page.locator('body').innerText().catch(() => '');
  logs.push({ type: 'body-snippet', text: bodyText.slice(0, 2000) });

  await browser.close();

  for (const item of logs) {
    const lvl = item.level ? `:${item.level}` : '';
    console.log(`[${item.type}${lvl}] ${item.text}`);
  }
})();
