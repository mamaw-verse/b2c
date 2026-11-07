// Phase 5 layout shells + shared page-chrome helpers imported by screens.mjs.
import { icon, iconBtn, btn, avatar } from './ui/core.mjs';
import { header, bottomTabBar, sidebar } from './ui/nav.mjs';
import { dialog } from './ui/feedback.mjs';

export const skip = `<a href="#main" class="fixed left-2 top-2 z-toast flex min-h-touch -translate-y-24 items-center rounded-button bg-primary px-4 text-label text-primary-foreground focus:translate-y-0">Skip to content</a>`;
/* Site footer: trust strip, 5 link columns + brand block, legal bar.
   Below 640px each group is a disclosure (details/summary; the port uses a
   button with aria-expanded). All copy comes from config — never hardcode the brand. */
const footLink = (l) => `<li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">${l}</a></li>`;
const footGroup = (h, links) => `<nav aria-label="${h}" class="sm:flex sm:flex-col sm:gap-3"><details class="group sm:hidden"><summary class="flex min-h-touch w-full cursor-pointer list-none items-center justify-between gap-2 text-left text-label text-foreground [&::-webkit-details-marker]:hidden">${h}${icon('chevron-down', 'shrink-0 text-muted-foreground transition-transform duration-token group-open:rotate-180')}</summary><ul class="flex flex-col gap-3 pb-3">${links.map(footLink).join('')}</ul></details><p class="hidden text-label text-foreground sm:block">${h}</p><ul class="hidden flex-col gap-3 sm:flex">${links.map(footLink).join('')}</ul></nav>`;
const FOOT_GROUPS = [
  ['Shop', ['Categories', 'Halal Food', 'Meat & Seafood', 'Dates & Sweets', 'Modest Fashion', 'Prayer Essentials', 'Books & Quran', 'Vouchers']],
  ['Support', ['Help centre', 'Track order', 'Returns & refunds', 'Contact us', 'Report a listing']],
  ['Halal & trust', ['Halal verification policy', 'How we verify sellers', 'Certifier list', 'Community review of religious items']],
  ['Sell', ['Sell on {{BRAND_NAME}}', 'Seller centre', 'Onboarding guide', 'Halal certification guide']],
  ['Company', ['About', 'Terms', 'Privacy (Data Privacy Act notice)', 'Cookies']],
];
const chip = (l) => `<span class="rounded-badge border border-border bg-surface px-1.5 py-0.5">${l}</span>`;
export const foot = `<footer class="border-t border-border bg-surface-subtle pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom,0px))] md:pb-0"><div class="mx-auto max-w-container px-gutter">
  <div class="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border py-4">
    <p class="flex items-center gap-2 text-body-sm font-medium text-foreground">${icon('shield-check', 'size-4 shrink-0 text-halal')}Every halal claim is verified by {{BRAND_NAME}}</p>
    <p class="flex flex-wrap items-center gap-1.5 text-caption text-muted-foreground">${icon('wallet', 'size-4')}<span class="sr-only">Accepted payments:</span>${['COD', 'GCash', 'Maya', 'Cards', 'Bank transfer'].map(chip).join('')}</p>
    <p class="flex flex-wrap items-center gap-1.5 text-caption text-muted-foreground">${icon('truck', 'size-4')}<span class="sr-only">Delivery partners:</span>${['J&T Express', 'Lalamove', 'Ninja Van'].map(chip).join('')}</p>
  </div>
  <div class="grid gap-y-1 py-4 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-8 sm:py-8 lg:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))]">
    <div class="flex flex-col gap-3"><p class="text-label text-foreground">{{BRAND_NAME}}</p><p class="max-w-xs text-body-sm text-muted-foreground">Every halal claim verified, delivered across the Philippines.</p><p class="flex items-start gap-2 text-body-sm text-muted-foreground">${icon('mail', 'mt-0.5 size-4 shrink-0')}<span><a href="mailto:support@example.com" class="underline underline-offset-2 hover:text-primary">support@example.com</a><br>Mon–Sat, 9:00–18:00 (PHT)</span></p></div>
    ${FOOT_GROUPS.map(([h, l]) => footGroup(h, l)).join('')}
  </div>
  <div class="flex flex-col gap-1 border-t border-border py-4 text-caption text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><p>© ${new Date().getFullYear()} {{BRAND_NAME}}</p><p>DTI Business Name Reg. No. 0000-0000</p></div>
</div></footer>`;

/* Public chrome: sticky header + bottom tabs (below lg) + footer. */
export const publicPage = ({ active = 'Home', main, mainCls = '', headerOpts = {}, tabbar = true } = {}) =>
  `${skip}${header(headerOpts)}<main id="main" class="${tabbar ? 'pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom,0px))]' : 'pb-sticky-bar'} lg:pb-0 ${mainCls}">${main}</main>${foot}${tabbar ? bottomTabBar({ active }) : ''}`;

