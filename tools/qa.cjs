const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const playwright = require(process.argv[2] ? path.resolve(process.argv[2]) : 'playwright');
const root = process.cwd();
const pages = ['index.html', 'services.html', 'booking.html', 'contact.html', ...fs.readdirSync('services').filter(f => f.endsWith('.html')).map(f => 'services/' + f)];
const widths = [320, 360, 375, 390, 412, 430, 1280, 1440, 1600, 1920];
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2' };
// Loopback QA uses HTTP; the production HTTPS headers retain URL upgrading.
const csp = fs.readFileSync('_headers', 'utf8').match(/Content-Security-Policy: (.+)/)[1].replace('; upgrade-insecure-requests', '');
const server = http.createServer((request, response) => {
  const relative = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/^\//, '') || 'index.html';
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || relative.startsWith('.') || relative.startsWith('tools/')) { response.writeHead(403).end(); return; }
  try {
    const content = fs.readFileSync(file);
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Content-Security-Policy': csp, 'X-Content-Type-Options': 'nosniff' });
    response.end(content);
  } catch { response.writeHead(404).end(); }
});
const report = { layouts: [], browsers: [], interactions: [], errors: [], failedRequests: [], unverifiedBrowsers: [] };
const record = () => fs.writeFileSync('.qa/report.json', JSON.stringify(report, null, 2));
async function deadline(operation, label) {
  let timeout;
  try {
    return await Promise.race([operation, new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('QA timeout: ' + label)), 25000); })]);
  } finally { clearTimeout(timeout); }
}
async function checkLayout(page, url, width) {
  await page.setViewportSize({ width, height: width < 800 ? 844 : 1000 });
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const layout = await page.evaluate(async () => {
    const images = Array.from(document.images).filter(img => img.getAttribute('src'));
    images.forEach(img => { img.loading = 'eager'; });
    await Promise.all(images.map(img => img.decode().catch(() => {})));
    return {
      overflow: document.documentElement.scrollWidth > innerWidth,
      brokenImages: images.filter(img => !img.naturalWidth).map(img => img.src),
      h1s: document.querySelectorAll('h1').length,
      mainHeading: !!document.querySelector('main h1'),
      outside: [...document.querySelectorAll('main .container, header .logo, .btn, .sticky-mobile-bar')].filter(el => {
        const box = el.getBoundingClientRect();
        return box.width && (box.left < -1 || box.right > innerWidth + 1);
      }).map(el => el.className),
      fonts: document.fonts.check('500 16px "Cormorant Garamond"') && document.fonts.check('400 16px Jost'),
      spline: !!document.querySelector('.hero-3d-canvas')
    };
  });
  if (layout.overflow) {
    console.log(JSON.stringify(await page.evaluate(() => ({
      viewport: innerWidth, rootWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth,
      outside: [...document.querySelectorAll('body *')].filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width && rect.right > innerWidth + 1 && !el.closest('.testiSwiper, dialog');
      }).map(el => ({ tag: el.tagName, className: el.className, width: el.getBoundingClientRect().width, right: el.getBoundingClientRect().right })).slice(0, 20)
    })), null, 2));
    await page.screenshot({ path: '.qa/overflow.png' });
  }
  assert.equal(layout.overflow, false, 'Page overflow: ' + url + ' at ' + width);
  assert.deepEqual(layout.outside, [], 'Elements outside viewport: ' + url + ' at ' + width);
  assert.deepEqual(layout.brokenImages, [], 'Broken images: ' + url);
  assert.equal(layout.h1s, 1);
  assert.equal(layout.mainHeading, true);
  assert.equal(layout.fonts, true);
  assert.equal(layout.spline, false);
  report.layouts.push({ page: new URL(url).pathname, width, passed: true });
  record();
}
async function interactions(page, base) {
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(15000);
  console.log('Checking navigation, reviews, gallery, and forms...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + '/index.html');
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  assert.equal(await page.locator('.nav-dialog').evaluate(el => el.open), true);
  assert.equal(await page.evaluate(() => document.body.classList.contains('modal-open')), true);
  await page.getByRole('button', { name: 'Show service categories' }).click();
  assert.equal(await page.getByRole('button', { name: 'Show service categories' }).getAttribute('aria-expanded'), 'true');
  for (let index = 0; index < 20; index++) {
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.querySelector('.nav-dialog').contains(document.activeElement)), true);
  }
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Open menu', exact: true }).getAttribute('aria-expanded'), 'false');
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.nav-dialog').evaluate(el => el.open), false);
  report.interactions.push('Mobile focus trap, submenu, close, Escape, scroll lock');

  await page.locator('.faq-q').first().scrollIntoViewIfNeeded();
  const question = page.locator('.faq-q').first();
  await question.focus();
  await page.keyboard.press('Enter');
  assert.equal(await question.getAttribute('aria-expanded'), 'false');
  await page.keyboard.press('Space');
  assert.equal(await question.getAttribute('aria-expanded'), 'true');
  report.interactions.push('FAQ keyboard toggle');

  const reviews = page.locator('.testiSwiper');
  await reviews.scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Next review' }).click();
  assert.equal(await page.locator('.review-progress').textContent(), '2 / 9');
  await reviews.focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('.review-progress').textContent(), '3 / 9');
  await page.locator('.swiper-slide-active .review-read').click();
  assert.equal(await page.locator('.review-dialog h2').textContent(), 'Aparna Khanna1110');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.review-dialog').evaluate(el => el.open), false);
  report.interactions.push('Review navigation, keyboard, full text dialog');
  if (page.context().browser().browserType().name() === 'chromium') {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await reviews.scrollIntoViewIfNeeded();
    const box = await reviews.boundingBox();
    const y = box.y + 150;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width * .8, y }] });
    for (const fraction of [.7, .6, .5, .4, .3, .2]) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + box.width * fraction, y }] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.equal(await page.locator('.review-progress').textContent(), '4 / 9');
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await cdp.detach();
    report.interactions.push('Native touch swipe advances reviews');
  }

  await page.locator('.gallery-open').first().click();
  assert.equal(await page.locator('.gallery-dialog').evaluate(el => el.open), true);
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('.gallery-caption').textContent(), '2 / 6');
  await page.keyboard.press('Escape');
  report.interactions.push('Gallery lightbox, keyboard navigation, Escape');

  for (const file of ['booking.html', 'contact.html']) {
    await page.goto(base + '/' + file);
    await page.evaluate(() => { window.open = (...args) => { window.lastWhatsApp = args; return null; }; });
    await page.locator('input[name="name"]').fill('A & B');
    await page.locator('input[name="phone"]').fill('+91 76968 84103');
    if (file === 'booking.html') {
      try { await page.waitForFunction(() => !!document.querySelector('input[name="date"]').min); }
      catch (error) {
        console.log(JSON.stringify(await page.evaluate(() => ({ ready: document.readyState, dialogs: document.querySelectorAll('dialog').length, min: document.querySelector('input[name="date"]').min, scripts: [...document.scripts].map(script => script.src), path: location.href })), null, 2));
        throw error;
      }
      await page.locator('select[name="service"]').selectOption('Nail Services');
      const min = await page.locator('input[name="date"]').getAttribute('min');
      await page.locator('input[name="date"]').fill(min);
      await page.locator('input[name="time"]').fill('14:00');
      await page.locator('textarea').fill('Art & accents #1 + 50%');
    } else {
      await page.locator('input[type="email"]').first().fill('a+b@example.com');
      await page.locator('textarea').fill('Art & accents #1 + 50%');
    }
    await page.locator('main button[type="submit"]').click();
    const result = await page.evaluate(() => window.lastWhatsApp);
    assert.equal(new URL(result[0]).searchParams.get('text').includes('Art & accents #1 + 50%'), true);
    assert.equal(result[2], 'noopener,noreferrer');
    assert.equal(await page.locator('.form-status').first().textContent().then(text => text.includes('Continue in WhatsApp')), true);
    assert.equal(await page.locator('input[name="name"]').inputValue(), 'A & B');
  }
  report.interactions.push('Booking/contact validation and encoded WhatsApp handoff; blocked popup fallback');
}
(async () => {
  fs.mkdirSync('.qa', { recursive: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    const primary = process.argv.find(arg => arg.startsWith('--engine='))?.split('=')[1] || 'chrome';
    browser = await (primary === 'chrome' ? playwright.chromium.launch({ channel: 'chrome', headless: true }) : playwright[primary].launch({ headless: true }));
    const page = await deadline(browser.newPage({ reducedMotion: 'reduce' }), primary + ' new page');
    page.setDefaultTimeout(10000);
    page.setDefaultNavigationTimeout(15000);
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('requestfailed', request => { if (request.url().startsWith(base) && !/aborted|cancelled|NS_BINDING_ABORTED/i.test(request.failure()?.errorText || '')) report.failedRequests.push(request.url()); });
    for (const file of pages) {
      for (const width of process.argv.includes('--smoke') ? [390] : widths) await checkLayout(page, base + '/' + file, width);
      if (file === 'index.html') {
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.screenshot({ path: '.qa/hero-desktop.png' });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: '.qa/hero-mobile.png' });
      }
      console.log('Responsive layouts passed: ' + file);
    }
    await interactions(page, base);
    console.log('Primary browser interaction checks passed.');
    record();
    await page.goto(base + '/index.html');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: '.qa/desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: '.qa/mobile.png', fullPage: true });
    await page.locator('#testimonials').scrollIntoViewIfNeeded();
    await page.screenshot({ path: '.qa/reviews-mobile.png' });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(base + '/index.html');
    await page.waitForTimeout(900);
    assert.equal(await page.locator('h1').evaluate(el => getComputedStyle(el).opacity), '1');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.mouse.move(1100, 350);
    await page.waitForTimeout(650);
    const matrix = await page.locator('.hero-fallback').evaluate(el => getComputedStyle(el).transform);
    assert.notEqual(matrix, 'none');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('.hero-fallback').evaluate(el => getComputedStyle(el).transform), 'none');
    report.interactions.push('GSAP hero entrance, desktop perspective, live reduced-motion cleanup');
    const categories = page.getByRole('button', { name: 'Show service categories' });
    await categories.focus();
    assert.equal(await categories.getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    assert.equal(await categories.getAttribute('aria-expanded'), 'false');
    report.interactions.push('Desktop services disclosure keyboard and Escape state');
    const splineRequests = [];
    page.on('request', req => { if (/splinecode|spline-runtime/.test(req.url())) splineRequests.push(req.url()); });
    await page.evaluate(() => document.querySelector('[data-hero-3d]').hero3D.configure({ enabled: true, sceneUrl: 'invalid', runtimeUrl: 'invalid' }));
    assert.deepEqual(splineRequests, []);
    assert.equal(await page.locator('.hero-fallback img').evaluate(el => el.naturalWidth > 0), true);
    report.interactions.push('Spline disabled and invalid configuration issue no scene/runtime requests');
    const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const nojsPage = await nojs.newPage();
    await nojsPage.goto(base + '/index.html');
    assert.equal(await nojsPage.locator('h1').isVisible(), true);
    assert.equal(await nojsPage.locator('.faq-a').last().isVisible(), true);
    assert.equal(await nojsPage.locator('nav').isVisible(), true);
    report.interactions.push('No-JavaScript hero, navigation, FAQ and review fallback');
    await nojs.close();
    await browser.close();
    browser = null;
    report.browsers.push(primary + ': responsive matrix and interactions');
    console.log(primary + ' interactions and motion checks passed.');
    for (const name of process.argv.includes('--chrome-only') ? [] : ['edge', 'firefox', 'webkit']) {
      try {
      console.log('Checking browser: ' + name);
      const engine = name === 'edge' ? playwright.chromium : playwright[name];
      browser = await engine.launch(name === 'edge' ? { channel: 'msedge', headless: true, timeout: 15000 } : name === 'firefox' ? { headless: true, timeout: 15000, firefoxUserPrefs: { 'security.sandbox.content.level': 0 } } : { headless: true, timeout: 15000 });
      console.log('Browser launched: ' + name);
      const page = await deadline(browser.newPage({ reducedMotion: 'reduce' }), name + ' new page');
      page.setDefaultTimeout(10000);
      page.setDefaultNavigationTimeout(15000);
      page.on('pageerror', error => report.errors.push(name + ': ' + error.message));
      await deadline(checkLayout(page, base + '/index.html', 390), name + ' mobile layout');
      console.log('Mobile layout passed: ' + name);
      await deadline(interactions(page, base), name + ' interactions');
      await deadline(checkLayout(page, base + '/index.html', 1440), name + ' desktop layout');
      await browser.close();
      browser = null;
      report.browsers.push(name + ': mobile/desktop smoke and interactions');
      record();
      } catch (error) {
        report.unverifiedBrowsers.push({ browser: name, reason: error.message });
        await browser?.close();
        browser = null;
        record();
        console.log('Browser verification incomplete: ' + name + ': ' + error.message);
      }
    }
    assert.deepEqual(report.errors, [], 'Browser errors');
    assert.deepEqual(report.failedRequests, [], 'Failed local requests');
    console.log(JSON.stringify({ passedLayouts: report.layouts.length, browsers: report.browsers, errors: report.errors, failedRequests: report.failedRequests, unverifiedBrowsers: report.unverifiedBrowsers }, null, 2));
    if (report.unverifiedBrowsers.length) process.exitCode = 1;
  } catch (error) {
    report.failure = error.message;
    console.error(error);
    process.exitCode = 1;
  } finally {
    await browser?.close();
    server.close();
    fs.writeFileSync('.qa/report.json', JSON.stringify(report, null, 2));
  }
})();
