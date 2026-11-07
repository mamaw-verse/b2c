// Generates the whole styleguide from sheets/: overview, foundations, one sheet per component,
// responsive preview pages, layout shells, reference screens, and docs/components/*.md.
import fs from 'node:fs';
import path from 'node:path';
import { shell, renderSheet, renderPreview, renderMd, compNav } from '../sheets/lib/build.mjs';
import { foundationsBody } from '../sheets/pages/foundations.mjs';
import { focusBody } from '../sheets/pages/focus.mjs';
import { icon } from '../sheets/ui/core.mjs';

const order = ['actions', 'forms', 'feedback', 'overlays', 'navigation', 'data-display', 'commerce', 'chat', 'seller', 'admin', 'halal'];
const defs = [];
for (const f of order) {
  const p = `sheets/defs/${f}.mjs`;
  if (fs.existsSync(p)) defs.push(...(await import(path.resolve(p))).default);
}
const groups = [...new Set(defs.map(d => d.group))].map(g => [g, defs.filter(d => d.group === g)]);
const dup = defs.map(d => d.slug).filter((s, i, a) => a.indexOf(s) !== i);
if (dup.length) throw new Error('duplicate slugs: ' + dup);

for (const dir of ['styleguide/components', 'styleguide/previews', 'styleguide/layouts', 'styleguide/screens', 'docs/components']) {
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
}
// {{BRAND_NAME}} is a documentation token; in rendered pages it resolves to the demo brand name (sheets/data.mjs, env BRAND_NAME).
// Text inside <code> keeps the literal token so the docs still show what ports must replace.
import { BRAND } from '../sheets/data.mjs';
const brandify = (s) => s.split(/(<code[^>]*>[\s\S]*?<\/code>)/).map((part, i) => i % 2 ? part : part.replaceAll('{{BRAND_NAME}}', BRAND.name)).join('');
const write = (p, s) => fs.writeFileSync(p, p.endsWith('.html') ? brandify(s) : s);

for (const d of defs) {
  write(`styleguide/components/${d.slug}.html`, renderSheet(d, defs, groups));
  if (d.preview) write(`styleguide/previews/${d.slug}.html`, renderPreview(d));
  write(`docs/components/${d.slug}.md`, renderMd(d));
}

