// Phase 5 reference screens: static pages composed only from package components.
import { icon, iconBtn, btn, badge, avatar, peso } from './ui/core.mjs';
import { tabs, breadcrumb, infiniteSentinel, pagination } from './ui/nav.mjs';
import { chip, carousel, statCard, kvList, timeline, rating } from './ui/data.mjs';

import { stickyBar } from './defs/actions.mjs';
import { products, shops, categories } from './data.mjs';
import { productGrid, productCard, priceBlock, soldCount, shopHeader, categoryGrid, voucherCard, voucherPicker, cartShopGroup, orderSummary, addressCard, shippingOptionPicker, paymentMethodPicker, orderCard, reviewCard, chatList, chatThread, notificationItem, variationPicker, verifiedBadge } from './ui/commerce.mjs';
import { taskGrid, tasks, orderList, productFormSections, productFormBar, variantMatrix, salesChart } from './ui/seller.mjs';
import { queueList, filterBar, detailPane } from './ui/admin.mjs';
import { halalBadge, halalCertCard, halalFacts, coldChainNote } from './ui/halal.mjs';
import { banner } from './ui/feedback.mjs';
import { queue } from './ui/admin.mjs';
import { publicPage, accountPage, sideShell, sellerItems, adminItems, sellerActions, adminActions } from './layouts.mjs';

const section = (title, inner, { id, cls = '' } = {}) => `<section class="mt-6 md:mt-8" aria-labelledby="${id}"><h2 id="${id}" class="px-gutter text-h3 md:px-0">${title}</h2><div class="mt-3 ${cls}">${inner}</div></section>`;
const chipRow = (chips, label = 'Sort and filter') => `<div class="flex gap-2 overflow-x-auto px-gutter pb-1 [scrollbar-width:none] md:px-0" role="group" aria-label="${label}">${[].concat(chips).join('')}</div>`;

/* 1 — Home */
const home = publicPage({ active: 'Home', main: `<div class="mx-auto max-w-container">
  <div class="px-gutter pt-4"><div class="pattern-geo grid gap-2 rounded-hero bg-surface-hero p-5 md:p-8"><p class="text-eyebrow uppercase text-primary">Halal Pantry Fair</p><h1 class="max-w-md text-h1">Certified halal pantry staples, up to ₱300 off</h1><p><a href="#" class="btn btn-lg">Shop the fair</a></p></div></div>
  <ul class="mx-auto mt-3 grid max-w-container grid-cols-1 gap-2 px-gutter sm:grid-cols-3" aria-label="Why shop halal here">${[['shield-check', 'Certificates checked', 'Every halal claim is verified by us'], ['snowflake', 'Cold-chain delivery', 'Frozen items ship with ice packs'], ['banknote', 'Cash on delivery', 'Pay the rider on arrival']].map(([ic, t, d]) => `<li class="flex items-center gap-3 rounded-panel border border-border bg-surface p-3"><span class="grid size-9 shrink-0 place-items-center rounded-tile bg-halal-soft text-halal">${icon(ic)}</span><span class="grid"><span class="text-label">${t}</span><span class="text-body-sm text-muted-foreground">${d}</span></span></li>`).join('')}</ul>
  ${section('Categories', categoryGrid(categories), { id: 'home-cats', cls: 'px-gutter' })}
  ${section('Vouchers for you', `<ul class="flex gap-3 overflow-x-auto px-gutter pb-1 [scrollbar-width:none] md:grid md:grid-cols-3 md:px-0">${[
    voucherCard({ title: '₱50 off Barakah Pantry', kind: 'shop' }), voucherCard({ title: '₱100 off halal groceries', min: 'Min. spend ₱999', kind: 'platform' }), voucherCard({ title: 'Free shipping up to ₱80', min: 'Min. spend ₱299', kind: 'shipping' }),
  ].map(v => `<li class="w-72 shrink-0 md:w-auto">${v}</li>`).join('')}</ul>`, { id: 'home-vouch' })}
  ${section('Daily discover', `${productGrid(products, { id: 'home-grid', cls: 'px-gutter md:px-0' })}${infiniteSentinel({ list: 'home-grid' })}`, { id: 'home-grid-h' })}
</div>` });

