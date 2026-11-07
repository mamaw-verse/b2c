import { cx, icon, iconBtn, btn, badge, media, peso, esc } from './core.mjs';
import { formField, textInput, textarea, select, switchCtl, combobox, uploader, check, fieldset } from './forms.mjs';
import { halalBadge } from './halal.mjs';
import { segmented } from './nav.mjs';

/** TaskCard: count + label shortcut on the seller dashboard to-do list. */
export const taskCard = ({ count, label, ic = 'package', tone = 'text-primary', urgent }) =>
  `<a href="#" class="card card-interactive flex min-h-touch-primary items-center gap-3 p-3 hover:border-border-outline">
  <span class="grid size-10 shrink-0 place-items-center rounded-tile ${urgent ? 'bg-sale-soft text-sale' : 'bg-primary-soft ' + tone}">${icon(ic)}</span>
  <span class="grid min-w-0 flex-1"><span class="text-h3 tabular">${count}</span><span class="text-body-sm text-muted-foreground">${label}</span></span>
  ${icon('chevron-right', 'text-muted-foreground')}
</a>`;
export const taskGrid = (tasks) => `<ul class="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">${tasks.map(t => `<li>${taskCard(t)}</li>`).join('')}</ul>`;
export const tasks = [{ count: 4, label: 'To ship', ic: 'package' }, { count: 2, label: 'Ship today', ic: 'alarm-clock', urgent: true }, { count: 1, label: 'Return requests', ic: 'undo-2' }, { count: 3, label: 'Unread chats', ic: 'message-circle' }, { count: 1, label: 'Needs changes', ic: 'triangle-alert', urgent: true }, { count: 6, label: 'Low stock', ic: 'boxes' }];

/** OrderRow: seller order list item; card on phone, row on md+. */
export function orderRow({ id = '#240311-0042', buyer = 'Maria Santos', items = 2, total = 1438, status = 'To ship', due = 'Ship by today, 6 PM', urgent = true, pay = 'GCash', i = 0, select = true, n = 0 }) {
  return `<li class="relative grid gap-3 bg-surface p-3 md:grid-cols-[auto_4rem_minmax(0,1.5fr)_minmax(0,1fr)_auto_auto] md:items-center md:gap-4 md:px-4 has-[:checked]:bg-primary-soft">
  ${select ? `<label class="absolute right-2 top-2 grid size-11 place-items-center md:static"><input type="checkbox" class="size-5 accent-primary" data-ds-bulk-item><span class="sr-only">Select order ${id}</span></label>` : ''}
  <div class="flex gap-3 md:contents">
    <div class="w-14 shrink-0 overflow-hidden rounded-tile md:w-16">${media('Order items', { i, ic: 'package', decorative: true })}</div>
    <div class="grid min-w-0 gap-0.5 pr-10 md:pr-0"><p class="text-label"><a href="#" class="text-primary underline">${id}</a></p><p class="truncate text-body-sm text-muted-foreground">${buyer} · ${items} item${items > 1 ? 's' : ''} · ${pay}</p></div>
  </div>
  <div class="flex flex-wrap items-center justify-between gap-2 md:contents">
    <p class="flex items-center gap-1 text-body-sm ${urgent ? 'font-bold text-sale' : 'text-muted-foreground'}">${icon('clock', 'size-4')}${due}</p>
    <p class="text-price text-foreground tabular md:text-right">${peso(total)}</p>
  </div>
  <div class="flex gap-2 md:justify-end">${badge(status, status === 'To ship' ? 'warning' : status === 'Shipped' ? 'info' : 'success', { cls: 'self-center md:hidden' })}<span class="flex-1 md:hidden"></span>${status === 'To ship' ? btn('Arrange shipment', { size: 'sm' }) : btn('Track', { size: 'sm', variant: 'neutral' })}</div>
</li>`;
}
export const orderList = (rows) => `<div data-ds-bulk><ul class="divide-y divide-border overflow-hidden rounded-panel border border-border">${rows.map((r, n) => orderRow({ ...r, i: n })).join('')}</ul></div>`;

