import { cx, icon, iconBtn, btn, esc, media, compact } from './core.mjs';

/** Chip: toggleable filter (aria-pressed). Tag: removable value. */
export const chip = (label, { pressed, ic, count, force, disabled } = {}) =>
  `<button type="button" aria-pressed="${!!pressed}" class="inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border-control bg-surface px-3 text-label text-foreground transition-colors duration-token hover:bg-surface-muted active:bg-border aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:text-primary-soft-foreground disabled:cursor-not-allowed disabled:opacity-60 relative after:absolute after:-inset-x-px after:-inset-y-[5px]"${force ? ` data-force="${force}"` : ''}${disabled ? ' disabled' : ''}>${pressed ? icon('check', 'size-4') : ic ? icon(ic, 'size-4') : ''}${label}${count != null ? `<span class="text-muted-foreground">${count}</span>` : ''}</button>`;
export const tag = (label) => `<span class="inline-flex items-center gap-1 rounded-badge bg-surface-muted py-0.5 pl-2 text-body-sm text-foreground">${label}<button type="button" class="btn btn-icon btn-sm -my-1.5 bg-transparent text-muted-foreground hover:bg-border hover:text-foreground active:bg-border-strong" aria-label="Remove ${esc(label)}">${icon('x', 'size-3.5')}</button></span>`;

/** Rating: decorative stars + numeric value in foreground (amber is never the only carrier). */
export function rating(value, { count, size = 'size-4', showValue = true, label } = {}) {
  const stars = [1, 2, 3, 4, 5].map(n => {
    const fill = value >= n ? 'fill-current' : value >= n - 0.5 ? 'half' : '';
    return fill === 'half'
      ? `<span class="relative inline-flex">${icon('star', `${size} text-border-strong fill-current stroke-0`)}<span class="absolute inset-0 w-1/2 overflow-hidden">${icon('star', `${size} text-rating fill-current stroke-0`)}</span></span>`
      : icon('star', `${size} ${fill ? 'text-rating fill-current stroke-0' : 'text-border-strong fill-current stroke-0'}`);
  }).join('');
  return `<span class="inline-flex items-center gap-1" role="img" aria-label="${esc(label || `Rated ${value} out of 5${count != null ? `, ${count} ratings` : ''}`)}"><span class="inline-flex" aria-hidden="true">${stars}</span>${showValue ? `<span class="text-body-sm font-bold text-foreground tabular" aria-hidden="true">${value.toFixed(1)}</span>` : ''}${count != null ? `<span class="text-body-sm text-muted-foreground" aria-hidden="true">(${compact(count)})</span>` : ''}</span>`;
}

export const accordion = (items, { name } = {}) => `<div class="divide-y divide-border rounded-panel border border-border bg-surface">
  ${items.map(([q, a, open]) => `<details class="group"${open ? ' open' : ''}${name ? ` name="${name}"` : ''}><summary class="flex min-h-touch-primary items-center justify-between gap-3 px-4 text-label hover:bg-surface-subtle focus-visible:outline-offset-[-3px] [&::-webkit-details-marker]:hidden list-none">${q}${icon('chevron-down', 'shrink-0 text-muted-foreground transition-transform duration-token group-open:rotate-180')}</summary><div class="px-4 pb-4 text-body text-muted-foreground">${a}</div></details>`).join('')}
</div>`;

