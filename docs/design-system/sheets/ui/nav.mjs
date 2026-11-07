import { cx, icon, iconBtn, btn, esc, avatar } from './core.mjs';
import { searchInput } from './forms.mjs';

export const tabItems = [['house', 'Home'], ['layout-grid', 'Categories'], ['message-circle', 'Chat', 3], ['bell', 'Notifications', 12], ['user', 'Me']];

/** BottomTabBar: phone + tablet storefront navigation. Hidden at lg (desktop header takes over). */
export function bottomTabBar({ active = 'Home', fixed = true, items = tabItems, cls } = {}) {
  return `<nav aria-label="Main" class="${cx(fixed ? 'fixed inset-x-0 bottom-0 z-header' : 'relative', 'border-t border-border bg-surface pb-safe lg:hidden', cls)}">
  <ul class="mx-auto flex max-w-xl">
    ${items.map(([ic, label, count]) => {
      const hasCount = count != null && Number(count) > 0;
      return `<li class="flex-auto"><a href="#" class="relative flex h-14 min-w-touch flex-col items-center justify-center gap-0.5 whitespace-nowrap px-1 text-caption ${label === active ? 'font-bold text-primary' : 'text-muted-foreground hover:text-foreground'}"${label === active ? ' aria-current="page"' : ''}>
      <span class="relative">${icon(ic, label === active ? 'stroke-[2.5]' : '')}${hasCount ? `<span class="absolute -right-2.5 -top-1.5 grid min-w-4.5 place-items-center rounded-full bg-sale px-1 text-caption leading-[1.125rem] text-primary-foreground" aria-hidden="true">${count > 99 ? '99+' : count}</span>` : ''}</span>
      <span>${label}</span>${hasCount ? `<span class="sr-only">, ${count} unread</span>` : ''}</a></li>`;
    }).join('')}
  </ul>
</nav>`;
}

/** Storefront header. Phone/tablet: sticky search row with cart + chat. Desktop: logo, wide search, account links, category nav. */
export function header({ fixed = true, cart = 2, chat = 3, back, title, id = 'hdr', cls, desktopNav = true } = {}) {
  const logo = `<a href="#" class="flex min-h-touch min-w-touch shrink-0 items-center gap-2 text-h4 text-primary max-md:hidden" aria-label="{{BRAND_NAME}} home"><span class="grid size-8 place-items-center rounded-tile bg-primary text-primary-foreground" aria-hidden="true">${icon('store', 'size-5')}</span><span class="hidden lg:inline">{{BRAND_NAME}}</span></a>`;
  return `<header class="${cx(fixed && 'sticky top-0', 'z-header border-b border-border bg-surface pt-safe', cls)}">
  <div class="hidden min-h-[var(--announce-h)] items-center bg-surface-inverse text-caption text-foreground-inverse lg:flex"><p class="mx-auto w-full max-w-container px-gutter">Free shipping over ₱499 · Every halal claim is checked by {{BRAND_NAME}}</p></div>
  <div class="mx-auto flex h-header max-w-container items-center gap-2 px-gutter md:gap-3 lg:gap-6">
    ${back ? `${iconBtn('arrow-left', 'Back', { cls: '-ml-2' })}<span class="hidden lg:inline">${logo}</span>` : logo}
    ${title ? `<h1 class="min-w-0 flex-1 truncate text-h4 lg:hidden">${title}</h1><div class="hidden flex-1 lg:block">${searchInput({ id: id + '-q', suggestions: ['ajwa dates', 'halal longganisa', 'prayer mat'], cls: 'max-w-2xl', placeholder: 'Search halal products' })}</div>` : `<div class="min-w-0 flex-1">${searchInput({ id: id + '-q', suggestions: ['ajwa dates', 'halal longganisa', 'prayer mat', 'hijab'], cls: 'max-w-2xl', recent: 'Recent searches', placeholder: 'Search halal products' })}</div>`}
    <div class="flex shrink-0 items-center">
      ${iconBtn('shopping-cart', 'Cart', { count: cart, href: '#' })}
      <span class="lg:hidden">${iconBtn('message-circle', 'Chat', { count: chat, href: '#' })}</span>
      <span class="hidden items-center gap-1 lg:flex">${iconBtn('bell', 'Notifications', { count: 12, href: '#' })}<a href="#" class="flex min-h-touch items-center gap-2 rounded-button px-2 text-label hover:bg-surface-muted">${avatar('Maria Santos', { size: 'sm', label: false })}<span>Maria</span></a></span>
    </div>
  </div>
  ${desktopNav ? `<nav aria-label="Categories" class="hidden h-[var(--nav-h)] border-t border-border lg:block"><ul class="mx-auto flex h-full max-w-container items-center gap-1 overflow-x-auto px-gutter">${['Halal Food', 'Meat & Seafood', 'Dates & Sweets', 'Modest Fashion', 'Prayer Essentials', 'Books & Quran'].map(c => `<li><a href="#" class="flex min-h-touch items-center whitespace-nowrap rounded-button px-3 text-label text-muted-foreground hover:bg-surface-muted hover:text-foreground">${c}</a></li>`).join('')}<li class="ml-auto flex"><a href="#" class="flex min-h-touch items-center whitespace-nowrap rounded-button px-3 text-label text-primary hover:bg-primary-soft">Sell on {{BRAND_NAME}}</a><a href="#" class="flex min-h-touch items-center rounded-button px-3 text-label text-muted-foreground hover:bg-surface-muted">Help</a></li></ul></nav>` : ''}
</header>`;
}