/** OrderActionBar: order detail actions; sticky bar on phone, inline row on desktop. */
export const orderActionBar = ({ fixed = true } = {}) => `<div class="${fixed ? 'fixed inset-x-0 bottom-0 z-sticky-bar' : 'relative'} border-t border-border bg-surface shadow-sticky pb-safe lg:static lg:rounded-panel lg:border lg:shadow-none lg:pb-0">
  <div class="flex gap-2 px-gutter py-2 lg:justify-end lg:px-4 lg:py-3">${iconBtn('message-circle', 'Chat with buyer', { variant: 'neutral' })}${btn('Print waybill', { variant: 'neutral', icon: 'printer', cls: 'flex-1 lg:flex-none' })}${btn('Arrange shipment', { size: 'lg', cls: 'flex-1 lg:flex-none' })}</div>
</div>`;

/** ProductForm section: titled panel with fields. */
export const formSection = ({ id, title, desc, body, status }) => `<section class="panel" aria-labelledby="${id}">
  <header class="flex items-start justify-between gap-3 border-b border-border px-4 py-3"><div><h2 id="${id}" class="text-h4">${title}</h2>${desc ? `<p class="text-body-sm text-muted-foreground">${desc}</p>` : ''}</div>${status || ''}</header>
  <div class="grid gap-4 p-4">${body}</div>
</section>`;
export const productFormSections = (id = 'pf') => [
  formSection({ id: `${id}-basic`, title: 'Basic information', status: badge('Complete', 'success', { icon: 'check' }), body: `${formField({ id: `${id}-name`, label: 'Product name', required: true, counter: '38 / 120', help: 'Brand, model and key feature. No emojis or ALL CAPS.', control: textInput({ id: `${id}-name`, value: 'Ajwa dates 500g, premium grade', maxlength: 120, help: true, counter: true }) })}
    ${combobox({ id: `${id}-cat`, label: 'Category', required: true, value: 'Halal Food › Dates & Sweets › Dates', options: ['Halal Food › Dates & Sweets › Dates', 'Halal Food › Pantry › Spreads'] })}
    ${formField({ id: `${id}-desc`, label: 'Description', required: true, counter: '212 / 3000', control: textarea({ id: `${id}-desc`, value: 'Premium Ajwa dates, soft and moist. Packed in a resealable tub. No added sugar or preservatives.', maxlength: 3000, rows: 5, counter: true }) })}` }),
  formSection({ id: `${id}-halal`, title: 'Halal information', desc: 'Required for food, drinks, supplements and cosmetics. Buyers see the certifier and expiry date.', status: halalBadge({ status: 'review', short: true }), body: `${fieldset({ legend: 'Halal status', children: `${check({ id: `${id}-hs1`, name: `${id}-hs`, type: 'radio', label: 'Halal certified', desc: 'I have a valid certificate that covers this product.', checked: true })}${check({ id: `${id}-hs2`, name: `${id}-hs`, type: 'radio', label: 'Not food or ingestible', desc: 'Modest fashion, prayer items, books. No certificate needed.' })}` })}
    <div class="grid gap-4 md:grid-cols-2">${combobox({ id: `${id}-body`, label: 'Certifying body', required: true, value: 'Islamic Da’wah Council of the Philippines (IDCP)', options: ['Islamic Da’wah Council of the Philippines (IDCP)', 'Halal Development Institute of the Philippines (HDIP)', 'Mindanao Halal Authority (MinHA)'] })}${formField({ id: `${id}-cno`, label: 'Certificate number', required: true, control: textInput({ id: `${id}-cno`, value: 'HC-2026-00481', inputmode: 'text' }) })}</div>
    <div class="grid gap-4 md:grid-cols-2">${formField({ id: `${id}-exp`, label: 'Valid until', required: true, help: 'We hide halal listings the day after this date.', control: textInput({ id: `${id}-exp`, type: 'date', value: '2028-03-14', help: true }) })}
      <div class="grid content-start gap-1"><p class="text-label" id="${id}-cert-l">Certificate file</p><div class="flex min-h-touch items-center gap-2 rounded-field border border-border-control bg-surface px-3" role="group" aria-labelledby="${id}-cert-l">${icon('file-text', 'text-muted-foreground')}<span class="min-w-0 flex-1 truncate text-body">IDCP-certificate.pdf</span><button type="button" class="btn btn-ghost btn-sm">Replace</button></div><p class="text-body-sm text-muted-foreground">PDF or photo, up to 10 MB. Reviewed within 1 business day.</p></div></div>
    ${formField({ id: `${id}-ing`, label: 'Ingredients', required: true, help: 'List every ingredient, including additives, gelatin, enzymes and flavourings.', control: textarea({ id: `${id}-ing`, value: 'Ajwa dates (100%).', rows: 3, help: true }) })}
    ${check({ id: `${id}-decl`, label: 'I confirm this product contains no pork, alcohol or their derivatives.', checked: true, cls: 'rounded-panel bg-halal-soft px-3' })}` }),
  formSection({ id: `${id}-media`, title: 'Media', desc: 'Up to 9 photos. The first is the cover.', body: uploader({ id: `${id}-photos`, label: 'Product photos', tiles: [{ name: 'Cover.jpg' }, { name: 'Side.jpg' }, { name: 'Lid.jpg', progress: 70 }] }) }),
  formSection({ id: `${id}-sales`, title: 'Sales information', body: `${switchCtl({ id: `${id}-hasvar`, label: 'This product has variations', desc: 'Colors, sizes, flavors.', checked: true })}<p class="text-body-sm text-muted-foreground">Set price and stock per variation in the table below.</p>` }),
  formSection({ id: `${id}-ship`, title: 'Shipping', status: badge('1 issue', 'danger', { icon: 'circle-alert' }), body: `<div class="grid gap-4 md:grid-cols-4">${formField({ id: `${id}-w`, label: 'Weight', required: true, error: 'Enter the packed weight.', control: textInput({ id: `${id}-w`, inputmode: 'decimal', error: true, suffix: '<span class="pr-3 text-body text-muted-foreground">kg</span>' }) })}${['Length', 'Width', 'Height'].map(d => formField({ id: `${id}-${d[0]}`, label: d, optional: true, control: textInput({ id: `${id}-${d[0]}`, inputmode: 'decimal', value: d === 'Height' ? '24' : '9', suffix: '<span class="pr-3 text-body text-muted-foreground">cm</span>' }) })).join('')}</div>` }),
];
export const productFormBar = ({ fixed = true } = {}) => `<div class="${fixed ? 'fixed inset-x-0 bottom-0 z-sticky-bar lg:left-[var(--sidebar-w)]' : 'relative'} border-t border-border bg-surface shadow-sticky pb-safe"><div class="mx-auto flex max-w-container items-center gap-2 px-gutter py-2"><p class="hidden flex-1 text-body-sm text-muted-foreground md:block">Draft saved 2 min ago</p>${btn('Save draft', { variant: 'neutral', size: 'lg', cls: 'flex-1 md:flex-none' })}${btn('Publish', { size: 'lg', cls: 'flex-1 md:flex-none' })}</div></div>`;

