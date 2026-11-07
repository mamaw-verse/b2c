import fs from 'node:fs';
const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
/** Top-level blocks: [{prelude, body}] (body may contain nested blocks). */
export function blocks(css) {
  css = strip(css); const out = []; let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i); if (open < 0) break;
    const semi = css.lastIndexOf(';', open);
    const prelude = css.slice(Math.max(semi + 1, i), open).trim();
    let depth = 1, j = open + 1;
    while (j < css.length && depth) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
    out.push({ prelude, body: css.slice(open + 1, j - 1) }); i = j;
  }
  return out;
}
export function decls(body) {
  const o = {};
  for (const part of body.split(';')) {
    const k = part.indexOf(':'); if (k < 0) continue;
    const name = part.slice(0, k).trim(); if (!name.startsWith('--')) continue;
    o[name] = part.slice(k + 1).trim();
  }
  return o;
}
const applies = (prelude, brand) => prelude.split(',').map(s => s.trim()).some(s =>
  s === ':root' || s === '[data-brand]' || s === `[data-brand="${brand}"]`);
/** Variables in effect for a brand, in cascade (file) order. */
export function collect(cssTexts, brand = 'default') {
  const vars = {};
  for (const css of cssTexts) for (const b of blocks(css)) if (!b.prelude.startsWith('@') && applies(b.prelude, brand)) Object.assign(vars, decls(b.body));
  return vars;
}
/** Responsive overrides from @media (min-width) blocks that target :root. */
export function media(css) {
  const out = {};
  for (const b of blocks(css)) {
    const m = b.prelude.match(/^@media\s*\(min-width:\s*([\d.]+rem)\)(\s*and\s*\(pointer:\s*fine\))?/);
    if (!m) continue;
    const key = m[1] + (m[2] ? '+fine' : '');
    out[key] = {}; for (const nb of blocks(b.body)) Object.assign(out[key], decls(nb.body));
  }
  return out;
}
export function resolve(vars, value, depth = 0) {
  if (depth > 10) throw new Error('var() cycle: ' + value);
  return value.replace(/var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)/g, (_, n) => {
    if (!(n in vars)) throw new Error('unresolved ' + n);
    return resolve(vars, vars[n], depth + 1);
  });
}
export const read = (p) => fs.readFileSync(p, 'utf8');
