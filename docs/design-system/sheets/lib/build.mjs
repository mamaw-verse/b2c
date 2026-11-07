// Sheet generator: one data definition -> HTML sheet (12 fixed sections), preview page, and Markdown doc.
import fs from 'node:fs';
import { esc, cx, icon } from '../ui/core.mjs';
import { toaster } from '../ui/feedback.mjs';

export const STATES = [['default', 'Default'], ['hover', 'Hover (pointer only)'], ['pressed', 'Pressed'], ['focus', 'Focus-visible'], ['disabled', 'Disabled'], ['loading', 'Loading'], ['error', 'Error'], ['selected', 'Selected'], ['empty', 'Empty'], ['skeleton', 'Skeleton']];
export const SECTIONS = ['Purpose', 'Anatomy', 'Variants and sizes', 'States', 'Responsive behaviour', 'API / props', 'Accessibility', 'Tokens used', 'Content rules', 'Do / Don’t', 'HTML usage', 'Test notes'];
const A11Y = [['role', 'Role'], ['name', 'Accessible name'], ['keyboard', 'Keyboard'], ['focus', 'Focus management'], ['aria', 'ARIA'], ['touch', 'Touch target'], ['motion', 'Reduced motion'], ['announce', 'Announcements']];
const A11Y_DEFAULTS = { touch: '44px minimum (`min-h-touch`); primary actions 48px.', motion: 'Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`.', announce: 'None (static content).', focus: 'Follows DOM order; no focus is moved programmatically.' };

/* ------------------------------------------------------------ id + state helpers */
const REF_ATTRS = 'id|for|name|aria-controls|aria-describedby|aria-labelledby|aria-activedescendant|aria-owns|popovertarget|data-ds-open|data-ds-counter|data-ds-reveal|data-ds-infinite|data-ds-composer|href';
/** Suffix every id defined in a chunk (and its references) so a chunk can render many times on one page. */
export function uniq(html, sfx) {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  return html.replace(new RegExp(`(\\s(?:${REF_ATTRS}))="([^"]*)"`, 'g'), (m, a, v) => {
    const attr = a.trim();
    if (attr === 'href') return v.startsWith('#') && ids.has(v.slice(1)) ? `${a}="#${v.slice(1)}${sfx}"` : m;
    if (attr === 'name') return `${a}="${v}${sfx}"`;
    return `${a}="${v.split(/\s+/).map(t => ids.has(t) ? t + sfx : t).join(' ')}"`;
  });
}
/** Force a visual state on the target element (data-sg-target, else first interactive element). */
export function force(html, state) {
  const v = { hover: 'hover', pressed: 'pressed', focus: 'focus' }[state];
  const re = html.includes('data-sg-target') ? /<([a-z]+)([^>]*?)\sdata-sg-target/ : /<(button|a|input|select|textarea|summary)(\s)/;
  return html.replace(re, (m, tag, rest) => html.includes('data-sg-target') ? `<${tag}${rest} data-force="${v}"` : `<${tag} data-force="${v}"${rest}`);
}

