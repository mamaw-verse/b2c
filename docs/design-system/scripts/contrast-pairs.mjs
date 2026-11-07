// Every foreground/background pair used by the package. kind: text (>=4.5) | ui (>=3).
const T = 'text', U = 'ui';
const surfaces = ['surface', 'background', 'surface-subtle', 'surface-muted', 'surface-brand-soft', 'surface-hero', 'surface-cta'];
export const PAIRS = [
  ...['foreground', 'muted-foreground'].flatMap(fg => surfaces.map(bg => [fg, bg, T])),
  // subtle-foreground: placeholder, captions, breadcrumbs. Not allowed on tinted brand surfaces.
  ...['surface', 'background', 'surface-subtle', 'surface-muted'].map(bg => ['subtle-foreground', bg, T]),
  ['primary-foreground', 'primary', T], ['primary-foreground', 'primary-hover', T], ['primary-foreground', 'primary-pressed', T],
  ['primary-foreground', 'danger', T], ['primary-foreground', 'sale', T], ['primary-foreground', 'success', T],
  ['primary', 'surface', T], ['primary', 'background', T], ['primary', 'surface-brand-soft', T],
  ['primary-soft-foreground', 'primary-soft', T], ['primary-hover', 'primary-soft', T],
  ['foreground-inverse', 'surface-inverse', T], ['inverse-link', 'surface-inverse', T], ['inverse-muted', 'surface-inverse', T],
  ...['success', 'warning', 'danger', 'info', 'sale', 'promo'].flatMap(c => [[c, 'surface', T], [c, 'background', T], [c, c + '-soft', T]]),
  ['primary-foreground', 'promo', T],
  // Category nav: default text, hover pill text, active text + indicator
  ['brand-700', 'brand-50', T], ['brand-700', 'surface', T], ['brand-600', 'surface', U],
  ['halal', 'halal-soft', T], ['halal', 'surface', T], ['halal', 'background', T], ['primary-foreground', 'halal', T], ['primary-foreground', 'halal-hover', T],
  ['rating-foreground', 'surface', T], ['rating-foreground', 'background', T],
  ...['pending', 'flagged', 'hidden', 'suspended', 'resolved'].map(s => ['mod-' + s, 'mod-' + s + '-bg', T]),
  ['border-control', 'surface', U], ['border-control', 'background', U], ['border-control', 'surface-muted', U],
  ...['surface', 'background', 'surface-muted', 'surface-brand-soft', 'surface-hero', 'surface-cta'].map(bg => ['ring', bg, U]),
  ['ring-inverse', 'surface-inverse', U],
  // Focus ring: the same tokens the base layer uses (see src/base.css).
  ...['surface', 'background', 'surface-muted', 'surface-brand-soft'].map(bg => ['focus-ring-color', bg, U]),
  ['focus-ring-on-brand', 'primary', U],
  ['focus-ring-error', 'surface', U],
];
/* Pairs measured inside the .dark token scope (dark theme). */
export const DARK_PAIRS = [
  ['foreground', 'surface', T], ['muted-foreground', 'surface', T], ['primary-foreground', 'promo', T],
  ['focus-ring-color', 'surface', U], ['focus-ring-color', 'background', U], ['focus-ring-color', 'surface-muted', U],
  ['focus-ring-error', 'surface', U],
  ['focus-ring-on-brand', 'primary', U],
];
export const REQUIRED = { text: 4.5, ui: 3 };
// Ratios stated in the seed comments, re-measured by the script.
export const SEED_CLAIMS = [
  ['foreground', 'surface', 14.97], ['muted-foreground', 'surface', 6.46], ['muted-foreground', 'background', 6.07],
  ['subtle-foreground', 'surface', 5.13], ['subtle-foreground', 'background', 4.82], ['subtle-foreground', 'surface-muted', 4.56],
  ['inverse-link', 'surface-inverse', 9.49], ['inverse-muted', 'surface-inverse', 8.38],
  ['border-control', 'surface', 3.30], ['sale', 'surface', 5.61], ['primary-foreground', 'sale', 5.61],
];
