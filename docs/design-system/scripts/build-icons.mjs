import fs from 'node:fs';
const names = JSON.parse(fs.readFileSync('scripts/icons.json', 'utf8'));
fs.mkdirSync('icons/svg', { recursive: true });
const symbols = []; const missing = [];
for (const n of names) {
  const p = `node_modules/lucide-static/icons/${n}.svg`;
  if (!fs.existsSync(p)) { missing.push(n); continue; }
  const svg = fs.readFileSync(p, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
  symbols.push(`<symbol id="i-${n}" viewBox="0 0 24 24">${inner}</symbol>`);
  fs.copyFileSync(p, `icons/svg/${n}.svg`);
}
fs.writeFileSync('icons/sprite.svg', `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols.join('\n')}\n</svg>\n`);
fs.mkdirSync('dist', { recursive: true }); fs.copyFileSync('icons/sprite.svg', 'dist/sprite.svg');
console.log(`sprite: ${symbols.length} icons` + (missing.length ? `; MISSING: ${missing.join(', ')}` : ''));
