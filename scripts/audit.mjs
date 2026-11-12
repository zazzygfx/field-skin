/*
 * FIELD — step 9 audit (Licensed under the Apache License, Version 2.0)
 * Runs in headless Chrome against a local production build (npm run build && npx vite preview --port 4173):
 *   - axe-core on the site (desktop + phone) and the player page, with screenshots
 *   - keyboard-only pass: Tab through the page, every stop must show a focus ring
 *   - reduced motion, reduced transparency, forced colours
 * Usage: node scripts/audit.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const OUT = 'docs/audit';
mkdirSync(OUT, { recursive: true });
const AXE = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const report = {};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'],
});

async function open(url, { phone = false, media = [] } = {}) {
  const page = await browser.newPage();
  if (phone) {
    await page.setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  } else {
    await page.setViewport({ width: 1440, height: 900 });
  }
  if (media.length) {
    // raw CDP: puppeteer's wrapper doesn't know prefers-reduced-transparency yet
    const cdp = await page.createCDPSession();
    await cdp.send('Emulation.setEmulatedMedia', { features: media });
  }
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await wait(2500);
  return { page, errors };
}

async function axe(page, name, label) {
  await page.addScriptTag({ content: AXE });
  const res = await page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } });
    return { violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) })), passes: r.passes.length, version: window.axe.version };
  });
  // a result card over the page, then a screenshot of both
  await page.evaluate(
    (res, label) => {
      const d = document.createElement('div');
      d.setAttribute('style', 'position:fixed;left:24px;top:24px;z-index:99999;max-width:440px;padding:18px 20px;border-radius:16px;background:#17160F;color:#F2EFE5;font:500 15px/1.45 system-ui,sans-serif;box-shadow:0 8px 24px rgb(0 0 0/.3)');
      d.innerHTML = `<div style="font:700 13px/1 ui-monospace,monospace;color:#FF4D00;letter-spacing:.04em">AXE-CORE ${res.version}</div>
        <div style="font:700 30px/1.15 system-ui;margin:8px 0 4px">${res.violations.length} violations</div>
        <div>${label}</div><div style="opacity:.75">${res.passes} rules passed · WCAG 2.0/2.1/2.2 A + AA + best practice · ${new Date().toISOString().slice(0, 10)}</div>`;
      document.body.append(d);
    },
    res,
    label,
  );
  await page.screenshot({ path: `${OUT}/axe-${name}.png` });
  report[`axe-${name}`] = { violations: res.violations, passes: res.passes };
  return res;
}

/* 1. axe: site desktop (every player mounted), site phone, player page */
{
  const { page, errors } = await open(`${BASE}/?all`);
  await axe(page, 'site-desktop', 'FIELD site, desktop 1440, all players mounted');
  report.errorsDesktop = errors;
  await page.close();
}
{
  const { page, errors } = await open(`${BASE}/?all`, { phone: true });
  await axe(page, 'site-phone', 'FIELD site, phone 390, touch');
  report.errorsPhone = errors;
  await page.close();
}
{
  const { page } = await open(`${BASE}/dev.html`);
  await axe(page, 'player', 'FIELD player alone (dev.html)');
  await page.close();
}

/* 2. keyboard-only pass: Tab through the whole site */
{
  const { page } = await open(`${BASE}/?all`);
  const stops = [];
  for (let i = 0; i < 400; i++) {
    await page.keyboard.press('Tab');
    const s = await page.evaluate(() => {
      // follow focus into shadow roots
      let el = document.activeElement;
      while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      // the seek needle's ring is drawn on the whole strip (field.css: .field-strip:has(:focus-visible))
      const holder = el.closest('.field-strip') ?? el;
      const hs = getComputedStyle(holder);
      const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || /0px 0px 0px [1-9]/.test(cs.boxShadow) || cs.boxShadow.includes('inset') || hs.boxShadow.includes('inset');
      const r = el.getBoundingClientRect();
      const name = el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 30) || el.tagName;
      const hidden = r.width === 0 || r.height === 0;
      return { tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 40), name, ring, hidden, focusVisible: el.matches(':focus-visible') };
    });
    if (!s) continue;
    const key = `${s.tag}.${s.cls}|${s.name}`;
    if (stops.length && stops[0].key === key && i > 20) break; // wrapped around
    stops.push({ key, ...s });
  }
  const noRing = stops.filter((s) => !s.ring && !s.hidden);
  report.keyboard = { stops: stops.length, withoutVisibleRing: noRing.map((s) => s.key), hiddenStops: stops.filter((s) => s.hidden).map((s) => s.key) };
  // keys on the player work: focus the hero play key, press K and arrows
  const k = await page.evaluate(async () => {
    const root = document.querySelector('[data-player="1"] media-container');
    const m = root.querySelector('[data-field-media]');
    root.querySelector('.field-play:not(.field-bigplay)').focus();
    return { pausedBefore: m.paused, t: m.currentTime };
  });
  await page.keyboard.press('k');
  await wait(4000); // the hero streams nothing until asked
  await page.keyboard.press('l');
  await wait(1500);
  const after = await page.evaluate(() => {
    const m = document.querySelector('[data-player="1"] [data-field-media]');
    return { paused: m.paused, t: m.currentTime };
  });
  report.keyboard.playerKeys = { before: k, afterKThenL: after };
  await page.close();
}

/* 3. reduced motion: no theme tour, transitions ~0 */
{
  const { page } = await open(`${BASE}/`, { media: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await page.mouse.wheel({ deltaY: 10 });
  await wait(4500);
  report.reducedMotion = await page.evaluate(() => {
    const root = document.querySelector('[data-player="1"] media-container');
    const key = document.querySelector('.key');
    return {
      tourRan: sessionStorage.getItem('field:tour') === '1' || root?.hasAttribute('data-site-tour'),
      theme: root?.dataset.fieldTheme,
      keyTransition: getComputedStyle(key).transitionDuration,
    };
  });
  await page.close();
}

/* 4. reduced transparency: Liquid becomes solid */
{
  const { page } = await open(`${BASE}/dev.html?theme=liquid`, { media: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
  report.reducedTransparency = await page.evaluate(() => {
    const root = document.querySelector('media-container.field');
    const cs = getComputedStyle(root);
    const pill = root.querySelector('.field-pill');
    const ps = getComputedStyle(pill);
    return { key: cs.getPropertyValue('--field-key').trim(), pillBackground: ps.backgroundColor, backdrop: ps.backdropFilter };
  });
  await page.screenshot({ path: `${OUT}/reduced-transparency-liquid.png` });
  await page.close();
}

/* 5. forced colours: site + player still draw their keys */
{
  const { page } = await open(`${BASE}/?all`, { media: [{ name: 'forced-colors', value: 'active' }] });
  await page.screenshot({ path: `${OUT}/forced-colors-site.png` });
  await page.evaluate(() => document.getElementById('states').scrollIntoView());
  await wait(500);
  await page.screenshot({ path: `${OUT}/forced-colors-desk.png` });
  report.forcedColors = 'screenshots saved';
  await page.close();
}

await browser.close();
writeFileSync(`${OUT}/audit.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
