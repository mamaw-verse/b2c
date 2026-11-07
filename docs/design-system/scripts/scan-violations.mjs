// Quality gate: no hardcoded hex, px font sizes or brand strings in components/sheets.
import fs from 'node:fs'; import path from 'node:path';
const targets = ['src/components.css', 'src/base.css', ...fs.readdirSync('styleguide').filter(f => f.endsWith('.html')).map(f => 'styleguide/' + f), ...fs.readdirSync('styleguide/assets').map(f => 'styleguide/assets/' + f)];
const rules = [
  ['hardcoded hex colour', /#[0-9a-fA-F]{3,8}\b(?![\w-])/g, (m, line) => !/href="#|href='#|url\(#|id="#/.test(line) && !/^\s*#/.test(m)],
  ['px font size', /(font-size\s*:\s*[\d.]+px|text-\[[\d.]+px\])/g],
  ['rgb()/hsl() colour literal', /\b(rgba?|hsla?)\(/g],
  ['hardcoded brand name', /\b(Shopee|Lazada|Acme)\b/g],
];
let n = 0;
for (const f of targets) {
  const s = fs.readFileSync(f, 'utf8').replace(/<svg aria-hidden[\s\S]*?<\/svg>/, ''); // skip the inlined sprite
  s.split('\n').forEach((line, i) => {
    for (const [label, re, ok] of rules) for (const m of line.matchAll(re)) {
      if (f.endsWith('sg.js') && label.startsWith('hardcoded hex') ) continue;
      if (ok && !ok(m[0], line)) continue;
      if (f.endsWith('sg.js') && label.startsWith('rgb')) continue;
      n++; console.log(`${f}:${i + 1}: ${label}: ${m[0]}`);
    }
  });
}
console.log(n ? `scan: ${n} violation(s)` : 'scan: clean'); process.exit(n ? 1 : 0);
