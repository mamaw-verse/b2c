import { esc, cx, icon, iconBtn, btn, badge, avatar, media, peso, compact, link } from './core.mjs';
import { check, stepper, textarea, formField, textInput, uploader, ratingInput, fieldset } from './forms.mjs';
import { dialog, dialogStatic, skel, skeleton } from './feedback.mjs';
import { rating } from './data.mjs';
import { halalBadge } from './halal.mjs';

const pct = (price, was) => Math.round((1 - price / was) * 100);

/** PriceBlock: discounted price uses --sale; original is struck through with sr-only labels. */
export function priceBlock({ price, was, size = 'md', max, unit, pctBadge = true }) {
  const cls = size === 'lg' ? 'text-price-lg' : size === 'sm' ? 'text-body font-extrabold' : 'text-price';
  const now = max ? `${peso(price)} – ${peso(max)}` : peso(price);
  return `<p class="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">${was ? '<span class="sr-only">Sale price:</span>' : ''}<span data-price class="${cx(cls, was ? 'text-sale' : 'text-foreground')}">${now}</span>${unit ? `<span class="text-body-sm text-muted-foreground">/ ${unit}</span>` : ''}${was ? `<span class="sr-only">Original price:</span><s data-price class="${size === 'lg' ? 'text-body' : 'text-body-sm'} text-muted-foreground">${peso(was)}</s>${pctBadge ? `<span class="badge badge-sale">-${pct(price, was)}%</span>` : ''}` : ''}</p>`;
}
export const soldCount = (n) => `<span class="tabular">${compact(n)} sold</span>`;
/** VerifiedBadge: configurable trust label (Verified / Official / Preferred). Never a hardcoded brand. */
export const verifiedBadge = ({ label = 'Verified', tone = 'soft', size = 'md' } = {}) =>
  `<span class="${cx('badge', tone === 'solid' ? 'badge-solid' : tone === 'outline' ? 'border border-primary bg-surface text-primary' : '', size === 'sm' && 'px-1.5')}">${icon('badge-check', 'size-3.5')}${label}</span>`;

/** ProductCard: whole card is one link (stretched title link). */
export function productCard(p, { variant = 'grid', i = 0, href = '#' } = {}) {
  if (variant === 'skeleton') return skeleton(`<div class="card overflow-hidden">${skel('aspect-square w-full rounded-none')}<div class="grid gap-2 p-2">${skel('h-4 w-full')}${skel('h-4 w-2/3')}${skel('h-5 w-1/2')}${skel('h-3 w-1/3')}</div></div>`, 'Loading product');
  const off = p.was ? `<span class="badge badge-sale-solid absolute right-0 top-0 rounded-none rounded-bl-tile"><span class="sr-only">Discount </span>-${pct(p.price, p.was)}%</span>` : '';
  const vb = '';
  const hl = p.halal === 'certified' ? halalBadge({ status: 'certified', short: true, solid: true, body: p.body, cls: 'absolute left-1.5 top-1.5' }) : '';
  const hlInline = p.halal === 'certified' ? halalBadge({ status: 'certified', short: true, body: p.body }) : '';
  const cold = p.frozen ? `<span class="inline-flex shrink-0 items-center gap-0.5 text-info">${icon('snowflake', 'size-3.5')}Frozen</span>` : '';
  const title = `<a href="${href}" class="after:absolute after:inset-0 focus-visible:outline-none">${esc(p.name)}</a>`;
  const meta = `<p class="flex items-center gap-1.5 text-caption text-muted-foreground">${icon('star', 'size-3.5 fill-current stroke-0 text-rating')}<span class="sr-only">Rated</span><span class="font-bold text-foreground tabular">${p.rating.toFixed(1)}</span><span aria-hidden="true">·</span>${soldCount(p.sold)}</p>`;
  const loc = `<p class="flex min-w-0 items-center gap-1 text-caption text-muted-foreground">${icon('map-pin', 'size-3.5 shrink-0')}<span class="truncate">${p.loc}</span>${cold ? `<span class="ml-auto pl-1">${cold}</span>` : ''}</p>`;
  const ring = 'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring';
  if (variant === 'list') return `<article class="card card-interactive relative flex gap-3 p-2 ${ring}">
  <div class="relative w-28 shrink-0 overflow-hidden rounded-tile md:w-36">${media(p.name, { i, ic: p.ic, decorative: true })}${off}</div>
  <div class="flex min-w-0 flex-1 flex-col gap-1 py-1">
    <h3 class="line-clamp-2 text-body">${vb}${title}</h3>${hlInline ? `<p>${hlInline}</p>` : ''}
    ${priceBlock({ price: p.price, was: p.was, pctBadge: false })}${meta}${loc}
  </div>
</article>`;
  if (variant === 'compact') return `<article class="card card-interactive relative flex w-32 shrink-0 flex-col overflow-hidden ${ring}">
  <div class="relative">${media(p.name, { i, ic: p.ic, decorative: true })}${off}</div>
  <div class="grid gap-0.5 p-2"><h3 class="truncate text-body-sm">${title}</h3>${priceBlock({ price: p.price, size: 'sm' })}</div>
</article>`;
  return `<article class="card card-interactive relative flex flex-col overflow-hidden ${ring}">
  <div class="relative">${media(p.name, { i, ic: p.ic, decorative: true })}${off}${hl}${p.free ? `<span class="badge badge-success absolute bottom-1.5 left-1.5">${icon('truck', 'size-3.5')}Free shipping</span>` : ''}</div>
  <div class="flex flex-1 flex-col gap-1 p-2">
    <h3 class="line-clamp-2 min-h-[2lh] text-body">${vb}${title}</h3>
    <div class="mt-auto grid gap-1">${priceBlock({ price: p.price, was: p.was, pctBadge: false })}${meta}${loc}</div>
  </div>
</article>`;
}
export const productGrid = (items, { cls = '', id } = {}) => `<ul class="${cx('grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 lg:grid-cols-5', cls)}"${id ? ` id="${id}"` : ''}>${items.map((p, i) => `<li class="flex">${productCard(p, { i }).replace('<article class="card', '<article class="w-full card')}</li>`).join('')}</ul>`;