/* 2 — Search results */
const search = publicPage({ headerOpts: { cart: 2 }, main: `<div class="mx-auto max-w-container">
  <div class="px-gutter pt-4 md:pt-6"><h1 class="text-h2">“ajwa dates”</h1><p class="mt-0.5 text-body text-muted-foreground"><span class="tabular">1,240</span> results</p></div>
  <div class="mt-3">${chipRow([chip('Relevant', { pressed: true }), chip('Newest'), chip('Top sales'), chip('Price', { ic: 'arrow-down' }), chip('Halal certified', { pressed: true }), chip('Filters', { ic: 'sliders-horizontal' })])}</div>
  ${'<h2 class="sr-only">Results</h2>'}${productGrid(products, { id: 'sr-grid', cls: 'px-gutter pt-3 md:px-0' })}
  ${infiniteSentinel({ list: 'sr-grid' })}<div class="hidden px-gutter pb-8 lg:block">${pagination({ page: 1, total: 62 })}</div>
</div>` });

/* 3 — Category listing */
const category = publicPage({ main: `<div class="mx-auto max-w-container">
  <div class="px-gutter pt-4 md:pt-6">${breadcrumb(['Home', 'Halal Food'])}<h1 class="mt-2 text-h1">Halal Food</h1><p class="mt-1 text-body text-muted-foreground"><span class="tabular">8,412</span> products · all certificates verified</p></div>
  <div class="mt-4">${chipRow(['Meat & Poultry', 'Frozen', 'Dates & Sweets', 'Pantry', 'Beverages', 'Snacks', 'Spices & Sauces'].map(c => chip(c)), 'Subcategories')}</div>
  <div class="mt-2">${chipRow([chip('Relevant', { pressed: true }), chip('Newest'), chip('Top sales'), chip('Price', { ic: 'arrow-down' }), chip('Halal certified', { pressed: true }), chip('Free shipping'), chip('Ships frozen', { ic: 'snowflake' })])}</div>
  ${'<h2 class="sr-only">Products</h2>'}${productGrid(products, { id: 'cat-grid', cls: 'px-gutter pt-3 md:px-0' })}
  ${infiniteSentinel({ list: 'cat-grid' })}
</div>` });