const card = (href, title, text, meta = '') => `<li><a href="${href}" class="card card-interactive flex h-full flex-col gap-1 p-4 hover:border-border-outline"><span class="text-h4">${title}</span><span class="text-body-sm text-muted-foreground">${text}</span>${meta ? `<span class="mt-auto pt-2 text-caption text-muted-foreground">${meta}</span>` : ''}</a></li>`;
write('styleguide/components/index.html', shell({ title: 'Components', depth: 1, active: 'components', body: `<div class="mx-auto max-w-container px-gutter py-6 md:py-10">
<h1 class="text-h1">Components</h1><p class="mt-2 max-w-prose text-body-lg text-muted-foreground">${defs.length} components. Every sheet uses the same 12 sections.</p>
${groups.map(([g, items]) => `<section class="mt-10" aria-labelledby="g-${g.replace(/\W+/g, '-')}"><h2 id="g-${g.replace(/\W+/g, '-')}" class="text-h2">${g}</h2><ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">${items.map(d => card(`${d.slug}.html`, d.name, d.purpose.replace(/`/g, '').split('. ')[0] + '.', `Phase ${d.phase}${d.preview ? ' · responsive preview' : ''}`)).join('')}</ul></section>`).join('')}
</div>` }));

write('styleguide/foundations.html', shell({ title: 'Foundations', active: 'foundations.html', body: foundationsBody }));
write('styleguide/focus.html', shell({ title: 'Focus', active: 'focus.html', body: focusBody }));

/* Layouts and screens (Phase 5) */
let layouts = [], screens = [];
if (fs.existsSync('sheets/layouts.mjs')) ({ layouts } = await import(path.resolve('sheets/layouts.mjs')));
if (fs.existsSync('sheets/screens.mjs')) ({ screens } = await import(path.resolve('sheets/screens.mjs')));
const frameSet = (src, name, h = { 360: 740, 768: 1024, 1280: 800 }) => `<div class="grid gap-6">${[360, 768, 1280].map(w => `<figure class="grid gap-2"><figcaption class="text-label text-muted-foreground">${w}px</figcaption><div class="overflow-hidden rounded-panel border border-border-strong bg-surface" data-sg-frame style="max-width:${w}px"><iframe src="${src}" width="${w}" height="${h[w]}" title="${name} at ${w}px" class="origin-top-left border-0" loading="lazy" data-sg-follow></iframe></div></figure>`).join('')}</div>`;
for (const [kind, list] of [['layouts', layouts], ['screens', screens]]) {
  for (const s of list) {
    write(`styleguide/${kind}/${s.slug}.html`, shell({ title: s.name, depth: 1, bare: true, main: false, body: s.html, bodyCls: s.bodyCls }));
    write(`styleguide/${kind}/${s.slug}.preview.html`, shell({ title: `${s.name} previews`, depth: 1, active: kind, body: `<div class="mx-auto max-w-container px-gutter py-6 md:py-10">
<p class="text-eyebrow uppercase text-primary">${kind === 'layouts' ? 'Layout shell' : 'Reference screen'} · Phase 5</p><h1 class="mt-1 text-h1">${s.name}</h1><p class="mt-2 max-w-prose text-body-lg text-muted-foreground">${s.desc}</p>
<p class="mt-3 flex flex-wrap gap-2"><a class="btn btn-neutral" href="${s.slug}.html">Open full page${icon('external-link')}</a><a class="btn btn-ghost" href="${s.slug}.html?brand=demo">Open in demo brand</a></p>
${s.uses ? `<h2 class="mt-8 text-h3">Components used</h2><ul class="mt-2 flex flex-wrap gap-2">${s.uses.map(u => `<li><a class="badge badge-neutral min-h-touch px-3 text-body-sm hover:bg-border" href="../components/${u}.html">${defs.find(d => d.slug === u)?.name || u}</a></li>`).join('')}</ul>` : ''}
${s.tiers ? `<h2 class="mt-8 text-h3">Three-tier behaviour</h2><ul class="mt-2 grid list-disc gap-1 pl-5 text-body text-muted-foreground">${s.tiers.map(t => `<li>${t}</li>`).join('')}</ul>` : ''}
<h2 class="mt-8 text-h3">Responsive previews</h2><div class="mt-4">${frameSet(`${s.slug}.html`, s.name)}</div></div>` }));
  }
  write(`styleguide/${kind}/index.html`, shell({ title: kind === 'layouts' ? 'Layouts' : 'Screens', depth: 1, active: kind, body: `<div class="mx-auto max-w-container px-gutter py-6 md:py-10">
<h1 class="text-h1">${kind === 'layouts' ? 'Layout shells' : 'Reference screens'}</h1><p class="mt-2 max-w-prose text-body-lg text-muted-foreground">${kind === 'layouts' ? 'Five shells with phone / tablet / desktop behaviour.' : 'Static, responsive screens built only from the components. Each renders in both brands.'}</p>
<ul class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">${list.map(s => card(`${s.slug}.preview.html`, s.name, s.desc)).join('')}</ul>${list.length ? '' : '<p class="mt-6 text-body text-muted-foreground">Phase 5.</p>'}</div>` }));
}

write('styleguide/index.html', shell({ title: 'Overview', active: 'index.html', body: `<div class="mx-auto max-w-container px-gutter py-6 md:py-10">
<h1 class="text-h1">{{BRAND_NAME}} design system</h1>
<p class="mt-2 max-w-prose text-body-lg text-muted-foreground">White-label, mobile-first marketplace components: storefront, buyer account, seller center, admin moderation and chat. Static HTML + Tailwind v4 + minimal vanilla JS.</p>
<ul class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
${card('foundations.html', 'Foundations', 'Colour with live ratios, type tiers, spacing, radius, elevation, motion, z-index, icons.')}
${card('components/index.html', 'Components', `${defs.length} components in ${groups.length} groups.`)}
${card('layouts/index.html', 'Layouts', `${layouts.length} shells: Public, Account, Seller, Admin, Auth.`)}
${card('screens/index.html', 'Screens', `${screens.length} reference screens in both brands.`)}
</ul>
<h2 class="mt-10 text-h2">All components</h2><div class="mt-4 card p-4">${compNav(groups, null, 'components/').replace('<ul class="grid gap-4">', '<ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">')}</div>
</div>` }));

fs.mkdirSync('dist', { recursive: true }); fs.copyFileSync('src/js/ds.js', 'dist/ds.js');
fs.writeFileSync('docs/components/index.md', `# Components\n\n${groups.map(([g, items]) => `## ${g}\n${items.map(d => `- [${d.name}](${d.slug}.md): ${d.purpose.split('. ')[0].replace(/\.$/, '')}.`).join('\n')}`).join('\n\n')}\n`);
console.log(`styleguide: ${defs.length} component sheets, ${defs.filter(d => d.preview).length} previews, ${layouts.length} layouts, ${screens.length} screens`);
