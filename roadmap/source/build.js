// Renders roadmap.html to the PDF one folder up.
// Usage: node roadmap/source/build.js   (needs Playwright + Chromium)
// If you edited plan_data.py, run python3 roadmap/source/build_plan.py first.
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const src = path.resolve(__dirname, 'roadmap.html');
  const out = path.resolve(__dirname, '..', 'Sales-x-Content-90-Day-Roadmap.pdf');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + src, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
  await browser.close();
  console.log('wrote', out);
})();
