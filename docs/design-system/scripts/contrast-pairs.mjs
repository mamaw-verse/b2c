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
  ...['success', 'warning', 'danger', 'info', 'sale'].flatMap(c => [[c, 'surface', T], [c, 'background', T], [c, c + '-soft', T]]),
  ['halal', 'halal-soft', T], ['halal', 'surface', T], ['halal', 'background', T], ['primary-foreground', 'halal', T], ['primary-foreground', 'halal-hover', T],
  ['rating-foreground', 'surface', T], ['rating-foreground', 'background', T],
  ...['pending', 'flagged', 'hidden', 'suspended', 'resolved'].map(s => ['mod-' + s, 'mod-' + s + '-bg', T]),
  ['border-control', 'surface', U], ['border-control', 'background', U], ['border-control', 'surface-muted', U],
  ...['surface', 'background', 'surface-muted', 'surface-brand-soft', 'surface-hero', 'surface-cta'].map(bg => ['ring', bg, U]),
  ['ring-inverse', 'surface-inverse', U],
];
export const REQUIRED = { text: 4.5, ui: 3 };
// Ratios stated in the seed comments, re-measured by the script.
export const SEED_CLAIMS = [
  ['foreground', 'surface', 14.97], ['muted-foreground', 'surface', 6.46], ['muted-foreground', 'background', 6.07],
  ['subtle-foreground', 'surface', 5.13], ['subtle-foreground', 'background', 4.82], ['subtle-foreground', 'surface-muted', 4.56],
  ['inverse-link', 'surface-inverse', 9.49], ['inverse-muted', 'surface-inverse', 8.38],
  ['border-control', 'surface', 3.30], ['sale', 'surface', 5.61], ['primary-foreground', 'sale', 5.61],
];
