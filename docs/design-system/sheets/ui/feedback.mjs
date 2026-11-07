import { cx, icon, iconBtn, btn, esc } from './core.mjs';

const tones = {
  info: ['bg-info-soft', 'text-info', 'info', 'border-info'],
  success: ['bg-success-soft', 'text-success', 'circle-check', 'border-success'],
  warning: ['bg-warning-soft', 'text-warning', 'triangle-alert', 'border-warning'],
  danger: ['bg-danger-soft', 'text-danger', 'circle-alert', 'border-danger'],
};

/** Toast: transient confirmation on the inverse surface. Lives in the polite #ds-toaster region. */
export const toast = ({ text, tone = 'success', action } = {}) =>
  `<div class="on-inverse pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-panel bg-surface-inverse py-2 pl-4 pr-1 text-body text-foreground-inverse shadow-popover" data-ds-toast-item>
  ${icon(tones[tone][2], 'text-inverse-link')}<p class="flex-1 py-1.5" data-ds-toast-text>${text || ''}</p>
  ${action ? `<a href="#" class="flex min-h-touch items-center px-2 text-label text-inverse-link underline">${action}</a>` : ''}
  <button type="button" class="btn btn-icon btn-sm bg-transparent text-foreground-inverse hover:bg-brand-800 active:bg-brand-950" aria-label="Dismiss notification" data-ds-toast-close>${icon('x', 'size-4')}</button>
</div>`;
export const toaster = () => `<div id="ds-toaster" role="status" aria-live="polite" class="pointer-events-none fixed inset-x-0 bottom-[calc(var(--tabbar-h)+1rem+env(safe-area-inset-bottom,0px))] z-toast flex flex-col items-center gap-2 px-gutter md:items-end"></div>
<template id="ds-toast-success">${toast({ tone: 'success' })}</template><template id="ds-toast-info">${toast({ tone: 'info' })}</template><template id="ds-toast-danger">${toast({ tone: 'danger' })}</template>`;

/** Banner / Alert: persistent, inline. role=alert only for errors that appear after an action. */
export function banner({ tone = 'info', title, text, action, dismissible, live, cls }) {
  const [bg, fg, ic, bd] = tones[tone];
  return `<div class="${cx('flex items-start gap-3 rounded-panel border-l-4 p-3 md:p-4', bg, bd, cls)}"${live ? ` role="${tone === 'danger' ? 'alert' : 'status'}"` : ''}>
  ${icon(ic, cx('mt-0.5', fg))}
  <div class="grid flex-1 gap-1">${title ? `<p class="text-label ${fg}">${title}</p>` : ''}<p class="text-body text-foreground">${text}</p>${action ? `<p><a href="#" class="text-label ${fg} underline underline-offset-2">${action}</a></p>` : ''}</div>
  ${dismissible ? `<button type="button" class="btn btn-icon btn-sm -mr-1 -mt-1 bg-transparent text-foreground hover:bg-surface active:bg-surface-muted" aria-label="Dismiss">${icon('x', 'size-4')}</button>` : ''}
</div>`;
}

export const skel = (cls) => `<span class="${cx('block animate-pulse rounded-badge bg-surface-muted', cls)}"></span>`;
/** Skeleton wrapper: hidden from AT, a single sr-only "Loading" label carries the meaning. */
export const skeleton = (inner, label = 'Loading') => `<div aria-busy="true"><span class="sr-only">${label}</span><div aria-hidden="true">${inner}</div></div>`;

export const spinnerBlock = ({ label = 'Loading', size = 'size-8' } = {}) =>
  `<div role="status" class="flex flex-col items-center gap-2 text-primary"><span class="${cx('inline-block animate-spin rounded-full border-[3px] border-current border-r-transparent', size)}" aria-hidden="true"></span><span class="text-body-sm text-muted-foreground">${label}</span></div>`;

/** ProgressSteps: phone shows "Step n of N" + bar; md+ shows every step. */
export function progressSteps({ steps, current, label = 'Checkout progress' }) {
  return `<nav aria-label="${label}" class="@container">
  <p class="text-body-sm text-muted-foreground @xl:hidden">Step ${current + 1} of ${steps.length}: <span class="font-bold text-foreground">${steps[current]}</span></p>
  <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted @xl:hidden" aria-hidden="true"><div class="h-full rounded-full bg-primary" style="width:${((current + 1) / steps.length) * 100}%"></div></div>
  <ol class="hidden items-center gap-2 @xl:flex">
    ${steps.map((s, i) => `<li class="flex flex-1 items-center gap-2 last:flex-none"${i === current ? ' aria-current="step"' : ''}>
      <span class="grid size-8 shrink-0 place-items-center rounded-full text-label ${i < current ? 'bg-primary text-primary-foreground' : i === current ? 'border-2 border-primary bg-surface text-primary' : 'border border-border-control bg-surface text-muted-foreground'}">${i < current ? `${icon('check', 'size-4')}<span class="sr-only">Completed:</span>` : i + 1}</span>
      <span class="text-label ${i <= current ? 'text-foreground' : 'text-muted-foreground'}">${s}</span>
      ${i < steps.length - 1 ? `<span class="h-0.5 flex-1 rounded-full ${i < current ? 'bg-primary' : 'bg-border'}" aria-hidden="true"></span>` : ''}
    </li>`).join('')}
  </ol>
</nav>`;
}