export function shopCard(s, { i = 0 } = {}) {
  return `<article class="card relative flex items-center gap-3 p-3">
  ${avatar(s.name, { size: 'lg', shape: 'tile', label: false })}
  <div class="min-w-0 flex-1"><h3 class="flex flex-wrap items-center gap-1.5 text-h4"><a href="#" class="after:absolute after:inset-0">${s.name}</a>${s.verified ? verifiedBadge({ label: 'Official', tone: 'solid', size: 'sm' }) : ''}</h3>
    <p class="mt-0.5 flex flex-wrap gap-x-3 text-body-sm text-muted-foreground"><span class="inline-flex items-center gap-1">${icon('star', 'size-3.5 fill-current stroke-0 text-rating')}<span class="font-bold text-foreground">${s.rating}</span></span><span>${compact(s.followers)} followers</span><span class="inline-flex items-center gap-1">${icon('map-pin', 'size-3.5')}${s.loc}</span></p></div>
  ${btn('Visit', { variant: 'outline', size: 'sm', cls: 'relative z-10', attrs: { tabindex: '-1', 'aria-hidden': 'true' } })}
</article>`;
}

export function shopHeader(s) {
  return `<section class="overflow-hidden bg-surface md:rounded-panel md:border md:border-border" aria-labelledby="shop-name">
  <div class="pattern-geo h-20 bg-surface-inverse md:h-28" aria-hidden="true"></div>
  <div class="-mt-8 grid gap-3 px-gutter pb-4 md:-mt-10 md:flex md:items-end md:gap-5 md:px-6">
    <span class="rounded-tile border-4 border-surface bg-surface">${avatar(s.name, { size: 'xl', shape: 'tile', label: false })}</span>
    <div class="min-w-0 flex-1 md:pb-1"><h1 id="shop-name" class="flex flex-wrap items-center gap-2 text-h2">${s.name}${s.verified ? verifiedBadge({ label: 'Official', tone: 'solid' }) : ''}${s.halal ? `<span class="badge badge-halal">${icon('moon-star', 'size-3.5')}Halal-only shop</span>` : ''}</h1>
      <p class="mt-1 flex items-center gap-1 text-body-sm text-muted-foreground">${icon('map-pin', 'size-4')}${s.loc} · <span class="text-success">Active 5 min ago</span></p></div>
    <div class="flex gap-2 md:pb-1">${btn('Follow', { icon: 'plus', cls: 'flex-1 md:flex-none' })}${btn('Chat', { variant: 'outline', icon: 'message-circle', cls: 'flex-1 md:flex-none' })}</div>
  </div>
  <dl class="grid grid-cols-4 border-t border-border text-center">${[['Rating', `${s.rating} / 5`], ['Followers', compact(s.followers)], ['Products', s.products], ['Chat reply', s.chat]].map(([k, v]) => `<div class="flex flex-col-reverse gap-0.5 px-1 py-3"><dt class="text-caption text-muted-foreground">${k}</dt><dd class="text-label tabular">${v}</dd></div>`).join('')}</dl>
</section>`;
}

export const categoryTile = (name, ic, i = 0) => `<a href="#" class="flex flex-col items-center gap-1.5 rounded-tile p-1 text-center text-caption text-foreground hover:bg-surface-muted"><span class="grid size-12 place-items-center rounded-tile ${['bg-brand-50 text-primary', 'bg-info-soft text-info', 'bg-sale-soft text-sale', 'bg-warning-soft text-warning', 'bg-success-soft text-success'][i % 5]} md:size-14">${icon(ic, 'size-6')}</span><span class="line-clamp-2">${name}</span></a>`;
export const categoryGrid = (cats) => `<ul class="grid grid-cols-5 gap-x-1 gap-y-3 md:grid-cols-10">${cats.map(([n, ic], i) => `<li>${categoryTile(n, ic, i)}</li>`).join('')}</ul>`;

/* ------------------------------------------------------------ variation picker */
const optChip = (name, label, { checked, disabled, ic, i = 0 } = {}) => `<label class="relative flex min-h-touch cursor-pointer items-center gap-2 rounded-button border border-border-control bg-surface px-3 text-body hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary-soft-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:border-dashed has-[:disabled]:text-muted-foreground has-[:disabled]:hover:border-border-control has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring">
  <input type="radio" name="${name}" class="sr-only"${checked ? ' checked' : ''}${disabled ? ' disabled' : ''}>${ic ? `<span class="size-7 overflow-hidden rounded-badge">${media(label, { i, ic, decorative: true })}</span>` : ''}${label}${disabled ? '<span class="text-caption">(sold out)</span>' : ''}</label>`;
