// Real-browser verification (Playwright + system Chrome): horizontal overflow, touch targets, input font size,
// minimum text size, axe-core (incl. colour contrast), dialog focus return, JS errors; optional screenshots.
//   node scripts/verify.mjs [--only <substring>] [--shots] [--no-axe] [--brands default,demo] [--widths 360,768,1280]
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true) : d; };
const only = arg('only', ''); const shots = arg('shots', false); const axeOn = !arg('no-axe', false);
const brands = String(arg('brands', 'default,demo')).split(','); const widths = String(arg('widths', '360,768,1280')).split(',').map(Number);
const HEIGHT = { 360: 740, 768: 1024, 1280: 800 };

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const p = path.join(process.cwd(), decodeURIComponent(new URL(req.url, 'http://x').pathname));
  fs.readFile(p, (err, data) => { if (err) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); res.end(data); });
});
await new Promise(r => server.listen(0, r));
const base = `http://localhost:${server.address().port}/`;

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.html') ? [path.join(d, e.name)] : []);
const pages = walk('styleguide').filter(p => p.includes(only)).sort();
const axeSrc = fs.readFileSync('node_modules/axe-core/axe.min.js', 'utf8');

const browser = await chromium.launch({ channel: 'chrome' });
const results = [];

async function checkPage(ctx, file, brand, width) {
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', res => { if (res.status() >= 400 && !/favicon/.test(res.url())) errors.push(`${res.status()} ${res.url().replace(base, '')}`); });
  await page.setViewportSize({ width, height: HEIGHT[width] });
  await page.goto(base + file + `?brand=${brand}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate(({ width }) => {
    const out = { overflow: [], touch: [], input: [], tiny: [] };
    const visible = (el) => { const s = getComputedStyle(el); if (s.visibility === 'hidden' || s.display === 'none') return false; const rc = el.getBoundingClientRect(); return rc.width > 1 && rc.height > 1 && !el.closest('dialog:not([open]), [popover]:not(:popover-open), [hidden], template, [aria-hidden="true"]'); };
    const sel = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; const t = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30); const sec = el.closest('section[aria-labelledby], [data-sg-cell]'); return s + (t ? ` "${t}"` : '') + (sec ? ` in ${sec.getAttribute('aria-labelledby') || ''}` : ''); };
    const scroller = (el) => { for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') return true; } return false; };
    if (document.documentElement.scrollWidth > innerWidth + 1) {
      out.overflow.push(`page scrollWidth ${document.documentElement.scrollWidth} > ${innerWidth}`);
      for (const el of document.querySelectorAll('body *')) { const rc = el.getBoundingClientRect(); if (rc.right > innerWidth + 1 && visible(el) && !scroller(el)) { out.overflow.push(sel(el)); if (out.overflow.length > 4) break; } }
    }
    const hit = (el) => { const rc = el.getBoundingClientRect(); let w = rc.width, h = rc.height; for (const ps of ['::after', '::before']) { const s = getComputedStyle(el, ps); if (s.content !== 'none' && s.position === 'absolute') { w = Math.max(w, parseFloat(s.width) || 0); h = Math.max(h, parseFloat(s.height) || 0); } } return [w, h]; };
    for (const el of document.querySelectorAll('a[href], button, select, textarea, input:not([type=hidden]), summary, [role=tab], [role=option], label:has(> input.sr-only)')) {
      if (!visible(el) || el.closest('[data-touch-exempt], .sr-only')) continue;
      if (el.matches('input.sr-only, input[type=checkbox]:not([role=switch]), input[type=radio]')) continue;
      if (el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.closest('p, li, td, dd, figcaption')) continue;
      const target = el.matches('input, select, textarea') && el.closest('label') ? el.closest('label') : el;
      const [w, h] = hit(target); if (w < 43.5 || h < 43.5) out.touch.push(`${sel(el)} ${Math.round(w)}x${Math.round(h)}`);
    }
    if (width < 1024) for (const el of document.querySelectorAll('input, select, textarea')) {
      if (!visible(el) || /checkbox|radio|range|file|color/.test(el.type) || el.getAttribute('role') === 'switch') continue;
      const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 16) out.input.push(`${sel(el)} ${fs}px`);
    }
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = tw.nextNode());) {
      const el = n.parentElement; if (!n.textContent.trim() || !el || !visible(el) || el.closest('.sr-only, svg, script, style')) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 12) { out.tiny.push(`${sel(el)} ${fs}px`); if (out.tiny.length > 5) break; }
    }
    return out;
  }, { width });
  let axe = [];
  if (axeOn && width !== 768) {
    await page.addScriptTag({ content: axeSrc });
    axe = await page.evaluate(async () => {
      const res = await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'], rules: { region: { enabled: false }, 'landmark-complementary-is-top-level': { enabled: false }, 'landmark-unique': { enabled: !location.pathname.includes('/components/') } } });
      return res.violations.map(v => `${v.id} (${v.impact}): ${v.nodes.length} node(s) e.g. ${v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' | ')}${v.id === 'color-contrast' ? ' ' + (v.nodes[0].any[0]?.message || '').slice(0, 140) : ''}`);
    });
  }
  let focus = [];
  if (brand === brands[0] && width === 360) {
    await page.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
    const triggers = await page.$$('[data-ds-open]:visible');
    for (const t of triggers.slice(0, 4)) {
      const id = await t.getAttribute('data-ds-open');
      await t.scrollIntoViewIfNeeded(); await t.click();
      await page.waitForFunction((id) => document.getElementById(id)?.open && document.getElementById(id).contains(document.activeElement), id, { timeout: 8000 }).catch(() => {});
      const inside = await page.evaluate((id) => { const d = document.getElementById(id); return !!d && d.open && d.contains(document.activeElement); }, id);
      await page.keyboard.press('Escape');
      await page.waitForFunction((id) => !document.getElementById(id)?.open, id, { timeout: 8000 }).catch(() => {});
      const back = await page.evaluate(() => document.activeElement && document.activeElement.hasAttribute('data-ds-open'));
      if (!inside) focus.push(`#${id}: focus not moved into dialog`); if (!back) focus.push(`#${id}: focus not returned to trigger`);
    }
  }
  if (shots) {
    const dir = `screenshots/${path.relative('styleguide', file).replace(/\.html$/, '').replace(/[\\/]/g, '__')}`;
    if (/^styleguide\/(screens|layouts|previews)\//.test(file) && !file.endsWith('index.html') && !file.endsWith('.preview.html')) {
      fs.mkdirSync('screenshots', { recursive: true });
      await page.screenshot({ path: `${dir}--${brand}--${width}.png`, fullPage: !file.includes('/previews/') || true });
    }
  }
  await page.close();
  return { file, brand, width, ...r, axe, focus, errors };
}