export const accountItems = [['package', 'My orders'], ['map-pin', 'Addresses'], ['credit-card', 'Payment methods'], ['ticket', 'Vouchers'], ['heart', 'Favourites'], ['star', 'My reviews'], ['settings', 'Settings'], ['circle-help', 'Help']];
export const sellerItems = [['gauge', 'Dashboard'], ['package', 'Orders', 4], ['boxes', 'Products'], ['message-circle', 'Chats', 3], ['percent', 'Marketing'], ['wallet', 'Finance'], ['settings', 'Shop settings']];
export const adminItems = [['gauge', 'Dashboard'], ['inbox', 'Queue', 24], ['flag', 'Reports'], ['users', 'Users'], ['scroll-text', 'Audit log'], ['settings', 'Settings']];

/* Account shell: public chrome + sub-nav — drawer (phone) / rail (md) / sidebar (lg). */
export const accountPage = ({ active = 'My orders', main } = {}) => `${publicPage({ active: 'Me', main: `<div class="mx-auto max-w-container md:grid md:grid-cols-[4.5rem_minmax(0,1fr)] lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
  <div class="px-gutter pt-3 md:hidden">${btn('Account menu', { variant: 'neutral', icon: 'menu', cls: 'w-full justify-start', attrs: { 'data-ds-open': 'acc-nav' } })}</div>
  <div class="hidden border-r border-border py-4 md:block"><div class="sticky top-[calc(var(--header-h)+env(safe-area-inset-top,0px))] px-2 lg:px-3">${sidebar({ items: accountItems, active, label: 'Account', heading: 'My account' })}</div></div>
  <div class="min-w-0 p-gutter md:p-6 lg:p-8">${main}</div>
</div>` })}${dialog({ id: 'acc-nav', kind: 'drawer', title: 'My account', body: sidebar({ items: accountItems, active, label: 'Account', mode: 'full' }) })}`;

/* Seller / admin shell: workspace header; drawer (phone), fixed rail (md), fixed sidebar (lg). */
export const sideShell = ({ id, label, items, active, actions = '', main, mainCls = '' } = {}) => `${skip}
<header class="sticky top-0 z-header border-b border-border bg-surface pt-safe">
  <div class="flex h-header items-center gap-2 px-gutter">
    ${iconBtn('menu', 'Open menu', { cls: 'md:hidden', attrs: { 'data-ds-open': `${id}-nav` } })}
    <a href="#" class="flex min-h-touch min-w-0 items-center gap-2 rounded-button text-h4 text-primary" aria-label="{{BRAND_NAME}} ${label}">
      <span class="grid size-8 shrink-0 place-items-center rounded-tile bg-primary text-primary-foreground" aria-hidden="true">${icon('store', 'size-5')}</span>
      <span class="truncate">{{BRAND_NAME}} <span class="font-normal text-muted-foreground">· ${label}</span></span></a>
    <span class="flex-1"></span>${actions}
  </div>
</header>
<aside class="fixed bottom-0 left-0 top-[calc(var(--header-h)+env(safe-area-inset-top,0px))] hidden w-18 border-r border-border bg-surface md:block lg:w-[var(--sidebar-w)]">
  <div class="h-full overflow-y-auto p-2 lg:p-3">${sidebar({ items, active, label: `${label} navigation` })}</div>
</aside>
${dialog({ id: `${id}-nav`, kind: 'drawer', title: `${label} menu`, body: sidebar({ items, active, label: `${label} navigation`, mode: 'full' }) })}
<main id="main" class="min-w-0 md:ps-18 lg:ps-[var(--sidebar-w)] ${mainCls}">${main}</main>`;

export const sellerActions = `${btn('View shop', { variant: 'neutral', icon: 'store', cls: 'hidden lg:inline-flex' })}${iconBtn('bell', 'Notifications', { count: 2, href: '#' })}<a href="#" class="flex min-h-touch items-center gap-2 rounded-button px-2 text-label hover:bg-surface-muted">${avatar('Barakah Pantry', { size: 'sm', label: false })}<span class="sr-only md:not-sr-only">Barakah Pantry</span></a>`;
export const adminActions = `${iconBtn('bell', 'Notifications', { count: 5, href: '#' })}<a href="#" class="flex min-h-touch items-center gap-2 rounded-button px-2 text-label hover:bg-surface-muted">${avatar('Jun Dela Cruz', { size: 'sm', label: false })}<span class="sr-only md:not-sr-only">Jun</span></a>`;