export const emptyState = ({ ic = 'inbox', title, text, action, secondary, compact }) =>
  `<div class="${cx('mx-auto flex max-w-sm flex-col items-center text-center', compact ? 'gap-2 py-6' : 'gap-3 py-10')}">
  <span class="grid size-16 place-items-center rounded-full bg-primary-soft text-primary">${icon(ic, 'size-8')}</span>
  <h3 class="text-h3">${title}</h3><p class="text-body text-muted-foreground">${text}</p>
  ${action || secondary ? `<div class="mt-1 flex flex-wrap justify-center gap-2">${action ? btn(action) : ''}${secondary ? btn(secondary, { variant: 'ghost' }) : ''}</div>` : ''}
</div>`;

export const errorState = ({ title = 'Something went wrong', text = 'We couldn’t load this page. Check your connection and try again.', code, action = 'Try again', ic = 'wifi-off' }) =>
  `<div class="mx-auto flex max-w-sm flex-col items-center gap-3 py-10 text-center" role="alert">
  <span class="grid size-16 place-items-center rounded-full bg-danger-soft text-danger">${icon(ic, 'size-8')}</span>
  <h3 class="text-h3">${title}</h3><p class="text-body text-muted-foreground">${text}</p>
  ${btn(action, { variant: 'outline', icon: 'refresh-cw' })}
  ${code ? `<p class="text-caption text-muted-foreground">Error code: <span class="tabular">${code}</span></p>` : ''}
</div>`;

/* ---------------------------------------------------------------- Overlays */
const handle = `<div class="flex justify-center pt-2 md:hidden" data-ds-sheet-handle><span class="h-1.5 w-10 rounded-full bg-border-control" aria-hidden="true"></span></div>`;

/** Panel markup shared by Modal / BottomSheet / Drawer / ConfirmDialog. kind: responsive|sheet|drawer|modal|alert */
export function dialogPanel({ id, title, body, footer, kind = 'responsive', desc }) {
  const isSheet = kind === 'sheet' || kind === 'responsive';
  return `<div class="flex max-h-[inherit] flex-col ${kind === 'drawer' ? 'h-full' : ''}">
  ${isSheet ? handle : ''}
  <div class="flex items-center gap-2 ${kind === 'alert' ? 'px-5 pt-5' : `border-b border-border py-1 pl-4 pr-1 ${isSheet ? 'md:py-2' : 'py-2'}`}">
    <h2 id="${id}-title" class="flex-1 text-h3">${title}</h2>
    ${kind === 'alert' ? '' : iconBtn('x', 'Close', { attrs: { 'data-ds-close': true } })}
  </div>
  <div class="${cx('overflow-y-auto overscroll-contain', kind === 'alert' ? 'px-5 pt-2 pb-5' : 'flex-1 p-4')}"${desc ? ` id="${id}-desc"` : ''}>${body}</div>
  ${footer ? `<div class="${cx('flex flex-col gap-2 sm:flex-row sm:justify-end', kind === 'alert' ? 'px-5 pb-5' : 'border-t border-border px-4 pt-3 pb-[calc(.75rem+env(safe-area-inset-bottom,0px))]')}">${footer}</div>` : ''}
</div>`;
}
const dialogCls = {
  responsive: 'mt-auto mb-0 w-full max-h-[90dvh] rounded-t-panel md:m-auto md:w-[min(32rem,calc(100vw-2rem))] md:rounded-panel md:max-h-[85dvh] starting:open:translate-y-full md:starting:open:translate-y-4 md:starting:open:opacity-0',
  sheet: 'mt-auto mb-0 w-full max-h-[90dvh] rounded-t-panel md:mx-auto md:max-w-xl starting:open:translate-y-full',
  modal: 'm-auto w-[min(32rem,calc(100vw-2rem))] max-h-[85dvh] rounded-panel starting:open:opacity-0 starting:open:scale-95',
  alert: 'm-auto w-[min(24rem,calc(100vw-2rem))] rounded-panel starting:open:opacity-0 starting:open:scale-95',
  drawer: 'ml-0 mr-auto my-0 h-dvh max-h-dvh w-[min(20rem,85vw)] rounded-r-panel starting:open:-translate-x-full',
};
export function dialog(opts) {
  const { id, kind = 'responsive', desc } = opts;
  return `<dialog id="${id}" aria-labelledby="${id}-title"${desc ? ` aria-describedby="${id}-desc"` : ''}${kind === 'alert' ? ' role="alertdialog"' : ''} class="${cx('z-modal bg-surface p-0 shadow-sheet transition-[translate,opacity,scale,display,overlay] transition-discrete duration-token', dialogCls[kind])}">${dialogPanel(opts)}</dialog>`;
}
/** Frozen "open" rendering for the styleguide (same panel inside a backdrop box). */
export function dialogStatic(opts) {
  const { kind = 'responsive' } = opts;
  const pos = { responsive: 'items-end md:items-center', sheet: 'items-end', modal: 'items-center', alert: 'items-center', drawer: 'items-stretch justify-start' }[kind];
  const w = { responsive: 'w-full md:max-w-md md:rounded-panel', sheet: 'w-full', modal: 'w-full max-w-md rounded-panel', alert: 'w-full max-w-sm rounded-panel', drawer: 'w-4/5 max-w-xs rounded-r-panel' }[kind];
  return `<div class="flex min-h-80 ${pos} justify-center overflow-hidden rounded-panel bg-brand-950/55 ${kind === 'drawer' ? '' : 'pt-8'} ${kind === 'modal' || kind === 'alert' ? 'p-4' : ''}">
  <div role="dialog" aria-labelledby="${opts.id}-title" class="${cx('bg-surface shadow-sheet', w, kind === 'sheet' || kind === 'responsive' ? 'rounded-t-panel' : '')}">${dialogPanel(opts)}</div>
</div>`;
}

