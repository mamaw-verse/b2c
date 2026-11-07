// Foundations page body, generated from the tokens so lists never drift.
import fs from 'node:fs';
import { collect, media, read } from '../../scripts/lib/css-tokens.mjs';

const css = read('src/tokens.css'); const vars = collect([css], 'default'); const bp = media(css);
const icons = JSON.parse(read('scripts/icons.json'));
const val = (n, key) => (bp[key] && bp[key]['--' + n]) || vars['--' + n];
const sec = (id, title, intro, inner) => `<section id="${id}" class="mb-12 scroll-mt-24">
  <h2 class="text-h2">${title}</h2>
  <p class="mt-1 max-w-prose text-body text-muted-foreground">${intro}</p>
  <div class="mt-4">${inner}</div>
</section>`;

const swatch = (token, fg, bg) => `<li class="card overflow-hidden"><div class="h-14 bg-${token}"></div><div class="p-2">
  <p class="text-label">${token}</p><p class="text-caption text-muted-foreground" data-hex="${token}"></p></div></li>`;
const grid = (items) => `<ul class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">${items.join('')}</ul>`;
const textSwatch = (fgTok, bgTok, need = 4.5) => `<li class="card overflow-hidden bg-${bgTok}"><div class="bg-${bgTok} p-3"><p class="text-h3 text-${fgTok}">Aa ₱1,250</p></div>
  <div class="border-t border-border bg-surface p-2"><p class="text-label">${fgTok}</p><p class="text-caption text-muted-foreground">on ${bgTok}</p>
  <p class="text-caption font-bold text-foreground" data-ratio="${fgTok}|${bgTok}" data-need="${need}"></p></div></li>`;

const scale = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(n => swatch('brand-' + n));
const surfaces = ['background', 'surface', 'surface-subtle', 'surface-muted', 'surface-brand-soft', 'surface-hero', 'surface-cta', 'surface-inverse'].map(t => swatch(t));
const texts = [['foreground', 'surface'], ['muted-foreground', 'surface'], ['muted-foreground', 'background'], ['subtle-foreground', 'surface'], ['subtle-foreground', 'surface-muted'],
  ['primary-foreground', 'primary'], ['primary', 'surface'], ['primary-soft-foreground', 'primary-soft'], ['foreground-inverse', 'surface-inverse'], ['inverse-link', 'surface-inverse'], ['inverse-muted', 'surface-inverse']].map(([f, b]) => textSwatch(f, b));
const fb = ['success', 'warning', 'danger', 'info', 'sale'].map(c => textSwatch(c, c + '-soft'));
const mods = ['pending', 'flagged', 'hidden', 'suspended', 'resolved'].map(s => textSwatch('mod-' + s, 'mod-' + s + '-bg'));
const halalSw = [textSwatch('halal', 'halal-soft'), textSwatch('primary-foreground', 'halal'), textSwatch('halal', 'surface')];
const borders = ['border', 'border-strong', 'border-outline', 'border-control'].map(t => swatch(t));

const tiers = [['display', 'Display'], ['h1', 'Heading 1'], ['h2', 'Heading 2'], ['h3', 'Heading 3'], ['h4', 'Heading 4'], ['body-lg', 'Body large'], ['body', 'Body'], ['body-sm', 'Body small'],
  ['caption', 'Caption'], ['label', 'Label'], ['price', 'Price'], ['price-lg', 'Price large'], ['eyebrow', 'Eyebrow'], ['th', 'Table header']];
const sample = { price: '₱1,250', 'price-lg': '₱1,250', eyebrow: 'New arrivals', th: 'Order total', label: 'Add to cart', caption: '1.2k sold · Cotabato City' };
const type = `<div class="overflow-x-auto" tabindex="0" role="region" aria-label="Type scale by tier"><table class="w-full min-w-[34rem] text-left text-body-sm">
<caption class="sr-only">Type scale by tier</caption>
<thead><tr class="border-b border-border-strong text-th text-muted-foreground"><th scope="col" class="py-2 pr-3">Token</th><th scope="col" class="py-2 pr-3">Phone</th><th scope="col" class="py-2 pr-3">Tablet</th><th scope="col" class="py-2 pr-3">Desktop</th><th scope="col" class="py-2">Live size</th></tr></thead>
<tbody>${tiers.map(([t]) => `<tr data-spec class="border-b border-border align-baseline"><td class="py-2 pr-3 text-${t}" data-sample>${t}</td>
<td class="py-2 pr-3">${vars['--fs-' + t]}</td><td class="py-2 pr-3">${val('fs-' + t, '48rem')}</td><td class="py-2 pr-3">${val('fs-' + t, '64rem')}</td><td class="py-2" data-size></td></tr>`).join('')}</tbody></table></div>
<div class="mt-6 grid gap-4">${tiers.map(([t, l]) => `<div data-spec class="card p-3"><p class="text-caption text-muted-foreground">${l}</p><p data-sample class="text-${t} mt-1 break-words">${sample[t] || 'Fresh dates straight from the importer'}</p></div>`).join('')}</div>`;