/** VariantMatrix: define options, then price/stock/SKU per combination. Table on md+, cards on phone. */
export function variantMatrix({ id = 'vm', error } = {}) {
  const combos = [['Premium', '250g', 349, 20], ['Premium', '500g', 649, 42], ['Standard', '250g', 249, 0], ['Standard', '500g', 449, 15]];
  const opt = (name, values) => `<div class="grid gap-2"><p class="text-label">${name}</p><ul class="flex flex-wrap gap-2">${values.map(v => `<li class="inline-flex items-center gap-1 rounded-button border border-border-control bg-surface pl-3 text-body">${v}<button type="button" class="btn btn-ghost btn-icon btn-sm text-muted-foreground" aria-label="Remove ${v}">${icon('x', 'size-4')}</button></li>`).join('')}<li>${btn('Add', { variant: 'outline', icon: 'plus', size: 'sm' })}</li></ul></div>`;
  const cell = (n, k, v, label, prefix) => `<label class="sr-only" for="${id}-${k}-${n}">${label}</label><div class="relative">${prefix ? `<span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">${prefix}</span>` : ''}<input id="${id}-${k}-${n}" inputmode="numeric" value="${v}" class="field ${prefix ? 'pl-7' : ''} tabular"${k === 'stock' && v === 0 && error ? ' aria-invalid="true"' : ''}></div>`;
  return `<div class="grid gap-4">
  <div class="grid gap-4 md:grid-cols-2">${opt('Variation 1: Grade', ['Premium', 'Standard'])}${opt('Variation 2: Weight', ['250g', '500g'])}</div>
  <div class="flex flex-wrap items-end gap-2 rounded-panel bg-surface-muted p-3"><p class="w-full text-label">Apply to all</p>
    <div class="min-w-28 flex-1">${cell('all', 'price', '', 'Price for all variations', '₱')}</div><div class="min-w-28 flex-1">${cell('all', 'stock', '', 'Stock for all variations')}</div>${btn('Apply', { variant: 'secondary' })}</div>
  ${error ? `<p class="flex gap-1 text-body-sm font-bold text-danger">${icon('circle-alert', 'size-4')}${error}</p>` : ''}
  <div class="hidden overflow-x-auto rounded-panel border border-border md:block"><table class="w-full table-fixed text-body"><caption class="sr-only">Price and stock per variation</caption>
    <thead class="bg-surface-subtle"><tr>${['Grade', 'Weight', 'Price', 'Stock', 'SKU'].map((h,i) => `<th scope="col" class="px-3 py-2 text-left text-th uppercase text-muted-foreground ${i===1?'w-14':i===2?'w-36':i===3?'w-32':i===4?'w-40':''}">${h}</th>`).join('')}</tr></thead>
    <tbody class="divide-y divide-border">${combos.map(([c, s, p, st], n) => `<tr><th scope="row" class="px-3 py-2 text-left text-label">${c}</th><td class="px-3 py-2">${s}</td><td class="w-36 px-3 py-2">${cell(n, 'price', p, `Price, ${c} ${s}`, '₱')}</td><td class="w-32 px-3 py-2">${cell(n, 'stock', st, `Stock, ${c} ${s}`)}</td><td class="px-3 py-2">${cell(n, 'sku', `DTS-${c.slice(0, 2).toUpperCase()}-${s}`, `SKU, ${c} ${s}`)}</td></tr>`).join('')}</tbody></table></div>
  <ul class="grid gap-2 md:hidden" aria-label="Price and stock per variation">${combos.map(([c, s, p, st], n) => `<li class="card grid gap-2 p-3"><p class="text-label">${c} · ${s}</p><div class="grid grid-cols-2 gap-2"><div class="grid gap-1"><span class="text-body-sm text-muted-foreground" aria-hidden="true">Price</span>${cell(`m${n}`, 'price', p, `Price, ${c} ${s}`, '₱')}</div><div class="grid gap-1"><span class="text-body-sm text-muted-foreground" aria-hidden="true">Stock</span>${cell(`m${n}`, 'stock', st, `Stock, ${c} ${s}`)}</div></div></li>`).join('')}</ul>
</div>`;
}