const jobs = [];
for (const file of pages) for (const brand of brands) for (const width of widths) jobs.push([file, brand, width]);
const ctx = await browser.newContext({ reducedMotion: 'reduce' });
let i = 0;
await Promise.all(Array.from({ length: 6 }, async () => { while (i < jobs.length) { const j = jobs[i++]; try { results.push(await checkPage(ctx, ...j)); } catch (e) { results.push({ file: j[0], brand: j[1], width: j[2], errors: ['verify crashed: ' + e.message], overflow: [], touch: [], input: [], tiny: [], axe: [], focus: [] }); } } }));
await browser.close(); server.close();

results.sort((a, b) => (a.file + a.brand + a.width).localeCompare(b.file + b.brand + b.width));
const kinds = ['overflow', 'touch', 'input', 'tiny', 'axe', 'focus', 'errors'];
const bad = results.filter(r => kinds.some(k => r[k].length));
let md = `# Verification report\n\nGenerated by \`npm run verify\` (scripts/verify.mjs) in headless Chrome via Playwright. Do not edit by hand.\n\n`;
md += `Pages: ${pages.length} · brands: ${brands.join(', ')} · widths: ${widths.join(', ')} · runs: ${results.length} · axe-core ${JSON.parse(fs.readFileSync('node_modules/axe-core/package.json')).version} (WCAG 2.2 AA + best practice, colour contrast on; run at 360 and 1280)\n\n`;
md += `| Check | Failing runs |\n|---|---|\n${kinds.map(k => `| ${k} | ${results.filter(r => r[k].length).length} |`).join('\n')}\n\n`;
md += bad.length ? `## Failures\n\n${bad.map(r => `### ${r.file} [${r.brand} @ ${r.width}]\n${kinds.filter(k => r[k].length).map(k => `- **${k}**: ${r[k].slice(0, 6).join('; ')}`).join('\n')}`).join('\n\n')}\n` : '## Result\n\nAll checks pass on every page, brand and width.\n';
if (!only) fs.writeFileSync('docs/verification.md', md);
for (const r of bad) console.log(`${r.file} [${r.brand}@${r.width}]\n` + kinds.filter(k => r[k].length).map(k => `  ${k}: ${r[k].slice(0, 6).join('\n    ')}`).join('\n'));
console.log(`verify: ${results.length} runs, ${bad.length} with issues`);
process.exit(bad.length ? 1 : 0);