/* 4 — Product detail */
const product = publicPage({ tabbar: false, headerOpts: { back: true, title: 'Product' }, main: `<div class="mx-auto max-w-container">
  <div class="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8 lg:px-gutter lg:pt-6">
    <div>${carousel({ id: 'pd-g', slides: ['Front', 'Side', 'Lid detail', 'In use'] })}</div>
    <div class="grid content-start gap-4 px-gutter py-4 lg:px-0 lg:py-0">
      <div><h1 class="text-h2">Ajwa dates 500g, premium grade, resealable tub</h1>
        <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm"><span class="inline-flex items-center gap-1">${rating(4.9, { size: 'size-4' })}</span><a href="#pd-rev" class="inline-flex min-h-touch items-center text-muted-foreground underline underline-offset-2">2.1k ratings</a><span class="text-muted-foreground">·</span><span class="text-muted-foreground">${soldCount(12400)}</span><a href="#" class="ml-auto inline-flex min-h-touch items-center gap-1 text-muted-foreground">${icon('flag', 'size-4')}Report</a></p></div>
      ${halalFacts({ body: 'IDCP', valid: 'Mar 2028' })}
      <div class="rounded-panel bg-surface-cta p-3 md:p-4">${priceBlock({ price: 649, was: 799, size: 'lg' })}<p class="mt-1 text-body-sm text-muted-foreground">Pantry Fair price · ends Nov 12</p></div>
      ${kvList([['Shipping', 'Free shipping · Taguig'], ['Returns', '7-day returns for sealed items'], ['Authenticity', 'Certificate verified by {{BRAND_NAME}}']], { cls: 'text-body' })}
      <button type="button" class="flex min-h-touch-primary w-full items-center justify-between gap-2 rounded-button border border-border-control bg-surface px-3 text-left text-body" data-ds-open="pd-var"><span><span class="text-muted-foreground">Variation:</span> Premium · 500g</span>${icon('chevron-right', 'text-muted-foreground')}</button>
      ${stickyBar()}
    </div>
  </div>
  <div class="mt-2 px-gutter md:mt-6">${shopHeader(shops[0])}</div>
  ${section('Halal certification', `<div class="grid gap-3 lg:grid-cols-2">${halalCertCard({ id: 'pd-hc' })}<section class="panel p-4" aria-labelledby="pd-decl-h"><h3 id="pd-decl-h" class="text-h4">Seller declaration</h3><p class="mt-1 text-body-sm text-muted-foreground">Made by Barakah Pantry when listing this product.</p><ul class="mt-3 grid gap-2 text-body">${['No pork, alcohol or their derivatives in the ingredients.', 'Packed and stored away from non-halal products.', 'Certificate covers the product and the packing facility.'].map(t => `<li class="flex gap-2">${icon('circle-check', 'mt-0.5 size-5 shrink-0 text-halal')}<span>${t}</span></li>`).join('')}</ul><p class="mt-3 text-body-sm text-muted-foreground">Something wrong with this claim? <a href="#" class="font-bold text-primary underline underline-offset-2">Report a concern</a>. We review halal reports first.</p></section></div>`, { id: 'pd-halal', cls: 'px-gutter lg:px-0' })}
  ${section('Product details', `<div class="card p-4">${kvList([['Origin', 'Madinah, Saudi Arabia'], ['Net weight', '500g'], ['Ingredients', 'Ajwa dates (100%)'], ['Storage', 'Cool, dry place. Refrigerate after opening.'], ['Shelf life', '12 months'], ['Stock', '42 units'], ['Ships from', 'Taguig']], { cols: 2 })}<p class="mt-4 text-body">Soft, moist Ajwa dates in a resealable tub. No added sugar or preservatives.</p></div>`, { id: 'pd-det', cls: 'px-gutter lg:px-0' })}
  ${section('Ratings & reviews', `<div class="card p-4"><div class="flex items-center gap-4 border-b border-border pb-4"><p class="text-h2"><span class="text-sale">4.9</span><span class="text-body text-muted-foreground"> / 5</span></p><div class="flex-1">${rating(4.9)}<p class="mt-0.5 text-body-sm text-muted-foreground">2.1k ratings · 864 with photos</p></div></div>${chipRow([chip('All', { pressed: true }), chip('5 stars', { count: '1.8k' }), chip('4 stars', { count: '214' }), chip('With photos', { count: '864' }), chip('With comments', { count: '1.2k' })])}${reviewCard({})}${reviewCard({ name: 'Paolo Lim', value: 5, variation: 'Standard, 250g', date: 'Oct 28, 2026', text: 'Fresh and soft, no stale smell. Seller shipped same day, bilis! Certificate was easy to check.', photos: 0, helpful: 5, reply: 'Jazakallahu khair po sa review! Enjoy your dates.' })}<p class="pt-3"><a href="#" class="btn btn-neutral btn-block">See all reviews</a></p></div>`, { id: 'pd-rev', cls: 'px-gutter lg:px-0' })}
  ${section('You may also like', `<ul class="flex gap-2 overflow-x-auto px-gutter pb-2 [scrollbar-width:none] md:px-0">${products.slice(1, 7).map((p, i) => `<li>${productCard(p, { variant: 'compact', i: i + 1 })}</li>`).join('')}</ul>`, { id: 'pd-also' })}
</div>${variationPicker({ id: 'pd-var' })}` });

/* 5 — Cart */
const cartBar = `<div class="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom,0px))] z-sticky-bar border-t border-border bg-surface shadow-sticky lg:sticky lg:bottom-0 lg:border lg:border-border lg:shadow-none">
  <div class="mx-auto flex max-w-container items-center gap-3 px-gutter py-2">
    <label class="flex min-h-touch items-center gap-2"><input type="checkbox" class="size-5 accent-primary" checked><span class="text-body">All <span class="text-muted-foreground">(2)</span></span></label>
    <button type="button" class="hidden min-h-touch items-center px-2 text-body text-muted-foreground hover:text-danger sm:flex">Delete</button>
    <span class="flex-1"></span>
    <p class="text-right text-body-sm leading-tight"><span class="block text-muted-foreground">Total (2 items)</span><span class="text-price text-sale tabular">₱1,438</span></p>
    ${btn('Checkout', { size: 'lg', cls: 'min-w-32' })}
  </div>
</div>`;
const cart = publicPage({ active: 'Me', headerOpts: { title: 'My Cart', back: true }, main: `<div class="mx-auto max-w-container pb-24 lg:pb-8">
  <h1 class="sr-only">My cart</h1>
  <div class="grid items-start gap-4 pt-2 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-gutter lg:pt-6">
    <div class="grid gap-2 md:gap-3">
      ${cartShopGroup({ id: 'cs1', shop: shops[0], items: [{ p: products[0], qty: 2 }, { p: { name: 'Medjool dates 250g, pitted', price: 289, ic: 'package' }, qty: 1, variation: 'Pitted' }] })}
      ${cartShopGroup({ id: 'cs2', shop: shops[1], items: [{ p: products[4], qty: 1, variation: '300g' }, { p: products[1], qty: 1, unavailable: 'Out of stock — remove to checkout' }], voucher: false })}
      <a href="#" class="flex min-h-touch items-center gap-2 bg-surface px-gutter text-body-sm text-sale md:rounded-panel md:border md:border-border md:px-4">${icon('ticket', 'size-4')}<span class="flex-1 font-bold">{{BRAND_NAME}} vouchers</span><span class="text-primary">Select or enter code</span>${icon('chevron-right', 'size-4 text-muted-foreground')}</a>
    </div>
    <div class="hidden lg:block lg:sticky lg:top-[calc(var(--header-h)+var(--nav-h)+var(--announce-h)+1rem)]">${orderSummary({})}${btn('Checkout', { size: 'lg', block: true, cls: 'mt-3' })}</div>
  </div>
</div>${cartBar}` });