/** Carousel / gallery: scroll-snap, prev/next (pointer), thumbnails, "n of N" counter, zoom. */
export function carousel({ id, slides, thumbs = true, zoom = true, label = 'Product photos', ratio = 'aspect-square', rounded = 'md:rounded-panel' }) {
  return `<section class="grid gap-2" aria-roledescription="carousel" aria-label="${label}" data-ds-carousel>
  <div class="relative">
    <ul class="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain ${rounded} [scrollbar-width:none]" data-ds-track tabindex="0" aria-label="${label}, use arrow keys">
      ${slides.map((s, i) => `<li class="w-full shrink-0 snap-center" aria-roledescription="slide" aria-label="${i + 1} of ${slides.length}">${media(s, { i, ic: ['package', 'shopping-bag', 'gift', 'image', 'tag'][i % 5], ratio })}</li>`).join('')}
    </ul>
    <p class="absolute bottom-2 right-2 rounded-full bg-surface-inverse px-2 py-0.5 text-caption text-foreground-inverse tabular" data-ds-count aria-hidden="true">1 of ${slides.length}</p>
    ${zoom ? `<button type="button" class="btn btn-icon btn-neutral absolute right-2 top-2 rounded-full border-transparent shadow-popover" aria-label="Zoom photo" data-ds-open="${id}-zoom">${icon('zoom-in')}</button>` : ''}
    <button type="button" class="btn btn-icon btn-neutral absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full border-transparent shadow-popover [@media(hover:hover)]:inline-flex disabled:hidden" aria-label="Previous photo" data-ds-prev>${icon('chevron-left')}</button>
    <button type="button" class="btn btn-icon btn-neutral absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full border-transparent shadow-popover [@media(hover:hover)]:inline-flex disabled:hidden" aria-label="Next photo" data-ds-next>${icon('chevron-right')}</button>
  </div>
  ${thumbs ? `<ul class="flex gap-2 overflow-x-auto px-gutter md:px-0" aria-label="Thumbnails">${slides.map((s, i) => `<li class="shrink-0"><button type="button" class="block size-14 overflow-hidden rounded-tile border-2 border-transparent aria-[current=true]:border-primary md:size-16" data-ds-thumb="${i}" aria-current="${i === 0}" aria-label="Show photo ${i + 1}: ${esc(s)}">${media(s, { i, ic: ['package', 'shopping-bag', 'gift', 'image', 'tag'][i % 5], decorative: true })}</button></li>`).join('')}</ul>` : ''}
</section>
${zoom ? `<dialog id="${id}-zoom" aria-label="Zoomed photo" class="m-0 h-dvh max-h-dvh w-screen bg-surface-inverse p-0"><div class="on-inverse flex h-full flex-col"><div class="flex justify-end p-2 pt-safe"><button type="button" class="btn btn-icon btn-inverse rounded-full border-transparent" aria-label="Close" data-ds-close autofocus>${icon('x')}</button></div><div class="grid flex-1 place-items-center overflow-auto p-4">${media(slides[0], { ic: 'package', cls: 'max-w-2xl rounded-panel' })}</div></div></dialog>` : ''}`;
}

export const statCard = ({ label, value, delta, up = true, ic, hint }) =>
  `<div class="card grid gap-1 p-4">
  <p class="flex items-center gap-2 text-body-sm text-muted-foreground">${ic ? icon(ic, 'size-4') : ''}${label}</p>
  <p class="text-h2 tabular">${value}</p>
  ${delta ? `<p class="flex items-center gap-1 text-body-sm font-bold ${up ? 'text-success' : 'text-danger'}">${icon(up ? 'trending-up' : 'trending-down', 'size-4')}<span>${delta}</span><span class="sr-only">${up ? 'increase' : 'decrease'}</span><span class="font-normal text-muted-foreground">${hint || 'vs last 7 days'}</span></p>` : ''}
</div>`;

export const kvList = (rows, { cols = 1, cls } = {}) =>
  `<dl class="${cx('grid gap-x-6 gap-y-3', cols === 2 && 'sm:grid-cols-2', cls)}">${rows.map(([k, v]) => `<div class="grid grid-cols-[minmax(7rem,40%)_1fr] gap-3"><dt class="text-body-sm text-muted-foreground">${k}</dt><dd class="text-body text-foreground">${v}</dd></div>`).join('')}</dl>`;