export function variationBody({ id, p = { name: 'Ajwa dates 500g', price: 649, was: 799, ic: 'cookie' } }) {
  return `<div class="grid gap-5">
  <div class="flex gap-3"><div class="w-20 shrink-0 overflow-hidden rounded-tile">${media(p.name, { ic: p.ic, decorative: true })}</div><div class="grid content-end gap-1">${priceBlock({ price: p.price, was: p.was, size: 'lg' })}<p class="text-body-sm text-muted-foreground">Stock: <span class="tabular">42</span></p></div></div>
  <fieldset><legend class="mb-2 text-label">Grade: <span class="font-normal text-muted-foreground">Premium</span></legend><div class="flex flex-wrap gap-2">${optChip(`${id}-c`, 'Premium', { checked: true })}${optChip(`${id}-c`, 'Standard')}${optChip(`${id}-c`, 'Sukkari', { disabled: true })}</div></fieldset>
  <fieldset><legend class="mb-2 text-label">Weight</legend><div class="flex flex-wrap gap-2">${optChip(`${id}-s`, '250g')}${optChip(`${id}-s`, '500g', { checked: true })}${optChip(`${id}-s`, '1kg')}</div></fieldset>
  <div class="flex items-center justify-between"><p class="text-label" id="${id}-qty-l">Quantity</p>${stepper({ id: `${id}-qty`, value: 1, max: 42 })}</div>
</div>`;
}
export const variationPicker = ({ id, frozen }) => (frozen ? dialogStatic : dialog)({ id, kind: 'sheet', title: 'Select variation', body: variationBody({ id }), footer: `${btn('Add to cart', { variant: 'secondary', size: 'lg', cls: 'flex-1' })}${btn('Buy now', { size: 'lg', cls: 'flex-1' })}` }).replace('flex flex-col gap-2 sm:flex-row sm:justify-end', 'flex flex-row gap-2');

/* ------------------------------------------------------------ vouchers */
const vTone = { shop: ['bg-primary text-primary-foreground', 'store', 'Shop'], platform: ['bg-sale text-primary-foreground', 'ticket', '{{BRAND_NAME}}'], shipping: ['bg-success text-primary-foreground', 'truck', 'Shipping'] };
export function voucherCard({ title = '₱50 off', min = 'Min. spend ₱500', expiry = 'Valid till Nov 30', kind = 'shop', state = 'available', select, name, id, checked }) {
  const [tone0, ic, label] = vTone[kind]; const tone = state === 'unavailable' ? 'bg-surface-muted text-muted-foreground' : tone0;
  const action = select ? `<input type="radio" name="${name}" id="${id}" class="size-5 accent-primary"${checked ? ' checked' : ''}${state === 'unavailable' ? ' disabled' : ''}>`
    : state === 'applied' ? `<span class="badge badge-success">${icon('check', 'size-3.5')}Applied</span>` : state === 'unavailable' ? '' : btn(state === 'claimed' ? 'Use' : 'Claim', { size: 'sm', variant: state === 'claimed' ? 'outline' : 'primary' });
  const inner = `<div class="flex w-20 shrink-0 flex-col items-center justify-center gap-1 ${tone} p-2 text-center text-caption font-bold">${icon(ic)}<span class="line-clamp-2 break-words">${label}</span></div>
  <div class="relative grid min-w-0 flex-1 content-center gap-0.5 border-l-2 border-dashed border-border py-2 pl-3 pr-2"><p class="text-label">${title}</p><p class="text-body-sm text-muted-foreground">${min}</p><p class="flex items-center gap-1 text-caption ${state === 'unavailable' ? 'text-danger' : 'text-muted-foreground'}">${icon(state === 'unavailable' ? 'circle-alert' : 'clock', 'size-3.5')}${state === 'unavailable' ? 'Spend ₱120 more to use' : expiry}</p></div>
  ${action ? `<div class="flex shrink-0 items-center pr-3">${action}</div>` : ''}`;
  const cls = cx('flex overflow-hidden rounded-card border bg-surface', state === 'unavailable' ? 'border-border' : 'border-border-outline', select && 'cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring');
  return select ? `<label for="${id}" class="${cls}">${inner}</label>` : `<div class="${cls}">${inner}</div>`;
}
export const voucherPickerBody = (id) => `<div class="grid gap-4">
  <div class="flex gap-2"><label for="${id}-code" class="sr-only">Voucher code</label><input id="${id}-code" class="field" placeholder="Enter voucher code" autocomplete="off">${btn('Apply', { variant: 'outline' })}</div>
  <fieldset class="grid gap-2"><legend class="mb-1 text-label">Shop vouchers</legend>
    ${voucherCard({ select: true, name: `${id}-v`, id: `${id}-v1`, checked: true, title: '₱50 off', min: 'Min. spend ₱500' })}
    ${voucherCard({ select: true, name: `${id}-v`, id: `${id}-v2`, title: '10% off, up to ₱150', min: 'Min. spend ₱800' })}
    ${voucherCard({ select: true, name: `${id}-v`, id: `${id}-v3`, title: '₱200 off', min: 'Min. spend ₱1,500', state: 'unavailable' })}
  </fieldset>
  <fieldset class="grid gap-2"><legend class="mb-1 text-label">Free shipping</legend>${voucherCard({ select: true, name: `${id}-sv`, id: `${id}-sv1`, kind: 'shipping', title: 'Free shipping up to ₱80', min: 'Min. spend ₱299', checked: true })}</fieldset>
</div>`;
export const voucherPicker = ({ id, frozen }) => (frozen ? dialogStatic : dialog)({ id, title: 'Select vouchers', body: voucherPickerBody(id), footer: `<p class="flex-1 self-center text-body-sm text-muted-foreground">Saving <span class="font-bold text-sale">₱130</span></p>${btn('Done', { attrs: { 'data-ds-close': true }, cls: 'sm:min-w-32' })}` });