/* 6 — Checkout */
const coBar = `<div class="fixed inset-x-0 bottom-0 z-sticky-bar border-t border-border bg-surface shadow-sticky pb-safe lg:hidden">
  <div class="mx-auto flex max-w-container items-center gap-3 px-gutter py-2"><p class="text-right text-body-sm leading-tight"><span class="block text-muted-foreground">Total payment</span><span class="text-price-lg text-sale tabular">₱1,438</span></p><span class="flex-1"></span>${btn('Place order', { size: 'lg', cls: 'min-w-40' })}</div>
</div>`;
const checkout = publicPage({ tabbar: false, headerOpts: { title: 'Checkout', back: true, desktopNav: false }, main: `<div class="mx-auto max-w-container pb-24 lg:pb-8">
  <h1 class="sr-only">Checkout</h1>
  <div class="grid items-start gap-2 pt-2 md:gap-3 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-6 lg:px-gutter lg:pt-6">
    <div class="grid gap-2 md:gap-3">
      ${addressCard()}
      <section class="bg-surface md:rounded-panel md:border md:border-border" aria-labelledby="co-items"><h2 id="co-items" class="flex items-center gap-2 border-b border-border px-gutter py-2 text-label md:px-4">${icon('store', 'size-4')}Barakah Pantry ${verifiedBadge({ label: 'Official', tone: 'solid', size: 'sm' })}</h2>
        <ul class="divide-y divide-border px-gutter md:px-4">${[{ p: products[0], qty: 2, v: 'Premium, 500g' }, { p: { name: 'Medjool dates 250g, pitted', price: 289, ic: 'package' }, qty: 1, v: 'Pitted' }].map((it, n) => `<li class="flex gap-3 py-3"><div class="w-16 shrink-0 overflow-hidden rounded-tile"><div class="grid aspect-square w-full place-items-center bg-surface-muted text-muted-foreground" aria-hidden="true">${icon('package', 'size-6')}</div></div><div class="grid min-w-0 flex-1 gap-0.5"><p class="line-clamp-2 text-body">${it.p.name}</p><p class="text-body-sm text-muted-foreground">${it.v} · ×${it.qty}</p></div><p class="text-label tabular">${peso(it.p.price * it.qty)}</p></li>`).join('')}</ul>
        <div class="grid gap-3 border-t border-border px-gutter py-3 md:px-4"><label for="co-msg" class="sr-only">Message for seller</label><input id="co-msg" class="field" placeholder="Message for seller (optional)"></div>
      </section>
      <div class="bg-surface px-gutter py-3 md:rounded-panel md:border md:border-border md:p-4">${shippingOptionPicker({ id: 'co-ship' })}</div>
      <button type="button" class="flex min-h-touch items-center gap-2 bg-surface px-gutter text-body-sm md:rounded-panel md:border md:border-border md:px-4" data-ds-open="co-vouch">${icon('ticket', 'size-4 text-sale')}<span class="flex-1 text-left font-bold">Vouchers</span><span class="text-primary">2 available</span>${icon('chevron-right', 'size-4 text-muted-foreground')}</button>
      <div class="bg-surface px-gutter py-3 md:rounded-panel md:border md:border-border md:p-4">${paymentMethodPicker({ id: 'co-pay' })}</div>
    </div>
    <div class="px-gutter lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:px-0">${orderSummary({ cod: true, halal: true })}${btn('Place order', { size: 'lg', block: true, cls: 'mt-3 hidden lg:flex' })}</div>
  </div>
</div>${coBar}${voucherPicker({ id: 'co-vouch' })}` });