/** Timeline / order tracker. Steps: [title, time, detail, state(done|current|todo)] */
export const timeline = (steps, { label = 'Order tracking' } = {}) =>
  `<ol class="grid" aria-label="${label}">${steps.map(([title, time, detail, st], i) => `<li class="relative grid grid-cols-[1.5rem_1fr] gap-3 pb-5 last:pb-0"${st === 'current' ? ' aria-current="step"' : ''}>
    ${i < steps.length - 1 ? `<span class="absolute bottom-0 left-[.6875rem] top-6 w-0.5 ${st === 'done' || st === 'current' ? 'bg-primary' : 'bg-border'}" aria-hidden="true"></span>` : ''}
    <span class="relative z-10 mt-0.5 grid size-6 place-items-center rounded-full ${st === 'current' ? 'bg-primary text-primary-foreground ring-4 ring-primary-soft' : st === 'done' ? 'bg-primary text-primary-foreground' : 'border-2 border-border-control bg-surface'}">${st !== 'todo' ? icon(st === 'current' ? 'truck' : 'check', 'size-3.5') : ''}</span>
    <div class="grid gap-0.5"><p class="text-label ${st === 'todo' ? 'text-muted-foreground' : 'text-foreground'}">${st === 'done' ? '<span class="sr-only">Completed: </span>' : st === 'current' ? '<span class="sr-only">Current: </span>' : ''}${title}</p>${detail ? `<p class="text-body-sm text-muted-foreground">${detail}</p>` : ''}${time ? `<p class="text-body-sm text-muted-foreground tabular"><time>${time}</time></p>` : ''}</div>
  </li>`).join('')}</ol>`;

/** DataTable with phone card-list fallback. columns: [{key,label,align,primary}] */
export function dataTable({ caption, columns, rows, selectable, id = 'dt', sort }) {
  const cell = (c, r) => r[c.key];
  const th = columns.map(c => `<th scope="col" class="${cx('px-3 py-2 text-th uppercase text-muted-foreground', c.align === 'end' ? 'text-right' : 'text-left')}"${sort === c.key ? ' aria-sort="descending"' : ''}>${sort === c.key ? `<button type="button" class="inline-flex min-h-touch items-center gap-1 uppercase hover:text-foreground">${c.label}${icon('arrow-down', 'size-3.5')}</button>` : c.label}</th>`).join('');
  return `<div data-ds-bulk>
  <div class="hidden overflow-x-auto rounded-panel border border-border bg-surface md:block">
    <table class="w-full text-body">
      <caption class="sr-only">${caption}</caption>
      <thead class="border-b border-border bg-surface-subtle"><tr>${selectable ? `<th scope="col" class="w-12 px-3"><label class="grid min-h-touch place-items-center"><input type="checkbox" class="size-5 accent-primary" data-ds-select-all><span class="sr-only">Select all</span></label></th>` : ''}${th}</tr></thead>
      <tbody class="divide-y divide-border">${rows.map((r, i) => `<tr class="hover:bg-surface-subtle has-[:checked]:bg-primary-soft">${selectable ? `<td class="px-3"><label class="grid min-h-touch place-items-center"><input type="checkbox" class="size-5 accent-primary" data-ds-bulk-item><span class="sr-only">Select ${esc(String(r[columns[0].key]).replace(/<[^>]+>/g, ''))}</span></label></td>` : ''}${columns.map(c => `<td class="${cx('px-3 py-2.5 align-middle', c.align === 'end' && 'text-right tabular')}">${cell(c, r)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  </div>
  <ul class="grid gap-2 md:hidden" aria-label="${caption}">${rows.map(r => `<li class="card grid gap-2 p-3">
    <div class="flex items-start justify-between gap-3"><div class="min-w-0">${cell(columns[0], r)}</div>${columns.find(c => c.badge) ? cell(columns.find(c => c.badge), r) : ''}</div>
    <dl class="grid grid-cols-2 gap-x-3 gap-y-1 text-body-sm">${columns.slice(1).filter(c => !c.badge).map(c => `<div class="contents"><dt class="text-muted-foreground">${c.label}</dt><dd class="text-right text-foreground tabular">${cell(c, r)}</dd></div>`).join('')}</dl>
  </li>`).join('')}</ul>
</div>`;
}
