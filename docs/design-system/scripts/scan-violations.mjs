// Quality gate: no hardcoded hex, px font sizes or brand strings in components/sheets.
import fs from 'node:fs'; import path from 'node:path';
const targets = ['src/components.css', 'src/base.css', ...fs.readdirSync('styleguide').filter(f => f.endsWith('.html')).map(f => 'styleguide/' + f), ...fs.readdirSync('styleguide/assets').map(f => 'styleguide/assets/' + f)];
const rules = [
  ['hardcoded hex colour', /#[0-9a-fA-F]{3,8}\b(?![\w-])/g, (m, line) => !/href="#|href='#|url\(#|id="#/.test(line) && !/^\s*#/.test(m)],
  ['px font size', /(font-size\s*:\s*[\d.]+px|text-\[[\d.]+px\])/g],
  ['rgb()/hsl() colour literal', /\b(rgba?|hsla?)\(/g],
  ['hardcoded brand name', /\b(Shopee|Lazada|Acme)\b/g],
  /* Focus indicators live only in src/base.css + src/components.css (.focus-ring / .focus-inset). */
  ['component-level focus override (use the foundation classes)', /(?:has-\[:focus[a-z-]*\]|has-focus[a-z-]*|focus-visible|focus-within|focus|\[[^\]"'\s]*focus[^\]"'\s]*\]):(?:ring|outline|border|shadow)\S*/g],
  ['hardcoded outline width (use --focus-ring-width)', /\boutline-\d+\b/g],
  ['outline removed without a focus replacement', /\boutline-(?:none|0)\b/g, (m, line, file) => file !== 'src/base.css' && !/focus(-visible|-within)?:|has-\[?:?[^\s"']*focus|\bfocus-ring\b/.test(line)],
  ['bare :focus pseudo (use :focus-visible)', /:focus(?![-\w])/g, (m, line, file) => file !== 'src/base.css' && !/^\s*\/\//.test(line)],
];
let n = 0;
for (const f of targets) {
  const s = fs.readFileSync(f, 'utf8').replace(/<svg aria-hidden[\s\S]*?<\/svg>/, ''); // skip the inlined sprite
  s.split('\n').forEach((line, i) => {
    for (const [label, re, ok] of rules) for (const m of line.matchAll(re)) {
      if (f.endsWith('sg.js') && label.startsWith('hardcoded hex') ) continue;
      if (ok && !ok(m[0], line, f)) continue;
      if (f.endsWith('sg.js') && label.startsWith('rgb')) continue;
      n++; console.log(`${f}:${i + 1}: ${label}: ${m[0]}`);
    }
  });
}
console.log(n ? `scan: ${n} violation(s)` : 'scan: clean'); process.exit(n ? 1 : 0);