/* 7 — Orders */
const orderTabs = tabs({ id: 'ord', label: 'Order status', selected: 3, items: ['All', 'To Pay', 'To Ship', 'To Receive', 'Completed', 'Cancelled', 'Return/Refund'], counts: { 1: 1, 3: 2 }});
const orders = accountPage({ active: 'My orders', main: `<h1 class="text-h1">My orders</h1>
<div class="mt-4 -mx-gutter bg-surface md:mx-0 md:rounded-panel md:border md:border-border">${orderTabs}
  <div class="grid gap-2 p-2 md:gap-3 md:p-4"><h2 class="sr-only">Orders</h2>
    ${orderCard({ status: 'To Receive', note: 'Parcel is out for delivery', total: 1438 })}
    ${orderCard({ shop: 'Mindanao Halal Meats', status: 'To Receive', note: 'Arriving tomorrow', total: 289, items: [{ p: products[4], qty: 1, v: '300g' }], actions: ['Order received'], secondary: ['Contact seller', 'Track order'] })}
  </div>
</div>` });

/* 8 — Order detail */
const orderDetail = accountPage({ active: 'My orders', main: `
<a href="#" class="inline-flex min-h-touch items-center gap-1 text-label text-primary">${icon('arrow-left', 'size-4')}Back to orders</a>
<div class="mt-2 flex flex-wrap items-center gap-2"><h1 class="text-h1">Order <span class="tabular">#240311-0042</span></h1>${badge('To Receive', 'info')}</div>
<p class="mt-1 text-body-sm text-muted-foreground">Placed Oct 30, 2026 · Barakah Pantry · <a href="#" class="font-bold text-primary underline underline-offset-2">Invoice</a></p>
<div class="mt-4 rounded-panel border border-info bg-info-soft p-3 text-body-sm text-info">${icon('truck', 'inline size-4 align-[-0.15em]')} Out for delivery — arriving today before 9 PM.</div>
<div class="mt-6 grid items-start gap-6 lg:grid-cols-2">
  <section class="card p-4" aria-labelledby="od-tr"><h2 id="od-tr" class="text-h4">Tracking</h2><div class="mt-4">${timeline([
    ['Out for delivery', 'Today, 8:12 AM', 'Rider Juan D. · Quezon City hub', 'current'],
    ['Arrived at sorting center', 'Today, 5:40 AM', 'QC North hub', 'done'],
    ['Shipped', 'Oct 31, 6:02 PM', 'Standard Delivery · waybill 8834-2210', 'done'],
    ['Order placed', 'Oct 30, 2:15 PM', '', 'done'],
  ])}</div></section>
  <div class="grid gap-4">
    <section class="card p-4" aria-labelledby="od-addr"><h2 id="od-addr" class="text-h4">Delivery address</h2><div class="mt-3">${addressCard({ action: false })}</div></section>
    <section class="card p-4" aria-labelledby="od-items"><h2 id="od-items" class="text-h4">Items</h2><ul class="mt-3 divide-y divide-border"><li class="flex gap-3 py-2"><div class="grid aspect-square w-16 place-items-center rounded-tile bg-surface-muted text-muted-foreground" aria-hidden="true">${icon('package', 'size-6')}</div><div class="grid flex-1 gap-0.5"><p class="text-body">Ajwa dates 500g, premium grade</p><p class="text-body-sm text-muted-foreground">Premium, 500g · ×2</p></div><p class="text-label tabular">₱1,298</p></li><li class="flex gap-3 py-2"><div class="grid aspect-square w-16 place-items-center rounded-tile bg-surface-muted text-muted-foreground" aria-hidden="true">${icon('package', 'size-6')}</div><div class="grid flex-1 gap-0.5"><p class="text-body">Medjool dates 250g, pitted</p><p class="text-body-sm text-muted-foreground">Pitted · ×1</p></div><p class="text-label tabular">₱289</p></li></ul></section>
    ${orderSummary({ cod: true, halal: true })}
    <div class="flex flex-wrap gap-2">${btn('Order received', { size: 'lg', cls: 'flex-1' })}${btn('Contact seller', { variant: 'outline', size: 'lg', cls: 'flex-1' })}${btn('Return / refund', { variant: 'neutral', cls: 'w-full' })}</div>
  </div>
</div>` });