/* Auth shell: centred card, minimal chrome. */
export const authPage = ({ title = 'Log in', inner } = {}) => `${skip}
<main id="main" class="grid min-h-dvh place-items-center px-gutter py-10">
  <div class="w-full max-w-sm">
    <p class="mb-6 flex items-center justify-center gap-2 text-h3 text-primary"><span class="grid size-10 place-items-center rounded-tile bg-primary text-primary-foreground" aria-hidden="true">${icon('store')}</span>{{BRAND_NAME}}</p>
    <div class="card p-5 md:p-6">${inner}</div>
    <p class="mt-4 flex min-h-touch items-center justify-center gap-1 text-body-sm text-muted-foreground">New here? <a href="#" class="inline-flex min-h-touch items-center px-1 font-bold text-primary underline underline-offset-2">Create an account</a></p>
  </div>
</main>`;

const demoContent = (title, text = 'Content area — shells only define the chrome and navigation.') => `<div class="mx-auto max-w-container p-gutter py-8">
  <h1 class="text-h1">${title}</h1><p class="mt-2 max-w-prose text-body text-muted-foreground">${text}</p>
  <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">${[1, 2, 3].map(i => `<div class="card grid h-32 place-items-center p-4"><p class="text-body-sm text-muted-foreground">Content ${i}</p></div>`).join('')}</div>
</div>`;

export const layouts = [
  { slug: 'public', name: 'Public shell', desc: 'Storefront: sticky search header, bottom tab bar on phone/tablet (omitted on pages that have their own sticky action bar), category nav and footer on desktop.', html: publicPage({ active: 'Home', main: demoContent('Public shell') }),
    uses: ['header', 'bottom-tab-bar', 'search-input', 'icon-button'],
    tiers: ['Sticky header with search + cart/chat; bottom tab bar (Home, Categories, Chat, Notifications, Me); no footer links row.', 'Same chrome; header gains taller row.', 'Announcement bar, full category nav, account links; bottom tabs hidden; footer visible.'] },
  { slug: 'account', name: 'Account shell', desc: 'Buyer account inside the public chrome; sub-nav is a drawer on phone, rail on tablet, sidebar on desktop.', html: accountPage({ active: 'My orders', main: `<h1 class="text-h1">My orders</h1><p class="mt-2 text-body text-muted-foreground">Account content area.</p>` }),
    uses: ['header', 'bottom-tab-bar', 'sidebar', 'drawer'],
    tiers: ['“Account menu” button opens the nav drawer; bottom tabs stay for top-level sections.', 'Collapsed rail (icons only, `title` labels).', 'Fixed-width sidebar `--sidebar-w` with full labels.'] },
  { slug: 'seller', name: 'Seller shell', desc: 'Seller center: workspace header, drawer on phone, rail on tablet, fixed sidebar on desktop.', html: sideShell({ id: 'sel', label: 'Seller Centre', items: sellerItems, active: 'Dashboard', actions: sellerActions, main: demoContent('Seller shell', 'Seller workspace content area.') }),
    uses: ['sidebar', 'drawer', 'icon-button', 'avatar'],
    tiers: ['Hamburger opens the nav drawer.', 'Fixed 4.5rem rail under the header.', 'Fixed `--sidebar-w` sidebar; content offset.'] },
  { slug: 'admin', name: 'Admin shell', desc: 'Moderation console: same three-tier chrome as Seller, with queue-first navigation.', html: sideShell({ id: 'adm', label: 'Admin', items: adminItems, active: 'Queue', actions: adminActions, main: demoContent('Admin shell', 'Admin console content area.') }),
    uses: ['sidebar', 'drawer', 'icon-button', 'avatar'],
    tiers: ['Hamburger opens the nav drawer.', 'Fixed 4.5rem rail under the header.', 'Fixed `--sidebar-w` sidebar; content offset.'] },
  { slug: 'auth', name: 'Auth shell', desc: 'Minimal centred card for login, signup, OTP and password reset — no navigation chrome.', html: authPage({ inner: `<h1 class="text-h2">Log in</h1><form class="mt-4 grid gap-4"><div class="grid gap-1.5"><label for="auth-e" class="text-label">Email or phone</label><input id="auth-e" class="field" autocomplete="username" enterkeyhint="next"></div><div class="grid gap-1.5"><label for="auth-p" class="text-label">Password</label><input id="auth-p" type="password" class="field" autocomplete="current-password" enterkeyhint="done"></div>${btn('Log in', { size: 'lg', block: true, type: 'submit' })}<a href="#" class="inline-flex min-h-touch items-center justify-center text-body-sm font-bold text-primary">Forgot password?</a></form>` }),
    uses: ['button', 'text-field'],
    tiers: ['Full-width card, 360px base; button full width.', 'Centred card, max-width 24rem.', 'Same; background may add a subtle panel in ports.'] },
];
