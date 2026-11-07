import fs from 'node:fs';
const src = 'node_modules/@fontsource-variable/manrope/files/';
for (const dir of ['fonts', 'dist/fonts']) {
  fs.mkdirSync(dir, { recursive: true });
  for (const f of ['manrope-latin-wght-normal.woff2', 'manrope-latin-ext-wght-normal.woff2']) fs.copyFileSync(src + f, `${dir}/${f}`);
}
console.log('fonts copied');