const spacing = [1, 2, 3, 4, 6, 8, 12, 16].map(n => `<li class="flex items-center gap-3"><span class="w-24 text-caption text-muted-foreground">${n} = ${n * 4}px</span><span class="h-4 rounded-badge bg-primary" style="width:calc(var(--spacing) * ${n})"></span></li>`).join('');
const radii = ['badge', 'field', 'button', 'search', 'tile', 'card', 'panel', 'hero'].map(r => `<li class="text-center"><div class="h-16 border-2 border-primary bg-primary-soft rounded-${r}"></div><p class="mt-1 text-caption">${r}</p><p class="text-caption text-muted-foreground">${vars['--r-' + r]} (default)</p></li>`);
const shadows = ['card-hover', 'popover', 'sticky', 'sheet'].map(s => `<li class="text-center"><div class="h-16 rounded-card bg-surface shadow-${s}"></div><p class="mt-2 text-caption">${s}</p></li>`);
const motion = `<div class="flex flex-wrap items-center gap-4"><button type="button" data-motion-play class="btn btn-secondary">Play</button><span class="text-body-sm text-muted-foreground">Respects <code>prefers-reduced-motion</code>.</span></div>
<div class="mt-3 space-y-2 overflow-hidden">${[['fast', 'dur-fast'], ['base', 'dur'], ['slow', 'dur-slow']].map(([l, v]) => `<div class="flex items-center gap-3"><span class="w-28 text-caption text-muted-foreground">${l} ${vars['--' + v]}</span><span data-motion-box class="size-6 rounded-badge bg-primary transition-transform" style="transition-duration:var(--${v});transition-timing-function:var(--ease-out)"></span></div>`).join('')}</div>`;
const z = ['header', 'sticky-bar', 'drawer', 'sheet', 'modal', 'toast'].map(n => `<tr class="border-b border-border"><td class="py-2 pr-3 text-label">z-${n}</td><td class="py-2">${vars['--z-' + n]}</td></tr>`).join('');
const iconGrid = `<ul class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">${icons.map(i => `<li class="card flex flex-col items-center gap-1 p-2"><svg class="icon" aria-hidden="true"><use href="#i-${i}"/></svg><span class="break-all text-center text-caption text-muted-foreground">${i}</span></li>`).join('')}</ul>`;
const recipes = `<div class="space-y-4">
  <div class="flex flex-wrap gap-2"><button class="btn">Buy now</button><button class="btn btn-secondary">Add to cart</button><button class="btn btn-outline">Chat</button><button class="btn btn-ghost">Cancel</button><button class="btn btn-danger">Delete</button><button class="btn" disabled>Disabled</button></div>
  <div class="flex flex-wrap gap-2"><button class="btn btn-lg"><svg class="icon" aria-hidden="true"><use href="#i-shopping-cart"/></svg>Place order</button></div>
  <div class="max-w-sm"><label for="demo-field" class="mb-1 block text-label">Mobile number</label><input id="demo-field" class="field" inputmode="tel" placeholder="09XX XXX XXXX"><p class="mt-1 text-caption text-muted-foreground">We only use this for delivery updates.</p></div>
  <div class="flex flex-wrap gap-2"><span class="badge">Verified</span><span class="badge badge-sale">-25%</span><span class="badge badge-success">Delivered</span><span class="badge badge-warning">Pending</span><span class="badge badge-danger">Cancelled</span><span class="badge badge-info">In transit</span><span class="badge badge-halal">Halal certified</span></div>
  <div class="card card-interactive max-w-xs p-3"><p class="text-h4">Product title can run to two lines before it truncates here</p><p class="mt-1 text-price text-sale">₱1,250</p></div></div>`;

const found = [
  sec('colors', 'Colour', 'Swatch hex values and ratios are read live from the active brand. The authoritative, script-generated table is <a class="text-primary underline" href="../docs/contrast.md">docs/contrast.md</a>.',
    `<h3 class="text-h4">Brand scale</h3>${grid(scale)}<h3 class="mt-6 text-h4">Surfaces</h3>${grid(surfaces)}<h3 class="mt-6 text-h4">Text pairs</h3>${grid(texts)}<h3 class="mt-6 text-h4">Feedback</h3>${grid(fb)}<h3 class="mt-6 text-h4">Moderation states</h3>${grid(mods)}<h3 class="mt-6 text-h4">Halal certification</h3>${grid(halalSw)}<h3 class="mt-6 text-h4">Borders</h3>${grid(borders)}`),
  sec('type', 'Typography', 'Manrope variable. Phone sizes are the base; tablet and desktop only enlarge. No text under 12px, no body under 14px on phone.', type),
  sec('spacing', 'Spacing', '4px base (Tailwind default spacing scale).', `<ul class="space-y-2">${spacing}</ul>`),
  sec('radius', 'Radius', 'Each brand sets its own radii; switch the brand to compare (demo uses the round preset).', `<ul class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">${radii.join('')}</ul>`),
  sec('shadow', 'Elevation', 'Tinted with the brand colour.', `<ul class="grid grid-cols-2 gap-4 sm:grid-cols-4">${shadows.join('')}</ul>`),
  sec('motion', 'Motion', '120 / 200 / 320 ms with one easing.', motion),
  sec('z', 'z-index', 'One scale; never use ad-hoc values.', `<table class="text-body-sm"><caption class="sr-only">z-index scale</caption><thead><tr class="text-th text-muted-foreground"><th scope="col" class="py-2 pr-6 text-left">Utility</th><th scope="col" class="py-2 text-left">Value</th></tr></thead><tbody>${z}</tbody></table>`),
  sec('icons', 'Icons', 'Lucide, inlined as an SVG sprite (<code>&lt;use href="#i-name"&gt;</code>). Replaceable: swap <code>scripts/icons.json</code>.', iconGrid),
  sec('recipes', 'Component recipes', 'The only <code>@layer components</code> classes: button, field, badge, card.', recipes),
].join('\n');


export const foundationsBody = `<div class="mx-auto max-w-container px-gutter py-6 md:py-10"><h1 class="text-h1">Foundations</h1>
<p class="mt-2 max-w-prose text-body-lg text-muted-foreground">Tokens rendered live. Use the brand switcher to check both brands.</p>
<div class="mt-8">${found}</div></div>`;