/* 9 — Chat (split on md+) */
const chat = publicPage({ active: 'Chat', mainCls: 'md:h-[calc(100dvh-var(--header-h)-env(safe-area-inset-top,0px))] lg:h-[calc(100dvh-var(--header-h)-var(--nav-h)-var(--announce-h)-env(safe-area-inset-top,0px))]', main: `
<h1 class="sr-only">Chats</h1>
<div class="md:flex md:h-full md:min-h-0">
  <div class="bg-surface md:flex md:w-[var(--chat-list-w)] md:shrink-0 md:flex-col md:overflow-y-auto md:border-r md:border-border">${chatList()}</div>
  <div class="hidden min-w-0 flex-1 md:flex md:flex-col">
    <div class="flex items-center gap-2 border-b border-border bg-surface px-2 py-1">${avatar('Barakah Pantry', { status: 'online', size: 'sm', label: false })}<div class="min-w-0 flex-1"><p class="truncate text-label">Barakah Pantry</p><p class="text-caption text-success">Online</p></div>${iconBtn('store', 'Visit shop')}${iconBtn('ellipsis-vertical', 'More')}</div>
    ${chatThread({ id: 'chat-scr' })}
  </div>
</div>` });

/* 10 — Notifications */
const notifs = [
  { ic: 'truck', tone: 'bg-info-soft text-info', title: 'Parcel out for delivery', text: 'Order #240311-0042 will arrive today. Prepare ₱1,438 if paying by COD.', time: '2h ago' },
  { ic: 'message-circle', tone: 'bg-primary-soft text-primary', title: 'Barakah Pantry replied', text: '“Yes po, available pa ang Ajwa. Ship today if you order before 3 PM!”', time: '3h ago' },
  { ic: 'tag', tone: 'bg-sale-soft text-sale', title: 'Halal Pantry Fair vouchers are live', text: 'Claim up to ₱300 off halal groceries before Nov 12. Free shipping vouchers restocked.', time: '5h ago' },
];
const notifsOld = [
  { ic: 'package', tone: 'bg-success-soft text-success', title: 'Order delivered', text: 'Order #240318-0017 was delivered. Rate your purchase to earn coins.', time: 'Yesterday', unread: false, thumb: true },
  { ic: 'ticket', tone: 'bg-warning-soft text-warning', title: 'Voucher expiring', text: 'Your ₱100 platform voucher expires in 2 days.', time: 'Oct 29', unread: false },
];
const notifications = publicPage({ active: 'Notifications', main: `<div class="mx-auto max-w-2xl">
  <div class="flex items-center justify-between px-gutter pt-4 md:pt-6"><h1 class="text-h1">Notifications</h1><button type="button" class="min-h-touch px-2 text-label text-primary">Mark all read</button></div>
  <section aria-labelledby="nt-t" class="mt-4"><h2 id="nt-t" class="px-gutter text-eyebrow uppercase text-muted-foreground">Today</h2><ul class="mt-1 divide-y divide-border bg-surface md:rounded-panel md:border md:border-border">${notifs.map(n => notificationItem(n)).join('')}</ul></section>
  <section aria-labelledby="nt-e" class="mt-4"><h2 id="nt-e" class="px-gutter text-eyebrow uppercase text-muted-foreground">Earlier</h2><ul class="mt-1 divide-y divide-border bg-surface md:rounded-panel md:border md:border-border">${notifsOld.map(n => notificationItem(n)).join('')}</ul></section>
</div>` });

/* 11 — Shop page */
const shop = publicPage({ main: `<div class="mx-auto max-w-container">
  <div class="px-gutter pt-4 md:pt-6">${shopHeader(shops[0])}</div>
  <div class="mt-4 bg-surface md:mt-6 md:rounded-panel md:border md:border-border">${tabs({ id: 'shop-t', label: 'Shop sections', items: ['All products', 'Bestsellers', 'New arrivals', 'Sale'], counts: { 0: 86 }})}
    <div class="p-gutter md:p-4"><h2 class="sr-only">Products</h2>${chipRow([chip('Relevant', { pressed: true }), chip('Top sales'), chip('Price', { ic: 'arrow-down' })])}${productGrid(products, { id: 'shop-grid', cls: 'pt-3' })}${infiniteSentinel({ list: 'shop-grid' })}</div>
  </div>
</div>` });