/** Sidebar: account / seller / admin navigation. full | rail (icons + tooltip-free labels under) */
export function sidebar({ items, active, label = 'Account', heading, cls, mode = 'responsive' }) {
  const showLabel = { responsive: 'md:sr-only lg:not-sr-only', full: '', rail: 'sr-only' }[mode];
  return `<nav aria-label="${label}" class="${cx('flex flex-col gap-1', cls)}">
  ${heading ? `<p class="px-3 pb-1 pt-2 text-eyebrow uppercase text-muted-foreground ${mode === 'responsive' ? 'md:hidden lg:block' : mode === 'rail' ? 'hidden' : ''}">${heading}</p>` : ''}
  <ul class="grid gap-0.5">${items.map(([ic, l, count]) => `<li><a href="#" class="${cx('relative flex min-h-touch items-center gap-3 rounded-button px-3 text-label', mode === 'responsive' && 'md:justify-center lg:justify-start', mode === 'rail' && 'justify-center', l === active ? 'bg-primary-soft text-primary-soft-foreground' : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground')}"${l === active ? ' aria-current="page"' : ''}${mode !== 'full' ? ` title="${esc(l)}"` : ''}>${icon(ic)}<span class="${cx('flex-1', showLabel)}">${l}</span>${count ? `<span class="${cx('badge badge-sale-solid', mode === 'responsive' && 'md:absolute md:right-1 md:top-1 md:px-1 lg:static lg:px-2', mode === 'rail' && 'absolute right-1 top-1 px-1')}">${count}</span>` : ''}</a></li>`).join('')}</ul>
</nav>`;
}

export const breadcrumb = (items) => `<nav aria-label="Breadcrumb" class="overflow-x-auto"><ol class="flex items-center gap-1 whitespace-nowrap text-body-sm text-subtle-foreground">
  ${items.map((it, i) => i === items.length - 1 ? `<li><span aria-current="page" class="font-bold text-foreground">${it}</span></li>` : `<li class="flex items-center gap-1"><a href="#" class="inline-flex min-h-touch min-w-touch items-center justify-center text-muted-foreground underline-offset-2 hover:text-primary hover:underline">${it}</a>${icon('chevron-right', 'size-4')}</li>`).join('')}
</ol></nav>`;

