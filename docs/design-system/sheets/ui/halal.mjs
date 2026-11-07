// Halal trust UI. Brand-independent tokens (--halal*) so the certification mark never changes with the white-label brand.
// Certifier names, certificate numbers and dates in the samples are placeholders (see docs/halal.md).
import { cx, icon, btn, esc } from './core.mjs';
import { banner } from './feedback.mjs';

/** Status vocabulary shared by storefront, seller centre and moderation console. */
export const HALAL = {
  certified: { ic: 'moon-star', label: 'Halal certified', short: 'Halal', cls: 'badge-halal', solid: 'badge-halal-solid' },
  review: { ic: 'clock', label: 'Certificate under review', short: 'In review', cls: 'badge-warning' },
  expiring: { ic: 'calendar-clock', label: 'Certificate expires soon', short: 'Expiring', cls: 'badge-warning' },
  expired: { ic: 'circle-alert', label: 'Certificate expired', short: 'Expired', cls: 'badge-danger' },
  missing: { ic: 'file-badge', label: 'No certificate', short: 'No certificate', cls: 'badge-danger' },
  na: { ic: 'hand-heart', label: 'Muslim-friendly (no certificate needed)', short: 'Muslim-friendly', cls: 'badge-neutral' },
};

/**
 * HalalBadge. status: certified|review|expiring|expired|missing|na.
 * variant: soft (on white) | solid (over photos). short: one-word label for dense cards.
 * body (certifier acronym) is read out for screen readers, never shown on the compact card.
 */
export function halalBadge({ status = 'certified', short, solid, body, cls, showBody } = {}) {
  const s = HALAL[status];
  const tone = solid && s.solid ? s.solid : s.cls;
  const text = short ? s.short : s.label;
  const sr = short && status === 'certified' ? `<span class="sr-only"> certified${body ? ` by ${esc(body)}` : ''}</span>` : '';
  return `<span class="${cx('badge', tone, cls)}">${icon(s.ic, 'size-3.5')}${text}${sr}${showBody && body ? `<span class="font-normal opacity-90">· ${esc(body)}</span>` : ''}</span>`;
}

/** Cold-chain note for frozen halal meat. Persistent, inline (not a toast). */
export const coldChainNote = ({ cls } = {}) => banner({ tone: 'info', title: 'Ships frozen', text: 'Packed with ice packs. Delivery is limited to areas with cold-chain coverage; check your address at checkout.', cls });

/**
 * HalalCertificateCard: what the platform verified, and when. Buyer-facing (product detail) and seller-facing (shop settings).
 * status: certified | expiring | expired. Always shows who certified, which number, until when, and what it covers.
 */
export function halalCertCard({ id = 'hc', status = 'certified', body = 'Islamic Da’wah Council of the Philippines (IDCP)', no = 'HC-2026-00481', valid = 'Mar 14, 2028', scope = 'Product and packing facility, Taguig', checked = 'Oct 28, 2026', seller = false } = {}) {
  const warn = status === 'expiring' ? banner({ tone: 'warning', text: `Certificate expires on ${valid}. Upload a renewal to keep your listings visible.`, cls: 'mt-3' })
    : status === 'expired' ? banner({ tone: 'danger', title: 'Certificate expired', text: seller ? 'Your halal listings are hidden from search until you upload a renewal.' : 'The seller must renew this certificate. Listings that depend on it are hidden.', cls: 'mt-3' }) : '';
  const rows = [['Certifying body', body], ['Certificate no.', `<span class="tabular">${no}</span>`], [status === 'expired' ? 'Expired on' : 'Valid until', `<span class="tabular${status === 'certified' ? '' : ' font-bold'}">${valid}</span>`], ['Covers', scope]];
  return `<section class="panel p-4" aria-labelledby="${id}-h">
  <div class="flex items-start gap-3">
    <span class="grid size-10 shrink-0 place-items-center rounded-tile bg-halal-soft text-halal">${icon('file-badge')}</span>
    <div class="min-w-0 flex-1"><h2 id="${id}-h" class="text-h4">Halal certificate</h2><p class="text-body-sm text-muted-foreground">Checked by {{BRAND_NAME}} on <time>${checked}</time></p></div>
    ${halalBadge({ status, short: true })}
  </div>
  <dl class="mt-3 grid gap-2 text-body-sm">${rows.map(([k, v]) => `<div class="grid grid-cols-[minmax(6.5rem,35%)_1fr] gap-3"><dt class="text-muted-foreground">${k}</dt><dd class="text-foreground">${v}</dd></div>`).join('')}</dl>
  ${warn}
  <div class="mt-4 flex flex-wrap gap-2">${btn('View certificate', { variant: 'neutral', iconEnd: 'external-link', cls: 'flex-1 sm:flex-none' })}${seller ? btn('Upload renewal', { variant: 'outline', icon: 'image-plus', cls: 'flex-1 sm:flex-none' }) : btn('Report a concern', { variant: 'ghost', icon: 'flag', cls: 'flex-1 sm:flex-none' })}</div>
</section>`;
}

/** Halal facts strip on the product page: three scannable facts above the fold. */
export const halalFacts = ({ body = 'IDCP', valid = 'Mar 2028', frozen } = {}) => `<ul class="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm" aria-label="Halal summary">
  <li>${halalBadge({ status: 'certified' })}</li>
  <li class="text-muted-foreground">Certified by <span class="font-bold text-foreground">${esc(body)}</span></li>
  <li class="text-muted-foreground">Valid to <span class="font-bold text-foreground tabular">${valid}</span></li>
  ${frozen ? `<li class="inline-flex items-center gap-1 text-info">${icon('snowflake', 'size-4')}Ships frozen</li>` : ''}
</ul>`;

/** Reviewer checklist (moderation console): every line is a yes/no the reviewer can defend in the audit log. */
export function halalChecklist({ id = 'hcl', items } = {}) {
  items = items || [
    ['Certifier is on the current accredited list', 'fail', 'Certifier “Mindanao Halal Council” is not recognised.'],
    ['Certificate number matches the certifier’s registry', 'unknown', 'Registry lookup unavailable. Check manually.'],
    ['Certificate is valid today', 'pass', 'Valid until Mar 14, 2028.'],
    ['Certificate covers this product', 'fail', 'Scope lists “beef products”; the listing is chicken.'],
    ['Ingredients contain no pork, alcohol or their derivatives', 'fail', '“Pork fat” found in the ingredient list.'],
  ];
  const S = { pass: ['circle-check', 'text-success', 'Passed'], fail: ['circle-alert', 'text-danger', 'Failed'], unknown: ['circle-help', 'text-warning', 'Needs a manual check'] };
  return `<ul class="grid gap-3" aria-label="Halal verification checklist">${items.map(([q, st, note], n) => `<li class="grid grid-cols-[1.5rem_1fr] gap-x-3">
    <span class="${S[st][1]} mt-0.5">${icon(S[st][0])}</span>
    <div class="grid gap-0.5"><p class="text-body"><span class="sr-only">${S[st][2]}: </span>${q}</p><p class="text-body-sm text-muted-foreground">${note}</p></div></li>`).join('')}</ul>`;
}