/* ------------------------------------------------------------ cart */
export function cartItem({ p, qty = 1, checked = true, variation = 'Premium, 500g', id, stockNote, unavailable, i = 0 }) {
  return `<li class="flex gap-2 py-3">
  <label class="grid min-h-touch min-w-9 content-start justify-items-center pt-6"><input type="checkbox" class="size-5 accent-primary" id="${id}"${checked ? ' checked' : ''}${unavailable ? ' disabled' : ''} data-ds-bulk-item><span class="sr-only">Select ${esc(p.name)}</span></label>
  <a href="#" class="w-20 shrink-0 overflow-hidden rounded-tile md:w-24" tabindex="-1" aria-hidden="true">${media(p.name, { i, ic: p.ic, decorative: true })}</a>
  <div class="grid min-w-0 flex-1 grid-cols-1 gap-1.5">
    <p class="line-clamp-2 text-body"><a href="#" class="hover:underline">${esc(p.name)}</a></p>
    <button type="button" class="relative inline-flex min-h-9 w-fit max-w-full items-center gap-1 rounded-badge bg-surface-muted px-2 text-body-sm text-muted-foreground hover:bg-border after:absolute after:inset-x-0 after:-inset-y-1" aria-label="Variation: ${variation}. Change">${variation}${icon('chevron-down', 'size-4 shrink-0')}</button>
    ${p.halal === 'certified' || p.frozen ? `<p class="flex flex-wrap items-center gap-x-2 gap-y-1">${p.halal === 'certified' ? halalBadge({ status: 'certified', short: true, body: p.body }) : ''}${p.frozen ? `<span class="inline-flex items-center gap-1 text-body-sm text-info">${icon('snowflake', 'size-4')}Ships frozen</span>` : ''}</p>` : ''}
    ${unavailable ? `<p class="text-body-sm font-bold text-danger">${unavailable}</p>` : `<div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 [&>:last-child]:ml-auto">${priceBlock({ price: p.price, was: p.was, size: 'sm' })}${stepper({ id: `${id}-q`, value: qty, max: 10 })}</div>`}
    ${stockNote ? `<p class="text-body-sm text-warning">${stockNote}</p>` : ''}
  </div>
</li>`;
}
export function cartShopGroup({ shop, items, id, voucher = true }) {
  return `<section class="bg-surface md:rounded-panel md:border md:border-border" aria-labelledby="${id}-h" data-ds-bulk>
  <div class="flex items-center gap-2 border-b border-border px-gutter md:px-4">
    <label class="grid min-h-touch min-w-9 place-items-center"><input type="checkbox" class="size-5 accent-primary" data-ds-select-all><span class="sr-only">Select all from ${shop.name}</span></label>
    <h2 id="${id}-h" class="flex min-w-0 flex-1 items-center gap-1.5 text-label">${icon('store', 'size-4 shrink-0')}<a href="#" class="flex min-h-touch min-w-0 items-center hover:underline"><span class="truncate">${shop.name}</span></a>${shop.verified ? verifiedBadge({ label: 'Official', tone: 'solid', size: 'sm' }) : ''}${icon('chevron-right', 'size-4 shrink-0 text-muted-foreground')}</h2>
    ${iconBtn('message-circle', `Chat with ${shop.name}`, { size: 'sm' })}
  </div>
  <ul class="divide-y divide-border px-gutter md:px-4">${items.map((it, n) => cartItem({ ...it, id: `${id}-i${n}`, i: n })).join('')}</ul>
  ${voucher ? `<button type="button" class="flex min-h-touch w-full items-center gap-2 border-t border-border px-gutter text-body-sm hover:bg-surface-subtle md:px-4">${icon('ticket', 'size-4 text-sale')}<span class="flex-1 text-left">Shop voucher: <span class="font-bold">₱50 off</span> on ₱500</span><span class="text-primary">More vouchers</span>${icon('chevron-right', 'size-4 text-muted-foreground')}</button>` : ''}
</section>`;
}

/** OrderSummary / PriceBreakdown */
export const orderSummary = ({ lines = [['Merchandise subtotal (3 items)', 1587], ['Shipping fee', 80], ['Shipping discount', -80], ['Shop voucher', -50], ['Platform voucher', -99]], total = 1438, title = 'Payment details', cod, halal } = {}) =>
  `<section class="panel p-4" aria-labelledby="os-h"><h2 id="os-h" class="text-h4">${title}</h2>
  <dl class="mt-3 grid gap-2 text-body">${lines.map(([k, v]) => `<div class="flex justify-between gap-3"><dt class="text-muted-foreground">${k}</dt><dd class="tabular ${v < 0 ? 'text-sale' : ''}">${v < 0 ? '−' + peso(-v) : peso(v)}</dd></div>`).join('')}
  <div class="mt-1 flex items-baseline justify-between gap-3 border-t border-border pt-3"><dt class="text-label">Total payment</dt><dd class="text-price-lg text-sale tabular">${peso(total)}</dd></div></dl>
  ${cod ? `<p class="mt-2 text-body-sm text-muted-foreground">Pay ${peso(total)} in cash when your order arrives.</p>` : ''}
  ${halal ? `<p class="mt-3 flex items-start gap-2 rounded-tile bg-halal-soft p-2 text-body-sm text-halal">${icon('moon-star', 'mt-0.5 size-4 shrink-0')}<span>Every item in this order is halal certified or Muslim-friendly (no certificate needed).</span></p>` : ''}
</section>`;

/** AddressCard (display) + picker (radio cards) */
export const addressCard = ({ name = 'Maria Santos', phone = '+63 917 123 4567', line = 'Unit 4B, 12 Bagong Silang St., Maharlika Village, Taguig, Metro Manila 1630', label = 'Home', isDefault = true, action = 'Change', select, id, checked, group } = {}) => {
  const inner = `${select ? `<input type="radio" id="${id}" name="${group}" class="mt-1 size-5 shrink-0 accent-primary"${checked ? ' checked' : ''}>` : icon('map-pin', 'mt-0.5 text-sale')}
  <div class="grid min-w-0 flex-1 grid-cols-1 gap-0.5"><p class="flex flex-wrap items-center gap-x-2 gap-y-1"><span class="text-label">${name}</span><span class="text-body-sm text-muted-foreground tabular">${phone}</span></p><p class="text-body text-muted-foreground">${line}</p><p class="mt-1 flex gap-1.5">${isDefault ? badge('Default') : ''}${badge(label, 'neutral')}</p></div>
  ${action && !select ? `<a href="#" class="inline-flex min-h-touch items-center self-center text-label text-primary">${action}${icon('chevron-right', 'size-4')}</a>` : ''}`;
  return select ? `<label for="${id}" class="flex cursor-pointer gap-3 rounded-card border border-border bg-surface p-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft">${inner}</label>` : `<div class="flex gap-3 bg-surface p-gutter md:rounded-panel md:border md:border-border md:p-4">${inner}</div>`;
};

/** Generic radio card list (shipping / payment) */
const radioCard = ({ name, id, checked, disabled, ic, title, desc, right, extra }) => `<label for="${id}" class="flex min-h-touch-primary cursor-pointer items-center gap-3 rounded-card border border-border bg-surface p-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-surface-subtle has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring">
  <input type="radio" id="${id}" name="${name}" class="size-5 shrink-0 accent-primary"${checked ? ' checked' : ''}${disabled ? ' disabled' : ''}>
  ${ic ? `<span class="grid size-10 shrink-0 place-items-center rounded-tile bg-surface-muted text-foreground">${icon(ic)}</span>` : ''}
  <span class="grid min-w-0 flex-1 grid-cols-1 gap-0.5"><span class="text-label ${disabled ? 'text-muted-foreground' : ''}">${title}</span>${desc ? `<span class="text-body-sm text-muted-foreground">${desc}</span>` : ''}${extra || ''}</span>
  ${right ? `<span class="shrink-0 text-label tabular">${right}</span>` : ''}
</label>`;
export const shippingOptionPicker = ({ id = 'ship' } = {}) => fieldset({ legend: 'Shipping option', cls: 'gap-2', children: `<div class="grid gap-2">${[
  { title: 'Standard Delivery', desc: 'Receive by Nov 4 – Nov 6', right: '₱80', checked: true, ic: 'truck' },
  { title: 'Express (Metro Manila)', desc: 'Receive tomorrow if ordered before 2 PM', right: '₱150', ic: 'clock' },
  { title: 'Same-day', desc: 'Not available for this address', right: '₱220', disabled: true, ic: 'package' },
].map((o, n) => radioCard({ ...o, name: id, id: `${id}-${n}` })).join('')}</div>` });
export const paymentMethodPicker = ({ id = 'pay', error } = {}) => fieldset({ legend: 'Payment method', cls: 'gap-2', id, error, children: `<div class="grid gap-2">${[
  { title: 'E-wallet', desc: 'GCash, Maya', ic: 'smartphone', checked: !error },
  { title: 'Debit / credit card', desc: 'Visa, Mastercard. Pay in full, no instalment plans.', ic: 'credit-card' },
  { title: 'Online banking', desc: 'Instapay / PESONet partner banks', ic: 'building-2' },
  { title: 'Cash on Delivery', desc: 'Pay the rider in cash. ₱20 COD fee.', ic: 'banknote' },
].map((o, n) => radioCard({ ...o, name: id, id: `${id}-${n}` })).join('')}</div>` });

/* ------------------------------------------------------------ orders */
const statusTone = { 'To Pay': 'warning', 'To Ship': 'warning', 'To Receive': 'info', Completed: 'success', Cancelled: 'neutral', 'Return/Refund': 'danger' };
export function orderCard({ shop = 'Barakah Pantry', status = 'To Receive', note = 'Parcel is out for delivery', items, total = 1438, actions = ['Order received'], secondary = ['Contact seller'] }) {
  items = items || [{ p: { name: 'Ajwa dates 500g, premium grade', price: 649, was: 799, ic: 'cookie' }, qty: 2, v: 'Premium, 500g' }];
  return `<article class="bg-surface md:rounded-panel md:border md:border-border">
  <div class="flex items-center gap-2 border-b border-border px-gutter py-2 md:px-4"><h3 class="flex min-w-0 flex-1 items-center gap-1.5 text-label">${icon('store', 'size-4 shrink-0')}<span class="truncate">${shop}</span></h3>${badge(status, statusTone[status])}</div>
  ${note ? `<a href="#" class="flex min-h-touch items-center gap-2 border-b border-border px-gutter text-body-sm text-success hover:bg-surface-subtle md:px-4">${icon('truck', 'size-4')}<span class="flex-1">${note}</span>${icon('chevron-right', 'size-4 text-muted-foreground')}</a>` : ''}
  <ul class="divide-y divide-border px-gutter md:px-4">${items.map((it, n) => `<li class="flex gap-3 py-3"><div class="w-16 shrink-0 overflow-hidden rounded-tile">${media(it.p.name, { i: n, ic: it.p.ic, decorative: true })}</div><div class="grid min-w-0 flex-1 grid-cols-1 gap-0.5"><p class="line-clamp-2 text-body"><a href="#" class="hover:underline">${esc(it.p.name)}</a></p><p class="text-body-sm text-muted-foreground">${it.v} · ×${it.qty}</p></div><div class="text-right">${priceBlock({ price: it.p.price, size: 'sm' })}</div></li>`).join('')}</ul>
  <div class="flex items-baseline justify-end gap-2 border-t border-border px-gutter py-2 text-body md:px-4"><span class="text-muted-foreground">Order total:</span><span class="text-price text-sale tabular">${peso(total)}</span></div>
  ${actions.length || secondary.length ? `<div class="flex flex-wrap justify-end gap-2 border-t border-border px-gutter py-2 md:px-4">${secondary.map(a => btn(a, { variant: 'neutral', size: 'sm' })).join('')}${actions.map(a => btn(a, { size: 'sm' })).join('')}</div>` : ''}
</article>`;
}

/* ------------------------------------------------------------ reviews */
export function reviewCard({ name = 'Ana Cruz', value = 5, variation = 'Premium, 500g', date = 'Oct 30, 2026', text = 'Malamig pa rin yung tubig after 12 hours. Packaging was secure and delivery was fast. Will buy another for my sister.', photos = 3, helpful = 12, reply, anonymous } = {}) {
  const isLong = text && text.length > 240;
  const reviewBody = isLong
    ? `<p class="line-clamp-4 text-body">${esc(text)}</p><button type="button" class="text-label text-primary" data-ds-expand aria-expanded="false">See more</button>`
    : `<p class="text-body">${esc(text)}</p>`;
  return `<article class="grid gap-2 border-b border-border py-4 last:border-0">
  <div class="flex items-center gap-3">${avatar(anonymous ? 'Anonymous' : name, { size: 'sm', label: false })}<div class="grid gap-0.5"><p class="text-label">${anonymous ? 'a*****z' : name}</p>${rating(value, { size: 'size-3.5', showValue: false })}</div></div>
  <p class="text-body-sm text-muted-foreground">Variation: ${variation}</p>
  ${reviewBody}
  ${photos ? `<ul class="flex gap-2" aria-label="Review photos">${Array.from({ length: photos }, (_, n) => `<li><button type="button" class="block size-20 overflow-hidden rounded-tile" aria-label="Open photo ${n + 1} of ${photos}">${media('Review photo', { i: n + 1, ic: 'image', decorative: true })}</button></li>`).join('')}</ul>` : ''}
  <div class="flex items-center justify-between gap-2"><p class="text-body-sm text-muted-foreground"><time>${date}</time></p><div class="flex gap-1"><button type="button" class="btn btn-ghost btn-sm text-muted-foreground" aria-pressed="false">${icon('thumbs-up', 'size-4')}Helpful (${helpful})</button>${iconBtn('flag', 'Report review', { size: 'sm', cls: 'text-muted-foreground' })}</div></div>
  ${reply ? `<div class="rounded-tile bg-surface-muted p-3"><p class="text-label">Seller’s response</p><p class="mt-1 text-body text-muted-foreground">${reply}</p></div>` : ''}
</article>`;
}
export const reviewForm = ({ id = 'rf' } = {}) => `<form class="grid gap-5" data-ds-validate novalidate>
  <div class="flex gap-3"><div class="w-16 shrink-0 overflow-hidden rounded-tile">${media('Product', { ic: 'package', decorative: true })}</div><div><p class="line-clamp-2 text-body">Ajwa dates 500g, premium grade</p><p class="text-body-sm text-muted-foreground">Variation: Premium, 500g</p></div></div>
  ${ratingInput({ id: `${id}-stars`, legend: 'Product quality', value: 0 })}
  ${formField({ id: `${id}-text`, label: 'Your review', optional: true, help: 'At least 20 characters earns coins.', counter: '0 / 500', control: textarea({ id: `${id}-text`, placeholder: 'What did you like? How was the fit, taste, quality?', maxlength: 500, help: true, counter: true }) })}
  ${uploader({ id: `${id}-photos`, label: 'Add photos', max: 5, tiles: [] })}
  ${check({ id: `${id}-anon`, label: 'Post anonymously', desc: 'Your name shows as a*****z.' })}
  ${btn('Submit review', { size: 'lg', block: true, type: 'submit', cls: 'md:w-auto' })}
</form>`;

/* ------------------------------------------------------------ chat */
export function chatListItem({ name, last, time, unread, active, online, product }) {
  return `<li><a href="#" class="flex min-h-16 items-center gap-3 px-gutter py-2 hover:bg-surface-subtle aria-[current=true]:bg-primary-soft md:px-3"${active ? ' aria-current="true"' : ''}>
  ${avatar(name, { status: online ? 'online' : null, label: false })}
  <span class="grid min-w-0 flex-1 grid-cols-1 gap-0.5"><span class="flex items-baseline justify-between gap-2"><span class="truncate text-label">${name}</span><time class="shrink-0 text-caption text-muted-foreground">${time}</time></span>
  <span class="flex items-center justify-between gap-2"><span class="truncate text-body-sm ${unread ? 'font-bold text-foreground' : 'text-muted-foreground'}">${product ? `${icon('package', 'mr-1 inline size-3.5 align-[-0.15em]')}` : ''}${esc(last)}</span>${unread ? `<span class="grid min-w-5 shrink-0 place-items-center rounded-full bg-sale px-1.5 text-caption leading-5 text-primary-foreground">${unread}<span class="sr-only"> unread</span></span>` : ''}</span></span>
</a></li>`;
}
export const chats = [
  { name: 'Barakah Pantry', last: 'Yes po, available pa ang Ajwa. Ship today!', time: '9:41 AM', unread: 2, online: true, active: true },
  { name: 'Mindanao Halal Meats', last: 'Thank you for your order!', time: 'Yesterday' },
  { name: 'Hijab House PH', last: 'Sent a product', time: 'Mon', product: true },
  { name: 'Lola’s Pantry', last: 'Your parcel is on the way 🙂', time: 'Oct 28', unread: 1 },
];
export const chatList = ({ items = chats, label = 'Conversations' } = {}) => `<nav aria-label="${label}"><div class="px-gutter py-2 md:px-3"><label for="chat-q" class="sr-only">Search chats</label><div class="relative">${icon('search', 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground')}<input id="chat-q" type="search" placeholder="Search chats" class="field rounded-search pl-10"></div></div><ul class="divide-y divide-border">${items.map(chatListItem).join('')}</ul></nav>`;

export function chatBubble({ text, out, time = '9:41 AM', status, failed }) {
  return `<li class="flex ${out ? 'justify-end' : 'justify-start'}"><div class="grid max-w-[80%] gap-1 ${out ? 'justify-items-end' : ''}">
  <p class="rounded-panel px-3 py-2 text-body ${out ? 'rounded-br-badge bg-primary text-primary-foreground' : 'rounded-bl-badge border border-border bg-surface text-foreground'}" data-ds-bubble-text>${esc(text)}</p>
  <p class="flex items-center gap-1 text-caption ${failed ? 'text-danger' : 'text-muted-foreground'}"><span class="sr-only">${out ? 'You' : 'Seller'}, </span><time>${time}</time>${out ? (failed ? `${icon('circle-alert', 'size-3.5')}Not sent · <button type="button" class="inline-flex min-h-touch min-w-touch items-center justify-center font-bold underline">Retry</button>` : status === 'read' ? `${icon('check-check', 'size-3.5 text-primary')}<span>Read</span>` : `${icon('check', 'size-3.5')}<span>Sent</span>`) : ''}</p>
</div></li>`;
}
export const chatProductCard = ({ p = { name: 'Ajwa dates 500g, premium grade', price: 649, was: 799, ic: 'cookie' }, action = true } = {}) =>
  `<div class="flex max-w-xs gap-3 rounded-card border border-border bg-surface p-2"><div class="w-16 shrink-0 overflow-hidden rounded-tile">${media(p.name, { ic: p.ic, decorative: true })}</div><div class="grid min-w-0 flex-1 content-center gap-1"><p class="line-clamp-2 text-body-sm"><a href="#" class="hover:underline">${esc(p.name)}</a></p>${priceBlock({ price: p.price, was: p.was, size: 'sm' })}${action ? `<p>${btn('Buy now', { size: 'sm' })}</p>` : ''}</div></div>`;
export const chatOrderCard = ({ id = '#240311-0042', status = 'To Ship', total = 1438 } = {}) =>
  `<div class="grid max-w-xs gap-2 rounded-card border border-border bg-surface p-3"><p class="flex items-center justify-between gap-2"><span class="text-label">Order <span class="tabular">${id}</span></span>${badge(status, statusTone[status])}</p><p class="text-body-sm text-muted-foreground">2 items · <span class="font-bold text-foreground tabular">${peso(total)}</span></p><p>${btn('View order', { variant: 'outline', size: 'sm' })}</p></div>`;

export function chatThread({ id = 'thread', composer = true } = {}) {
  return `<div class="flex h-full min-h-0 flex-col bg-background">
  <ol id="${id}" class="flex flex-1 flex-col gap-3 overflow-y-auto px-gutter py-4" aria-label="Messages with Barakah Pantry" aria-live="polite">
    <li class="text-center"><span class="rounded-full bg-surface-muted px-3 py-1 text-caption text-muted-foreground">Today</span></li>
    <li class="flex justify-end">${chatProductCard({ action: false })}</li>
    ${chatBubble({ text: 'Hi! Available pa po ba ang Ajwa 500g?', out: true, time: '9:38 AM', status: 'read' })}
    ${chatBubble({ text: 'Yes po, available pa ang Ajwa. Ship today if you order before 3 PM!', time: '9:41 AM' })}
    <li class="flex justify-start">${chatOrderCard()}</li>
    <li class="text-center text-caption text-muted-foreground">Chats are monitored for your safety. Never pay outside the app.</li>
    ${chatBubble({ text: 'Salamat po!', out: true, time: '9:42 AM', failed: true })}
  </ol>
  <template>${chatBubble({ text: '', out: true, time: 'Now', status: 'sent' })}</template>
  ${composer ? chatComposer({ thread: id }) : ''}
</div>`;
}
export const chatComposer = ({ thread = 'thread', id = 'cmp' } = {}) => `<form class="flex items-end gap-1 border-t border-border bg-surface px-2 pt-2 pb-[calc(.5rem+env(safe-area-inset-bottom,0px))]" data-ds-composer="${thread}">
  ${iconBtn('plus', 'Attach photo, product or order')}
  <label for="${id}" class="sr-only">Message</label>
  <textarea id="${id}" rows="1" placeholder="Type a message" class="field max-h-40 min-h-touch flex-1 resize-none rounded-search py-2.5" data-ds-autosize enterkeyhint="send"></textarea>
  <button type="submit" class="btn btn-icon rounded-full" aria-label="Send">${icon('send')}</button>
  <p class="sr-only" aria-live="polite" data-ds-live></p>
</form>`;

/* ------------------------------------------------------------ notifications */
export const notificationItem = ({ ic = 'truck', tone = 'bg-info-soft text-info', title = 'Parcel out for delivery', text = 'Order #240311-0042 will arrive today. Prepare ₱1,438 if paying by COD.', time = '2h ago', unread = true, thumb } = {}) =>
  `<li><a href="#" class="relative flex gap-3 px-gutter py-3 hover:bg-surface-subtle ${unread ? 'bg-primary-soft' : 'bg-surface'} md:px-4">
  ${thumb ? `<span class="w-12 shrink-0 overflow-hidden rounded-tile">${media('Product', { ic: 'package', decorative: true })}</span>` : `<span class="grid size-12 shrink-0 place-items-center rounded-full ${tone}">${icon(ic)}</span>`}
  <span class="grid min-w-0 flex-1 grid-cols-1 gap-0.5"><span class="text-label">${unread ? '<span class="sr-only">Unread: </span>' : ''}${title}</span><span class="line-clamp-2 text-body-sm text-muted-foreground">${text}</span><time class="text-caption text-muted-foreground">${time}</time></span>
  ${unread ? '<span class="mt-1.5 size-2.5 shrink-0 rounded-full bg-sale" aria-hidden="true"></span>' : ''}
</a></li>`;

/* ------------------------------------------------------------ report */
export const reportReasons = ['Halal claim conflicts with ingredients', 'Prohibited item', 'Misleading description or price', 'Offensive content', 'Scam or asks to pay outside the app', 'Other'];
export const reportBody = (id, { error } = {}) => `<form class="grid gap-4" id="${id}-form" data-ds-validate novalidate>
  ${fieldset({ legend: 'Why are you reporting this listing?', id: `${id}-r`, error, children: reportReasons.map((r, n) => check({ id: `${id}-r${n}`, name: `${id}-reason`, type: 'radio', label: r, extra: { required: n === 0 } })).join('') })}
  ${formField({ id: `${id}-d`, label: 'Details', optional: true, counter: '0 / 1000', help: 'What should our team look at?', control: textarea({ id: `${id}-d`, maxlength: 1000, rows: 3, help: true, counter: true }) })}
  ${uploader({ id: `${id}-ev`, label: 'Evidence', max: 5, tiles: [], help: 'Screenshots help us act faster.' })}
  <p class="text-body-sm text-muted-foreground">The seller won’t know who reported. False reports may limit your account.</p>
</form>`;
export const reportDialog = ({ id, frozen, error }) => (frozen ? dialogStatic : dialog)({ id, title: 'Report listing', body: reportBody(id, { error }), footer: `${btn('Cancel', { variant: 'neutral', attrs: { 'data-ds-close': true } })}${btn('Submit report', { variant: 'danger', type: 'submit', attrs: { form: `${id}-form` } })}` });