export function confirmDialog({ id, title = 'Cancel this order?', text = 'The seller will be notified and your payment will be refunded within 3–5 banking days.', confirm = 'Cancel order', cancel = 'Keep order', frozen }) {
  const o = { id, kind: 'alert', title, desc: true, body: `<p class="text-body text-muted-foreground">${text}</p>`, footer: `${btn(cancel, { variant: 'neutral', attrs: { 'data-ds-close': true, autofocus: !frozen } })}${btn(confirm, { variant: 'danger', attrs: { 'data-ds-close': true, value: 'confirm' } })}` };
  return frozen ? dialogStatic(o) : dialog(o);
}

/** Popover / dropdown menu (native popover attribute). */
export function menu({ id, label, items, trigger, align = 'end' }) {
  return `${trigger || `<button type="button" class="btn btn-neutral" popovertarget="${id}" aria-haspopup="menu">${esc(label)}${icon('chevron-down', 'size-4')}</button>`}
<div id="${id}" popover role="menu" aria-label="${esc(label)}" class="fixed m-0 min-w-48 rounded-panel border border-border bg-surface p-1 shadow-popover"${align === 'end' ? ' data-ds-align-end' : ''}>
  ${items.map(it => it === '-' ? '<div role="separator" class="my-1 border-t border-border"></div>' : `<button type="button" role="menuitem" class="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body ${it.danger ? 'text-danger hover:bg-danger-soft' : 'text-foreground hover:bg-surface-muted'}">${it.icon ? icon(it.icon, 'size-4') : ''}${it.label}</button>`).join('')}
</div>`;
}
export const menuStatic = (items) => `<div role="menu" aria-label="Order actions" class="min-w-48 max-w-xs rounded-panel border border-border bg-surface p-1 shadow-popover">${items.map((it, i) => it === '-' ? '<div role="separator" class="my-1 border-t border-border"></div>' : `<button type="button" role="menuitem" tabindex="${i ? -1 : 0}" class="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body ${it.danger ? 'text-danger hover:bg-danger-soft' : 'text-foreground hover:bg-surface-muted'}"${it.force ? ` data-force="${it.force}"` : ''}>${it.icon ? icon(it.icon, 'size-4') : ''}${it.label}</button>`).join('')}</div>`;

/** Tooltip: supplementary only; shown on hover (pointer) and keyboard focus, never on touch. */
export const tooltip = ({ id, tip, trigger, open }) =>
  `<span class="group relative inline-flex" data-ds-tooltip>${trigger.replace(/<button /, `<button aria-describedby="${id}" `)}<span role="tooltip" id="${id}" class="${cx('pointer-events-none absolute bottom-full left-1/2 z-toast mb-2 w-max max-w-56 -translate-x-1/2 rounded-badge bg-surface-inverse px-2 py-1 text-caption text-foreground-inverse transition-opacity duration-token', open ? 'visible opacity-100' : 'invisible opacity-0 group-hover:visible group-hover:opacity-100 group-has-[:focus-visible]:visible group-has-[:focus-visible]:opacity-100 group-data-[dismissed]:invisible')}">${tip}</span></span>`;
