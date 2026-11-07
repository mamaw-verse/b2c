// axe-core in jsdom: structural rules only (no layout/colour engine). Real-browser axe + screenshots are still required.
import fs from 'node:fs'; import { JSDOM } from 'jsdom';
const axeSrc = fs.readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
let total = 0;
for (const f of fs.readdirSync('styleguide').filter(f => f.endsWith('.html'))) for (const brand of ['default', 'demo']) {
  const html = fs.readFileSync('styleguide/' + f, 'utf8').replace('data-brand="default"', `data-brand="${brand}"`);
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true });
  dom.window.eval(axeSrc);
  const r = await dom.window.axe.run(dom.window.document, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
  total += r.violations.length;
  console.log(`${f} [${brand}]: ${r.violations.length} violation(s), ${r.passes.length} rules passed`);
  for (const v of r.violations) console.log('  -', v.id, v.help, v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' | '));
}
process.exit(total ? 1 : 0);