/** StockInput: numeric stock with low-stock hint. */
export const stockInput = ({ id, value = 6, low = 10, error, disabled }) => formField({ id, label: 'Stock', required: true, error, help: value <= low && !error ? `Low stock: you’ll be reminded below ${low}.` : 'Available units for sale.', control: textInput({ id, inputmode: 'numeric', value, error, disabled, help: true, cls: 'tabular', suffix: `<span class="pr-3 text-body text-muted-foreground">units</span>` }) }).replace('class="text-body-sm text-muted-foreground">Low stock', 'class="text-body-sm font-bold text-warning">Low stock');

/** SalesChart: SVG bars (token fills) with an equivalent data table. */
export function salesChart({ id = 'sc', data = [['Mon', 5200], ['Tue', 6100], ['Wed', 4300], ['Thu', 7900], ['Fri', 9400], ['Sat', 12800], ['Sun', 10450]], title = 'Sales, last 7 days', fmt = peso, noun = 'Sales' } = {}) {
  const max = Math.max(...data.map(d => d[1])), W = 100 / data.length;
  const total = data.reduce((a, d) => a + d[1], 0); const best = data.find(d => d[1] === max)[0];
  return `<section class="panel p-4" aria-labelledby="${id}-t">
  <div class="flex flex-wrap items-center justify-between gap-2"><div><h2 id="${id}-t" class="text-h4">${title}</h2><p class="text-body-sm text-muted-foreground">Total <span class="font-bold text-foreground tabular">${fmt(total)}</span> · best day ${best}</p></div>${segmented({ name: `${id}-p`, label: 'Period', options: ['7D', '30D', '90D'], size: 'sm' })}</div>
  <figure class="mt-4"><svg viewBox="0 0 100 52" class="h-48 w-full md:h-56" role="img" aria-labelledby="${id}-t ${id}-d" preserveAspectRatio="none"><desc id="${id}-d">Bar chart. ${data.map(([d, v]) => `${d} ${fmt(v)}`).join(', ')}.</desc>
    ${[0, 0.5, 1].map(f => `<line x1="0" x2="100" y1="${48 - f * 44}" y2="${48 - f * 44}" class="stroke-border" stroke-width=".3" vector-effect="non-scaling-stroke"/>`).join('')}
    ${data.map(([d, v], n) => `<rect x="${n * W + W * 0.2}" y="${48 - (v / max) * 44}" width="${W * 0.6}" height="${(v / max) * 44}" rx="1" class="${v === max ? 'fill-primary' : 'fill-brand-400'}"/>`).join('')}
  </svg>
  <figcaption class="mt-1 grid text-center text-caption text-muted-foreground" style="grid-template-columns:repeat(${data.length},minmax(0,1fr))" aria-hidden="true">${data.map(d => `<span>${d[0]}</span>`).join('')}</figcaption></figure>
  <details class="mt-3"><summary class="inline-flex min-h-touch items-center gap-1 text-label text-primary">${icon('list', 'size-4')}View as table</summary>
    <table class="mt-2 w-full text-body"><caption class="sr-only">${title}</caption><thead><tr><th scope="col" class="py-1 text-left text-th uppercase text-muted-foreground">Day</th><th scope="col" class="py-1 text-right text-th uppercase text-muted-foreground">${noun}</th></tr></thead><tbody class="divide-y divide-border">${data.map(([d, v]) => `<tr><th scope="row" class="py-1.5 text-left font-normal">${d}</th><td class="py-1.5 text-right tabular">${fmt(v)}</td></tr>`).join('')}</tbody></table></details>
</section>`;
}

