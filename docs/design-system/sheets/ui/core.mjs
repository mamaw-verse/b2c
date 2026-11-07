// Shared HTML partials. Each exported function is the reference markup for one component; ports
// (Blade / React / Vue) reproduce the same structure, classes and ARIA. Copy is always passed in.

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const cx = (...c) => c.flat().filter(Boolean).join(' ');
export const attrs = (o = {}) => Object.entries(o).filter(([, v]) => v !== false && v != null).map(([k, v]) => v === true ? ` ${k}` : ` ${k}="${esc(v)}"`).join('');

/** Currency: ₱1,250 (no decimals unless needed). Counts: 1.2k. Same rules as DS.format in ds.js. */
export const peso = (n) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
export const compact = (n) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n).toLowerCase();

export const icon = (name, cls = '') => `<svg class="${cx('icon', cls)}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
export const spinner = (cls = 'size-4') => `<span class="${cx('inline-block animate-spin rounded-full border-2 border-current border-r-transparent', cls)}" aria-hidden="true"></span>`;

/** Button. variant: primary|secondary|outline|ghost|neutral|danger|inverse. size: sm|md|lg. */
export function btn(label, { variant = 'primary', size = 'md', icon: ic, iconEnd, block, loading, disabled, type = 'button', href, cls, attrs: a = {} } = {}) {
  const c = cx('btn', variant !== 'primary' && `btn-${variant}`, size !== 'md' && `btn-${size}`, block && 'btn-block', cls);
  const inner = `${loading ? spinner() : ic ? icon(ic) : ''}<span>${label}</span>${iconEnd ? icon(iconEnd) : ''}`;
  if (href) return `<a href="${href}" class="${c}"${attrs(a)}>${inner}</a>`;
  return `<button type="${type}" class="${c}"${attrs({ disabled, 'aria-busy': loading ? 'true' : null, 'aria-disabled': loading ? 'true' : null, ...a })}>${inner}</button>`;
}

/** Icon-only button. Always has an accessible name. Optional count badge. */
export function iconBtn(ic, label, { variant = 'ghost', size = 'md', count, href, cls, attrs: a = {} } = {}) {
  const c = cx('btn btn-icon', `btn-${variant}`, size !== 'md' && `btn-${size}`, variant === 'ghost' && 'text-foreground', cls);
  const badge = count ? `<span class="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-sale px-1 text-caption leading-5 text-primary-foreground" aria-hidden="true">${count > 99 ? '99+' : count}</span>` : '';
  const name = count ? `${label}, ${count > 99 ? '99+' : count}` : label;
  if (href) return `<a href="${href}" class="${c}" aria-label="${esc(name)}"${attrs(a)}>${icon(ic)}${badge}</a>`;
  return `<button type="button" class="${c}" aria-label="${esc(name)}"${attrs(a)}>${icon(ic)}${badge}</button>`;
}

export const link = (label, href = '#', { external, cls } = {}) =>
  `<a href="${href}" class="${cx('font-bold text-primary underline decoration-1 underline-offset-2 hover:text-primary-hover hover:decoration-2', cls)}"${external ? ' target="_blank" rel="noopener"' : ''}>${label}${external ? `${icon('external-link', 'ml-0.5 inline size-4 align-[-0.15em]')}<span class="sr-only"> (opens in a new tab)</span>` : ''}</a>`;

export const badge = (label, tone = '', { icon: ic, cls } = {}) => `<span class="${cx('badge', tone && `badge-${tone}`, cls)}">${ic ? icon(ic, 'size-3.5') : ''}${label}</span>`;

const avatarTones = ['bg-brand-100 text-brand-800', 'bg-info-soft text-info', 'bg-sale-soft text-sale', 'bg-warning-soft text-warning', 'bg-success-soft text-success'];
/** Avatar with initials fallback. size: sm 32, md 40, lg 56, xl 80. */
export function avatar(name, { size = 'md', status, tone, shape = 'circle', label = true } = {}) {
  const s = { sm: 'size-8 text-caption', md: 'size-10 text-label', lg: 'size-14 text-h4', xl: 'size-20 text-h3' }[size];
  const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const t = tone ?? avatarTones[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % avatarTones.length];
  const dot = status ? `<span class="absolute bottom-0 right-0 size-3 rounded-full border-2 border-surface ${status === 'online' ? 'bg-success' : 'bg-border-control'}"></span><span class="sr-only">, ${status}</span>` : '';
  return `<span class="relative inline-grid shrink-0 place-items-center font-bold ${shape === 'circle' ? 'rounded-full' : 'rounded-tile'} ${s} ${t}"${label ? ` role="img" aria-label="${esc(name)}"` : ' aria-hidden="true"'}><span aria-hidden="true">${initials}</span>${dot}</span>`;
}

const mediaTones = ['bg-brand-100 text-brand-700', 'bg-info-soft text-info', 'bg-sale-soft text-sale', 'bg-warning-soft text-warning', 'bg-surface-muted text-muted-foreground', 'bg-success-soft text-success'];
/** Neutral product/media placeholder (no external images in the package). */
export function media(label, { i = 0, ic = 'package', ratio = 'aspect-square', cls, decorative } = {}) {
  const tone = mediaTones[i % mediaTones.length];
  return `<div class="${cx('grid w-full place-items-center overflow-hidden', ratio, tone, cls)}"${decorative ? ' aria-hidden="true"' : ` role="img" aria-label="${esc(label)}"`}>${icon(ic, 'size-1/3 max-w-16 stroke-[1.25]')}</div>`;
}

export const srOnly = (t) => `<span class="sr-only">${t}</span>`;
export const visuallyHiddenLive = () => `<p class="sr-only" aria-live="polite" data-ds-live></p>`;
export const divider = () => `<hr class="border-border">`;