/* 12 — Seller dashboard */
const sellerDash = sideShell({ id: 'sel', label: 'Seller Centre', items: sellerItems, active: 'Dashboard', actions: sellerActions, main: `<div class="mx-auto max-w-container p-gutter py-4 lg:py-6">
  <div class="flex flex-wrap items-baseline justify-between gap-2"><h1 class="text-h1">Assalamu alaikum, Barakah Pantry</h1><p class="text-body-sm text-muted-foreground">Wed, Nov 4</p></div>
  ${banner({ tone: 'warning', title: 'Halal certificate expires in 7 days', text: 'Upload a renewal to keep 12 listings visible. Listings are hidden the day after expiry.', action: 'Upload renewal', cls: 'mt-4' })}
  <section class="mt-5" aria-labelledby="sd-t"><h2 id="sd-t" class="text-h4">To do</h2><div class="mt-3">${taskGrid(tasks)}</div></section>
  <section class="mt-6" aria-labelledby="sd-s"><h2 id="sd-s" class="text-h4">Sales snapshot</h2><div class="mt-3 grid gap-3 sm:grid-cols-3">${statCard({ label: 'Sales today', value: '₱12,480', delta: '18%', ic: 'chart-line' })}${statCard({ label: 'Orders today', value: '9', delta: '2', ic: 'package' })}${statCard({ label: 'Visitors', value: '342', delta: '4%', up: false, ic: 'users' })}</div></section>
  <div class="mt-6">${salesChart({ id: 'sd-chart' })}</div>
  <section class="mt-6" aria-labelledby="sd-o"><div class="flex items-center justify-between"><h2 id="sd-o" class="text-h4">Orders to ship</h2><a href="#" class="inline-flex min-h-touch items-center px-2 text-label text-primary">View all</a></div><div class="mt-3">${orderList([{}, { id: '#240311-0041', buyer: 'Jose Reyes', items: 1, total: 499, due: 'Ship by tomorrow', urgent: false, pay: 'COD' }])}</div></section>
</div>` });

/* 13 — Seller product form */
const sellerForm = sideShell({ id: 'sel', label: 'Seller Centre', items: sellerItems, active: 'Products', actions: sellerActions, main: `<div class="mx-auto max-w-4xl p-gutter pb-28 pt-4 lg:pt-6">
  <div class="flex items-center gap-2"><a href="#" class="inline-flex min-h-touch items-center gap-1 text-label text-primary">${icon('arrow-left', 'size-4')}Products</a></div>
  <h1 class="mt-2 text-h1">Add product</h1>
  <div class="mt-5 grid gap-4">${productFormSections('spf').join('')}
    <section class="panel" aria-labelledby="spf-var"><header class="border-b border-border px-4 py-3"><h2 id="spf-var" class="text-h4">Variations</h2><p class="text-body-sm text-muted-foreground">Price and stock per combination.</p></header><div class="p-4">${variantMatrix({ id: 'spf-vm' })}</div></section>
  </div>
</div>${productFormBar()}` });

/* 14 — Admin moderation queue + detail */
const adminQueue = sideShell({ id: 'adm', label: 'Admin', items: adminItems, active: 'Queue', actions: adminActions, mainCls: 'md:h-[calc(100dvh-var(--header-h)-env(safe-area-inset-top,0px))] md:overflow-hidden', main: `
<div class="md:grid md:h-full md:min-h-0 md:grid-cols-[minmax(20rem,25rem)_minmax(0,1fr)]">
  <div class="flex min-h-0 flex-col bg-surface md:overflow-y-auto md:border-r md:border-border">
    <h1 class="px-gutter pt-4 text-h1 md:px-4">Moderation queue</h1>
    <p class="px-gutter text-body-sm text-muted-foreground md:px-4"><span class="tabular">24</span> items · <span class="font-bold text-danger">2 SLA breached</span></p>
    <div class="mt-2">${filterBar({ id: 'aqf' })}</div>
    ${queueList()}
  </div>
  <div class="hidden min-h-0 md:block">${detailPane({ id: 'aqp', back: false })}</div>
</div>` });

/* 15 — Admin dashboard */
const adminDash = sideShell({ id: 'adm', label: 'Admin', items: adminItems, active: 'Dashboard', actions: adminActions, main: `<div class="mx-auto max-w-container p-gutter py-4 lg:py-6">
  <h1 class="text-h1">Moderation overview</h1>
  <div class="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">${statCard({ label: 'Items in queue', value: '24', ic: 'inbox' })}${statCard({ label: 'SLA breached', value: '2', delta: '1', up: false, ic: 'alarm-clock', hint: 'oldest 5h 10m' })}${statCard({ label: 'Certificates expiring, 30 days', value: '9', ic: 'calendar-clock', hint: 'next: Nov 8' })}${statCard({ label: 'Reports, 7 days', value: '156', delta: '9%', up: false, ic: 'flag' })}</div>
  <div class="mt-6">${salesChart({ id: 'ad-chart', title: 'Queue volume, last 7 days', data: [['Mon', 18], ['Tue', 22], ['Wed', 15], ['Thu', 27], ['Fri', 31], ['Sat', 19], ['Sun', 24]], fmt: (n) => `${n} items`, noun: 'Items', totalLabel: 'items' })}</div>
  <section class="mt-6" aria-labelledby="ad-q"><div class="flex items-center justify-between"><h2 id="ad-q" class="text-h4">Highest priority</h2><a href="#" class="inline-flex min-h-touch items-center px-2 text-label text-primary">Open queue</a></div><div class="mt-3 overflow-hidden rounded-panel border border-border bg-surface">${queueList({ items: queue.slice(0, 4), select: false })}</div></section>
</div>` });