/** ShopSettings sections */
export const shopSettings = (id = 'ss') => `<div class="grid gap-4">
  ${formSection({ id: `${id}-profile`, title: 'Shop profile', body: `${formField({ id: `${id}-name`, label: 'Shop name', required: true, help: 'Change once every 30 days.', control: textInput({ id: `${id}-name`, value: 'Barakah Pantry', help: true }) })}${formField({ id: `${id}-bio`, label: 'Shop description', optional: true, counter: '64 / 500', control: textarea({ id: `${id}-bio`, value: 'Homemade kakanin from Quezon City. Fresh every morning since 2015.', rows: 3, counter: true }) })}` })}
  ${formSection({ id: `${id}-status`, title: 'Shop status', body: `${switchCtl({ id: `${id}-vac`, label: 'Vacation mode', desc: 'Buyers can browse but cannot order. Pending orders must still ship.' })}${switchCtl({ id: `${id}-chat`, label: 'Auto-reply in chat', desc: 'Sends your greeting when a buyer starts a chat.', checked: true })}` })}
  ${formSection({ id: `${id}-ship`, title: 'Shipping channels', body: `${check({ id: `${id}-s1`, label: 'Standard Delivery', desc: 'Nationwide, 2–5 days.', checked: true })}${check({ id: `${id}-s2`, label: 'Express (Metro Manila)', desc: 'Next-day.', checked: true })}${check({ id: `${id}-s3`, label: 'Cash on Delivery', desc: 'Up to ₱5,000 per order.' })}` })}
</div>`;