/* ------------------------------------------------------------ tokens used */
const tokensCss = fs.readFileSync('src/tokens.css', 'utf8') + fs.readFileSync('src/components.css', 'utf8');
const theme = tokensCss.match(/@theme inline\s*{([\s\S]*?)\n}/)[1];
const colorTokens = new Set([...theme.matchAll(/--color-([\w-]+):/g)].map(m => m[1]));
const textTokens = new Set([...theme.matchAll(/--text-([\w-]+?):/g)].map(m => m[1]).filter(n => !n.includes('--')));
const radiusTokens = new Set([...theme.matchAll(/--radius-([\w-]+):/g)].map(m => m[1]));
const shadowTokens = new Set([...theme.matchAll(/--shadow-([\w-]+):/g)].map(m => m[1]));
const recipes = {};
for (const m of fs.readFileSync('src/components.css', 'utf8').matchAll(/\.([\w-]+)(?:[:\[.][^{]*)?\s*{\s*([^}]*)}/g)) {
  const applied = [...m[2].matchAll(/@apply ([^;]+);/g)].flatMap(a => a[1].split(/\s+/));
  const raw = [...m[2].matchAll(/var\((--[\w-]+)\)/g)].map(v => '!' + v[1]);
  (recipes[m[1]] ??= []).push(...applied, ...raw);
}
const special = { 'min-h-touch': '--touch-min', 'min-w-touch': '--touch-min', 'min-h-touch-primary': '--touch-primary', 'min-w-touch-primary': '--touch-primary', 'h-header': '--header-h', 'px-gutter': '--gutter', 'pb-tabbar': '--tabbar-h', 'max-w-container': '--container-max', 'duration-token': '--dur, --ease-out', 'pt-safe': 'safe-area-inset-top', 'pb-safe': 'safe-area-inset-bottom' };
function tokenFor(cls, out) {
  if (cls.startsWith('!')) { out.add(cls.slice(1)); return; }
  const base = cls.split(':').pop().replace(/^!/, '').replace(/\/\d+$/, '');
  if (special[base]) { special[base].split(', ').forEach(t => out.add(t)); return; }
  if (/^z-(header|sticky-bar|drawer|sheet|modal|toast)$/.test(base)) { out.add('--' + base); return; }
  let m = base.match(/^(?:bg|text|border(?:-[xytblrse])?|ring|outline|fill|stroke|accent|placeholder|divide|decoration|caret|from|to|via)-(.+)$/);
  if (m && colorTokens.has(m[1])) { out.add('--' + m[1]); return; }
  m = base.match(/^text-(.+)$/); if (m && textTokens.has(m[1])) { out.add('--fs-' + m[1]); return; }
  m = base.match(/^rounded(?:-[trblse]{1,2})?-(.+)$/); if (m && radiusTokens.has(m[1])) { out.add('--r-' + m[1]); return; }
  m = base.match(/^shadow-(.+)$/); if (m && shadowTokens.has(m[1])) out.add('--elevation-' + m[1]);
}
export function tokensUsed(html) {
  const out = new Set(), seen = new Set();
  const walk = (c) => { if (seen.has(c)) return; seen.add(c); if (recipes[c]) recipes[c].forEach(walk); tokenFor(c, out); };
  for (const m of html.matchAll(/\sclass="([^"]*)"/g)) m[1].split(/\s+/).filter(Boolean).forEach(walk);
  if (/<svg class="icon/.test(html)) out.add('currentColor (icons)');
  if (/outline|focus-visible|<button|<a |<input|focus-ring/.test(html)) { out.add('--focus-ring-width'); out.add('--focus-ring-offset'); out.add('--focus-ring-color'); }
  return [...out].sort();
}

/* ------------------------------------------------------------ snippet pretty-printer */
const BLOCK = new Set('div section nav header footer main aside form fieldset legend ul ol li dl dt dd table caption thead tbody tr th td p h1 h2 h3 h4 h5 h6 dialog details summary article label template button select textarea option'.split(' '));
export function pretty(html) {
  html = html.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
  let out = '', depth = 0, lastBlockClose = false; const stack = [];
  for (const [tok, close, tag] of html.matchAll(/<(\/?)([a-z0-9-]+)[^>]*>|[^<]+/g)) {
    const t = tag && tag.toLowerCase();
    if (t && BLOCK.has(t) && !close && !/\/>$/.test(tok)) { out += (out ? '\n' : '') + '  '.repeat(depth) + tok; stack.push(false); depth++; lastBlockClose = false; }
    else if (t && BLOCK.has(t) && close) { depth--; const hadBlock = stack.pop(); out += (hadBlock || lastBlockClose ? '\n' + '  '.repeat(depth) : '') + tok; if (stack.length) stack[stack.length - 1] = true; lastBlockClose = true; }
    else { if (lastBlockClose) { out += '\n' + '  '.repeat(depth); lastBlockClose = false; } out += tok; }
  }
  return out.replace(/<svg aria-hidden="true" class="absolute[\s\S]*?<\/svg>/, '');
}

/* ------------------------------------------------------------ page shell */
const sprite = () => fs.readFileSync('icons/sprite.svg', 'utf8').replace('<svg ', '<svg aria-hidden="true" class="absolute size-0 overflow-hidden" ').trim();
export const TOPNAV = [['index.html', 'Overview'], ['foundations.html', 'Foundations'], ['focus.html', 'Focus'], ['components/index.html', 'Components'], ['layouts/index.html', 'Layouts'], ['screens/index.html', 'Screens']];
export function shell({ title, depth = 0, active, body, bare = false, main = true, bodyCls = '' }) {
  const up = '../'.repeat(depth);
  const chrome = bare ? '' : `<a href="#main" class="fixed left-2 top-2 z-toast flex min-h-touch -translate-y-24 items-center rounded-button bg-primary px-4 text-label text-primary-foreground focus:translate-y-0">Skip to content</a>
<header class="sticky top-0 z-header border-b border-border bg-surface pt-safe">
  <div class="mx-auto flex max-w-container flex-wrap items-center gap-x-4 gap-y-1 px-gutter py-1 md:h-header md:flex-nowrap md:py-0">
    <a href="${up}index.html" class="flex min-h-touch items-center text-h4 text-primary">{{BRAND_NAME}} <span class="ml-1 font-normal text-muted-foreground">DS</span></a>
    <nav aria-label="Styleguide" class="order-3 -mx-1 flex w-[calc(100%+.5rem)] gap-1 overflow-x-auto md:order-none md:mx-0 md:w-auto">
      ${TOPNAV.map(([h, l]) => `<a href="${up}${h}"${h.split('/')[0] === active ? ' aria-current="page"' : ''} class="flex min-h-touch items-center whitespace-nowrap rounded-button px-3 text-label text-muted-foreground hover:bg-surface-muted aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary-soft-foreground">${l}</a>`).join('')}
    </nav>
    <div role="group" aria-label="Brand" class="ml-auto flex gap-1 rounded-button bg-surface-muted p-1">
      ${['default', 'demo'].map(b => `<button type="button" data-brand-btn="${b}" aria-pressed="${b === 'default'}" class="min-h-9 rounded-button px-3 text-label text-muted-foreground aria-pressed:bg-surface aria-pressed:text-foreground aria-pressed:shadow-card-hover relative after:absolute after:inset-x-0 after:-inset-y-1">${b === 'default' ? 'Default' : 'Demo'}</button>`).join('')}
    </div>
  </div>
</header>`;
  return `<!doctype html>
<html lang="en" data-brand="default">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title} | {{BRAND_NAME}} design system</title>
<link rel="stylesheet" href="${up}../dist/styles.css">
<script src="${up}assets/sg.js"></script>
</head>
<body class="${cx('bg-background text-body text-foreground antialiased', bodyCls)}">
${sprite()}
${chrome}
${main ? `<main id="main">${body}</main>` : body}
${toaster()}
<script src="${up}../dist/ds.js" defer></script>
</body>
</html>
`;
}

/* ------------------------------------------------------------ sheet */
const h2 = (n, extra = '') => `<h2 id="s${n}" class="scroll-mt-24 text-h2">${n}. ${SECTIONS[n - 1]}${extra}</h2>`;
const list = (items, cls = '') => `<ul class="${cx('grid list-disc gap-1.5 pl-5 text-body text-muted-foreground marker:text-border-control', cls)}">${items.map(i => `<li>${md2html(i)}</li>`).join('')}</ul>`;
const table = (head, rows, caption) => `<div class="grid gap-2 md:hidden">${rows.map(r => `<div class="card grid gap-1 p-3"><p class="text-label text-foreground">${md2html(r[0])}</p><dl class="grid gap-1">${r.slice(1).map((c, i) => c === '' || c == null ? '' : `<div class="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2 text-body-sm"><dt class="text-muted-foreground">${head[i + 1]}</dt><dd class="min-w-0 break-words text-foreground">${md2html(c)}</dd></div>`).join('')}</dl></div>`).join('')}</div>
<div tabindex="0" role="region" aria-label="${esc(caption)}" class="hidden overflow-x-auto rounded-panel border border-border bg-surface md:block"><table class="w-full text-left text-body-sm"><caption class="sr-only">${caption}</caption><thead class="bg-surface-subtle"><tr>${head.map(h => `<th scope="col" class="border-b border-border px-3 py-2 text-th uppercase text-muted-foreground">${h}</th>`).join('')}</tr></thead><tbody class="divide-y divide-border">${rows.map(r => `<tr>${r.map((c, i) => `<td class="px-3 py-2 align-top ${i === 0 ? 'font-bold text-foreground' : 'text-muted-foreground'}">${md2html(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
export const md2html = (s) => String(s ?? '').replace(/`([^`]+)`/g, (_, c) => `<code class="rounded-badge bg-surface-muted px-1 py-px text-foreground [overflow-wrap:anywhere]">${esc(c)}</code>`).replace(/\*\*([^*]+)\*\*/g, '<strong class="text-foreground">$1</strong>');
const frames = (src, name, { height, fixed } = {}) => `<div class="grid gap-6">${[360, 768, 1280].map(w => `<figure class="grid gap-2">
  <figcaption class="text-label text-muted-foreground">${w}px ${w === 360 ? '(phone)' : w === 768 ? '(tablet)' : '(desktop)'}</figcaption>
  <div class="overflow-hidden rounded-panel border border-border-strong bg-surface" data-sg-frame style="max-width:${w}px"><iframe src="${src}" width="${w}" height="${height[w] || height}" title="${esc(name)} at ${w}px" class="origin-top-left border-0" loading="lazy" data-sg-follow${fixed ? '' : ' data-sg-autoheight data-sg-max="' + (height[w] || height) + '"'}></iframe></div>
</figure>`).join('')}</div>`;

export function cell(label, html, { cls = '', na } = {}) {
  return `<div class="grid min-w-0 grid-cols-1 content-start gap-2" data-sg-cell><p class="text-eyebrow uppercase text-muted-foreground">${label}</p>
  <div class="${cx('min-h-16 min-w-0 overflow-x-auto rounded-panel border p-3', na ? 'grid place-items-center border-dashed border-border-strong bg-surface-subtle' : 'border-border bg-surface', cls)}">${na ? `<p class="text-center text-body-sm text-muted-foreground">${md2html(na)}</p>` : html}</div></div>`;
}

export function renderSheet(d, all, groups) {
  const states = STATES.map(([k, label], i) => {
    let v = d.states?.[k];
    if (v === 'auto') v = force(d.states.default, k);
    if (v == null) v = { na: (d.na && d.na[k]) || 'Not applicable to this component.' };
    if (typeof v === 'object') return cell(label, '', { na: v.na });
    return cell(label, uniq(v, `-s${i}`), { cls: d.cellCls });
  }).join('');
  const a11y = A11Y.map(([k, l]) => `<div class="grid gap-1 border-b border-border py-2 last:border-0 sm:grid-cols-[11rem_1fr] sm:gap-4"><dt class="text-label text-foreground">${l}</dt><dd class="text-body text-muted-foreground">${md2html(d.a11y?.[k] || A11Y_DEFAULTS[k] || '—')}</dd></div>`).join('');
  const toks = tokensUsed([d.example, d.gallery, ...Object.values(d.states || {}).filter(s => typeof s === 'string')].join(' '));
  const nav = compNav(groups, d.slug);
  const pv = d.preview ? frames(`../previews/${d.slug}.html`, d.name, { height: d.preview.height || { 360: 640, 768: 640, 1280: 560 }, fixed: d.preview.fixed }) : '';
  const body = `<div class="mx-auto max-w-container px-gutter lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
  <aside class="sticky top-[var(--header-h)] hidden max-h-[calc(100dvh-var(--header-h))] overflow-y-auto py-6 lg:block">${nav}</aside>
  <div class="min-w-0 py-6 md:py-8">
    <details class="card mb-6 lg:hidden"><summary class="flex min-h-touch-primary items-center justify-between px-4 text-label">Browse components ${icon('chevron-down', 'text-muted-foreground')}</summary><div class="border-t border-border p-2">${nav}</div></details>
    <p class="text-eyebrow uppercase text-primary">${d.group} · Phase ${d.phase}</p>
    <h1 class="mt-1 text-h1">${d.name}</h1>
    <p class="mt-2 max-w-prose text-body-lg text-muted-foreground">${md2html(d.purpose)}</p>
    <nav aria-label="On this page" class="mt-4 flex flex-wrap gap-x-1 gap-y-0 text-body-sm">${SECTIONS.map((s, i) => `<a href="#s${i + 1}" class="inline-flex min-h-touch items-center rounded-button px-2 text-muted-foreground hover:bg-surface-muted hover:text-foreground">${i + 1}. ${s}</a>`).join('')}</nav>
    <div class="mt-8 grid grid-cols-1 gap-12">
      <section aria-labelledby="s1" class="grid min-w-0 grid-cols-1 gap-4">${h2(1)}<div class="grid gap-4 md:grid-cols-2"><div class="grid content-start gap-2"><h3 class="text-h4">Use when</h3>${list(d.use)}</div><div class="grid content-start gap-2"><h3 class="text-h4">Don’t use when</h3>${list(d.avoid)}</div></div></section>
      <section aria-labelledby="s2" class="grid min-w-0 grid-cols-1 gap-4">${h2(2)}<ol class="grid list-decimal gap-1.5 pl-5 text-body text-muted-foreground marker:font-bold marker:text-primary">${d.anatomy.map(a => `<li>${md2html(a)}</li>`).join('')}</ol></section>
      <section aria-labelledby="s3" class="grid min-w-0 grid-cols-1 gap-4">${h2(3)}${table(['Variant / size', 'Markup / prop', 'Use for'], d.variants, `${d.name} variants`)}
        <div class="${cx('min-w-0 overflow-x-auto rounded-panel border border-border p-4', d.galleryCls || 'bg-surface')}">${uniq(d.gallery || d.example, '-g')}</div></section>
      <section aria-labelledby="s4" class="grid min-w-0 grid-cols-1 gap-4">${h2(4)}<p class="text-body text-muted-foreground">Rendered live. Hover, pressed and focus-visible are forced with the styleguide-only <code class="rounded-badge bg-surface-muted px-1 text-foreground">data-force</code> hook.</p><div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">${states}</div></section>
      <section aria-labelledby="s5" class="grid min-w-0 grid-cols-1 gap-4">${h2(5)}${table(['Tier', 'Behaviour'], [['Phone (base, 360px+)', d.responsive[0]], ['Tablet (`md:` 768px+)', d.responsive[1]], ['Desktop (`lg:` 1024px+)', d.responsive[2]]], 'Responsive behaviour')}${pv}</section>
      <section aria-labelledby="s6" class="grid min-w-0 grid-cols-1 gap-4">${h2(6)}<p class="text-body text-muted-foreground">Intended props for the ported Blade / React / Vue component.</p>${table(['Prop', 'Type', 'Default', 'Notes'], d.props, `${d.name} props`)}</section>
      <section aria-labelledby="s7" class="grid min-w-0 grid-cols-1 gap-4">${h2(7)}<dl class="card px-4 py-2">${a11y}</dl></section>
      <section aria-labelledby="s8" class="grid min-w-0 grid-cols-1 gap-4">${h2(8)}<p class="text-body text-muted-foreground">Extracted from the rendered markup by the generator (semantic tokens only).</p><ul class="flex flex-wrap gap-2">${toks.map(t => `<li class="rounded-badge bg-surface-muted px-2 py-1 font-mono text-body-sm text-foreground">${t}</li>`).join('')}</ul></section>
      <section aria-labelledby="s9" class="grid min-w-0 grid-cols-1 gap-4">${h2(9)}${list(d.content)}</section>
      <section aria-labelledby="s10" class="grid min-w-0 grid-cols-1 gap-4">${h2(10)}<div class="grid gap-4 md:grid-cols-2"><div class="rounded-panel border-l-4 border-success bg-surface p-4"><h3 class="flex items-center gap-2 text-h4 text-success">${icon('circle-check')}Do</h3><div class="mt-2">${list(d.do)}</div></div><div class="rounded-panel border-l-4 border-danger bg-surface p-4"><h3 class="flex items-center gap-2 text-h4 text-danger">${icon('ban')}Don’t</h3><div class="mt-2">${list(d.dont)}</div></div></div></section>
      <section aria-labelledby="s11" class="grid min-w-0 grid-cols-1 gap-4">${h2(11)}<pre class="max-h-[32rem] overflow-auto rounded-panel bg-surface-inverse p-4 text-body-sm text-foreground-inverse on-inverse" tabindex="0" aria-label="${esc(d.name)} HTML"><code>${esc(pretty(d.snippet || d.example))}</code></pre></section>
      <section aria-labelledby="s12" class="grid min-w-0 grid-cols-1 gap-4">${h2(12)}${list(d.tests)}</section>
    </div>
    ${pager(all, d)}
  </div>
</div>`;
  return shell({ title: d.name, depth: 1, active: 'components', body });
}

function pager(all, d) {
  const i = all.indexOf(d), p = all[i - 1], n = all[i + 1];
  const a = (c, dir) => `<a href="${c.slug}.html" class="card card-interactive flex min-h-touch-primary min-w-0 flex-1 flex-col justify-center gap-0.5 p-3 ${dir === 'next' ? 'items-end text-right' : ''}"><span class="text-caption text-muted-foreground">${dir === 'next' ? 'Next' : 'Previous'}</span><span class="text-label">${c.name}</span></a>`;
  return `<nav aria-label="Previous and next component" class="mt-12 flex gap-3 border-t border-border pt-6">${p ? a(p, 'prev') : '<span class="flex-1"></span>'}${n ? a(n, 'next') : '<span class="flex-1"></span>'}</nav>`;
}
export function compNav(groups, current, prefix = '') {
  return `<nav aria-label="Components"><ul class="grid gap-4">${groups.map(([g, items]) => `<li><p class="px-2 text-eyebrow uppercase text-muted-foreground">${g}</p><ul class="mt-1 grid">${items.map(c => `<li><a href="${prefix}${c.slug}.html" class="flex min-h-touch items-center rounded-button px-2 text-body-sm ${c.slug === current ? 'bg-primary-soft font-bold text-primary-soft-foreground' : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground'}"${c.slug === current ? ' aria-current="page"' : ''}>${c.name}</a></li>`).join('')}</ul></li>`).join('')}</ul></nav>`;
}

export function renderPreview(d) {
  const p = typeof d.preview === 'object' && d.preview.html ? d.preview.html : `<div class="mx-auto max-w-container p-gutter">${d.example}</div>`;
  return shell({ title: `${d.name} preview`, depth: 1, bare: true, body: `<h1 class="sr-only">${d.name} preview</h1><h2 class="sr-only">Examples</h2>` + p, bodyCls: d.preview?.bodyCls });
}

/* ------------------------------------------------------------ markdown */
const plain = (s) => String(s ?? '').replace(/<code[^>]*>([\s\S]*?)<\/code>/g, '`$1`').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const mdTable = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map(r => `| ${r.map(c => plain(c).replace(/\|/g, '\\|')).join(' | ')} |`).join('\n')}\n`;
export function renderMd(d) {
  const st = STATES.map(([k, l]) => { const v = d.states?.[k]; return [l, v == null ? `n/a: ${(d.na && d.na[k]) || 'not applicable'}` : typeof v === 'object' ? `n/a: ${v.na}` : 'rendered']; });
  const a11y = A11Y.map(([k, l]) => [l, d.a11y?.[k] || A11Y_DEFAULTS[k] || '—']);
  return `# ${d.name}

${d.group} · Phase ${d.phase} · Live sheet: \`styleguide/components/${d.slug}.html\`

## 1. Purpose
${plain(d.purpose)}

**Use when**
${d.use.map(u => `- ${plain(u)}`).join('\n')}

**Don't use when**
${d.avoid.map(u => `- ${plain(u)}`).join('\n')}

## 2. Anatomy
${d.anatomy.map((a, i) => `${i + 1}. ${plain(a)}`).join('\n')}

## 3. Variants and sizes
${mdTable(['Variant / size', 'Markup / prop', 'Use for'], d.variants)}
## 4. States
${mdTable(['State', 'Status'], st)}
## 5. Responsive behaviour
${mdTable(['Tier', 'Behaviour'], [['Phone (base, 360px+)', d.responsive[0]], ['Tablet (md, 768px+)', d.responsive[1]], ['Desktop (lg, 1024px+)', d.responsive[2]]])}
## 6. API / props
${mdTable(['Prop', 'Type', 'Default', 'Notes'], d.props)}
## 7. Accessibility
${mdTable(['Aspect', 'Requirement'], a11y)}
## 8. Tokens used
${tokensUsed([d.example, d.gallery, ...Object.values(d.states || {}).filter(s => typeof s === 'string')].join(' ')).map(t => `\`${t}\``).join(', ')}

## 9. Content rules
${d.content.map(u => `- ${plain(u)}`).join('\n')}

## 10. Do / Don't
**Do**
${d.do.map(u => `- ${plain(u)}`).join('\n')}

**Don't**
${d.dont.map(u => `- ${plain(u)}`).join('\n')}

## 11. HTML usage
\`\`\`html
${pretty(d.snippet || d.example)}
\`\`\`

## 12. Test notes
${d.tests.map(u => `- ${plain(u)}`).join('\n')}
`;
}