export const screens = [
  { slug: 'home', name: 'Home', desc: 'Storefront landing: promo hero, categories, voucher rail, infinite product grid.', html: home, uses: ['header', 'bottom-tab-bar', 'category-tile', 'voucher-card', 'product-card', 'infinite-scroll'] },
  { slug: 'search', name: 'Search results', desc: 'Result count, sort/filter chips, infinite grid on phone–tablet and pagination on desktop.', html: search, uses: ['search-input', 'badge-chip', 'product-grid', 'infinite-scroll', 'pagination'] },
  { slug: 'category', name: 'Category listing', desc: 'Breadcrumb, subcategory chips, sort/filter rail, dense product grid.', html: category, uses: ['breadcrumb', 'badge-chip', 'product-grid', 'infinite-scroll'] },
  { slug: 'product', name: 'Product detail', desc: 'Gallery, price block, variation sheet, shop card, reviews, sticky action bar.', html: product, uses: ['carousel-gallery', 'price-block', 'variation-picker', 'sticky-action-bar', 'shop-card', 'review-card'] },
  { slug: 'cart', name: 'Cart', desc: 'Shop-grouped items with select-all, vouchers, totals, sticky checkout bar.', html: cart, uses: ['cart-item', 'voucher-card', 'order-summary', 'sticky-action-bar', 'quantity-stepper'] },
  { slug: 'checkout', name: 'Checkout', desc: 'One-page checkout: address, items, shipping, vouchers, payment, sticky Place order.', html: checkout, uses: ['address-card', 'shipping-option-picker', 'payment-method-picker', 'voucher-picker', 'order-summary', 'sticky-action-bar'] },
  { slug: 'orders', name: 'Orders', desc: 'Buyer orders with status tabs inside the account shell.', html: orders, uses: ['account-shell', 'tabs', 'order-card'] },
  { slug: 'order-detail', name: 'Order detail', desc: 'Tracking timeline, address, items, payment details, actions.', html: orderDetail, uses: ['timeline-order-tracker', 'address-card', 'order-summary', 'banner-alert'] },
  { slug: 'chat', name: 'Chat', desc: 'Conversation list on phone; list + thread split from tablet up.', html: chat, uses: ['chat-list', 'chat-thread', 'chat-composer', 'bottom-tab-bar'] },
  { slug: 'notifications', name: 'Notifications', desc: 'Grouped notifications with unread states and mark-all-read.', html: notifications, uses: ['notification-item', 'bottom-tab-bar'] },
  { slug: 'shop', name: 'Shop page', desc: 'Shop header with stats, section tabs, product grid.', html: shop, uses: ['shop-header', 'tabs', 'product-grid'] },
  { slug: 'seller-dashboard', name: 'Seller dashboard', desc: 'To-do tasks, sales snapshot, accessible sales chart, urgent orders.', html: sellerDash, uses: ['task-card', 'stat-card', 'sales-chart', 'order-row'] },
  { slug: 'seller-product-form', name: 'Seller product form', desc: 'Sectioned listing editor with variant matrix and sticky publish bar.', html: sellerForm, uses: ['product-form', 'variant-matrix', 'image-uploader', 'sticky-action-bar'] },
  { slug: 'admin-queue', name: 'Admin moderation queue', desc: 'Filterable queue; item detail in a master-detail split from tablet up.', html: adminQueue, uses: ['moderation-queue-item', 'queue-filter-bar', 'moderation-detail-pane', 'bulk-action-bar'] },
  { slug: 'admin-dashboard', name: 'Admin dashboard', desc: 'Queue metrics, volume chart, highest-priority items.', html: adminDash, uses: ['stat-card', 'sales-chart', 'moderation-queue-item'] },
];