/** Tabs: horizontally scrollable on phone; underline indicator. */
export function tabs({ id, items, selected = 0, panels, counts = {}, label, fill, cls }) {
  return `<div class="${cls || ''}"><div role="tablist" aria-label="${label}" class="${cx('flex overflow-x-auto border-b border-border [scrollbar-width:none]', fill && 'md:justify-stretch')}">
  ${items.map((t, i) => `<button type="button" role="tab" id="${id}-tab-${i}" aria-controls="${id}-panel-${i}" aria-selected="${i === selected}" tabindex="${i === selected ? 0 : -1}" class="${cx('relative flex min-h-touch shrink-0 items-center gap-1.5 whitespace-nowrap px-4 text-label text-muted-foreground hover:text-foreground aria-selected:text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full aria-selected:after:bg-primary focus-visible:outline-offset-[-3px]', fill && 'md:flex-1 md:justify-center')}">${t}${counts[i] != null ? `<span class="badge badge-neutral">${counts[i]}</span>` : ''}</button>`).join('')}
</div>
${(panels || items.map(() => '')).map((p, i) => `<div role="tabpanel" id="${id}-panel-${i}" aria-labelledby="${id}-tab-${i}" tabindex="0" class="pt-4 focus-visible:outline-offset-0"${i === selected ? '' : ' hidden'}>${p}</div>`).join('')}</div>`;
}

/** SegmentedControl: native radios (arrow keys built in). */
export const segmented = ({ name, options, selected = 0, label, block, size = 'md' }) =>
  `<fieldset class="${block ? 'flex' : 'inline-flex'} rounded-button bg-surface-muted p-1"><legend class="sr-only">${label}</legend>
  ${options.map((o, i) => `<label class="${cx('relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-button px-3 text-label text-muted-foreground hover:text-foreground has-[:checked]:bg-surface has-[:checked]:text-foreground has-[:checked]:shadow-card-hover has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ring', size === 'sm' ? 'min-h-9 min-w-11 after:absolute after:-inset-y-1' : 'min-h-touch')}"><input type="radio" name="${name}" class="sr-only"${i === selected ? ' checked' : ''}>${o}</label>`).join('')}
</fieldset>`;

/** Pagination (desktop tables, search results). Phone shows prev / "page x of y" / next. */
export function pagination({ page = 3, total = 12, label = 'Pagination' } = {}) {
  const pages = [1, '…', page - 1, page, page + 1, '…', total].filter((p, i, a) => typeof p !== 'number' || (p >= 1 && p <= total));
  const pg = (p) => p === '…' ? `<li aria-hidden="true" class="hidden px-1 text-muted-foreground @md:block">…</li>` : `<li class="hidden @md:block"><a href="#" class="grid min-h-touch min-w-touch place-items-center rounded-button text-label ${p === page ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-surface-muted'}"${p === page ? ' aria-current="page"' : ''} aria-label="Page ${p}">${p}</a></li>`;
  return `<nav aria-label="${label}" class="@container"><ul class="flex items-center justify-between gap-1 @md:justify-center">
  <li><a href="#" class="btn btn-neutral btn-icon" aria-label="Previous page"${page === 1 ? ' aria-disabled="true"' : ''}>${icon('chevron-left')}</a></li>
  <li class="text-body text-muted-foreground @md:hidden">Page <span class="font-bold text-foreground">${page}</span> of ${total}</li>
  ${pages.map(pg).join('')}
  <li><a href="#" class="btn btn-neutral btn-icon" aria-label="Next page"${page === total ? ' aria-disabled="true"' : ''}>${icon('chevron-right')}</a></li>
</ul></nav>`;
}

export const infiniteSentinel = ({ list, pages = 2, auto = true }) =>
  `<div class="flex flex-col items-center gap-2 py-4" data-ds-infinite="${list}" data-ds-pages="${pages}"${auto ? ' data-ds-auto' : ''}>
  <button type="button" class="btn btn-outline" data-ds-more>Load more</button>
  <p class="text-body-sm text-muted-foreground" data-ds-end hidden>You’ve reached the end</p>
  <p class="sr-only" aria-live="polite" data-ds-live></p>
</div>`;
