// Focus foundation page: one indicator, demonstrated on every control.
// Demos force the state with data-force="focus" so the ring renders statically;
// the same elements are real controls, so Tab reaches every one of them.
import { icon } from '../ui/core.mjs';

const sec = (id, title, intro, inner) => `<section id="${id}" class="mb-12 scroll-mt-24">
  <h2 class="text-h2">${title}</h2>
  <p class="mt-1 max-w-prose text-body text-muted-foreground">${intro}</p>
  <div class="mt-4">${inner}</div>
</section>`;

const demo = (label, inner) => `<figure class="grid gap-2 rounded-panel border border-border bg-surface-subtle p-4">
  <figcaption class="text-caption text-muted-foreground">${label}</figcaption>
  <div>${inner}</div>
</figure>`;

/* One of each focusable control, ring forced visible. ids fz-* give the e2e
   focus spec a stable tab target. */
const stepper = `<div class="focus-ring inline-flex items-stretch overflow-hidden rounded-field border border-border-control bg-surface" data-force="focus" role="group" aria-label="Quantity">
  <button type="button" class="btn btn-ghost btn-icon rounded-none border-0 text-foreground" aria-label="Decrease quantity" tabindex="-1">${icon('minus', 'size-4')}</button>
  <label for="fz-stepper" class="sr-only">Quantity</label>
  <input id="fz-stepper" type="text" inputmode="numeric" value="2" class="w-12 border-x border-border-control bg-transparent text-center text-input font-bold tabular">
  <button type="button" class="btn btn-ghost btn-icon rounded-none border-0 text-foreground" aria-label="Increase quantity" tabindex="-1">${icon('plus', 'size-4')}</button>
</div>`;

const controls = `<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
  ${demo('Text input — .field: ring hugs the border, border joins the ring colour', `<label for="fz-input" class="sr-only">Name</label><input id="fz-input" class="field" value="Maria Santos" data-force="focus">`)}
  ${demo('Search field — same .field pattern', `<div class="relative"><label for="fz-search" class="sr-only">Search</label>${icon('search', 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground')}<input id="fz-search" type="search" class="field rounded-search pl-10" placeholder="Search halal products" data-force="focus"></div>`)}
  ${demo('Quantity stepper — .focus-ring on the container, inner parts silent', stepper)}
  ${demo('Filled brand button — white ring drawn inside the fill', `<button id="fz-btn-fill" type="button" class="btn" data-force="focus">Buy now</button>`)}
  ${demo('Neutral button — standard ring, 2px offset', `<button id="fz-btn" type="button" class="btn btn-neutral" data-force="focus">Apply</button>`)}
  ${demo('Link — standard ring', `<p class="text-body">Read the <a id="fz-link" href="#focus-rules" class="text-primary underline" data-force="focus">focus rules</a> before styling.</p>`)}
  ${demo('Chip — standard ring', `<button id="fz-chip" type="button" aria-pressed="true" class="relative inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-border-control bg-surface px-3 text-label whitespace-nowrap" data-force="focus">${icon('check', 'size-4')}Free shipping</button>`)}
  ${demo('Tab — .focus-inset inside the scroller', `<div role="tablist" aria-label="Demo" class="flex border-b border-border"><button id="fz-tab" type="button" role="tab" aria-selected="true" class="focus-inset relative flex min-h-touch items-center px-4 text-label text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary" data-force="focus">Shop</button><button type="button" role="tab" aria-selected="false" tabindex="-1" class="relative flex min-h-touch items-center px-4 text-label text-muted-foreground">Reviews</button></div>`)}
  ${demo('Checkbox — standard ring on the native input', `<label for="fz-check" class="flex min-h-touch items-center gap-3"><input id="fz-check" type="checkbox" checked class="size-5 accent-primary" data-force="focus"><span class="text-body">Remember me</span></label>`)}
  ${demo('Radio — standard ring on the native input', `<label for="fz-radio" class="flex min-h-touch items-center gap-3"><input id="fz-radio" type="radio" name="fz-r" checked class="size-5 accent-primary" data-force="focus"><span class="text-body">Cash on Delivery</span></label>`)}
  ${demo('Switch — standard ring on the native input', `<label for="fz-switch" class="flex min-h-touch items-center justify-between gap-4"><span class="text-body">Order updates</span><input id="fz-switch" type="checkbox" role="switch" checked class="relative h-7 w-12 shrink-0 appearance-none rounded-full bg-border-control checked:bg-primary before:absolute before:left-1 before:top-1 before:size-5 before:rounded-full before:bg-surface checked:before:translate-x-5" data-force="focus"></label>`)}
  ${demo('Option card — .focus-ring on the labelled proxy', `<label for="fz-card" class="focus-ring flex min-h-touch-primary cursor-pointer items-center gap-3 rounded-card border border-primary bg-primary-soft p-3" data-force="focus"><input id="fz-card" type="radio" name="fz-card-r" checked class="size-5 accent-primary"><span class="text-label">Standard delivery · ₱80</span></label>`)}
</div>`;

const darkControls = `<div class="dark grid gap-3 rounded-panel bg-background p-4 sm:grid-cols-2 lg:grid-cols-3">
  ${demo('Input', `<label for="fz-d-input" class="sr-only">Name</label><input id="fz-d-input" class="field" value="Maria Santos" data-force="focus">`)}
  ${demo('Filled button', `<button id="fz-d-btn" type="button" class="btn" data-force="focus">Buy now</button>`)}
  ${demo('Stepper', stepper.replaceAll('fz-stepper', 'fz-d-stepper'))}
  ${demo('Link', `<p class="text-body">Read the <a id="fz-d-link" href="#focus-rules" class="text-primary underline" data-force="focus">focus rules</a>.</p>`)}
  ${demo('Checkbox', `<label for="fz-d-check" class="flex min-h-touch items-center gap-3 text-foreground"><input id="fz-d-check" type="checkbox" checked class="size-5 accent-primary" data-force="focus"><span class="text-body">Halal only</span></label>`)}
  ${demo('Switch', `<label for="fz-d-switch" class="flex min-h-touch items-center justify-between gap-4 text-foreground"><span class="text-body">Order updates</span><input id="fz-d-switch" type="checkbox" role="switch" checked class="relative h-7 w-12 shrink-0 appearance-none rounded-full bg-border-control checked:bg-primary before:absolute before:left-1 before:top-1 before:size-5 before:rounded-full before:bg-surface checked:before:translate-x-5" data-force="focus"></label>`)}
</div>`;

const errorDemo = `<div class="grid gap-3 sm:grid-cols-2">
  ${demo('Invalid field — ring and border go to the error colour', `<label for="fz-err" class="text-label">Mobile number</label><input id="fz-err" class="field mt-1" value="917 12" aria-invalid="true" aria-describedby="fz-err-e" data-force="focus"><p id="fz-err-e" class="mt-1 text-body-sm font-bold text-danger">Enter all 10 digits.</p>`)}
  ${demo('Invalid composite — error ring on the container', `<p class="text-label" id="fz-errp-l">Mobile number</p><label for="fz-errp" class="field focus-ring mt-1 flex cursor-text items-stretch overflow-hidden p-0 border-danger" aria-labelledby="fz-errp-l"><span class="inline-flex items-center border-r border-border-control bg-surface-muted px-3 text-input select-none">+63</span><input id="fz-errp" type="tel" value="917 12" aria-invalid="true" class="min-w-0 flex-1 bg-transparent px-3 text-input" data-force="focus"></label>`)}
</div>`;

const tokens = `<table class="w-full text-body-sm"><caption class="sr-only">Focus tokens</caption>
  <thead><tr class="border-b border-border-strong text-th text-muted-foreground"><th class="py-2 pr-3 text-left" scope="col">Token</th><th class="py-2 pr-3 text-left" scope="col">Value</th><th class="py-2 text-left" scope="col">Contrast</th></tr></thead>
  <tbody>
    <tr class="border-b border-border"><td class="py-2 pr-3 text-label">--focus-ring-width</td><td class="py-2 pr-3">2px</td><td class="py-2 text-muted-foreground">one indicator, never stacked</td></tr>
    <tr class="border-b border-border"><td class="py-2 pr-3 text-label">--focus-ring-offset</td><td class="py-2 pr-3">2px</td><td class="py-2 text-muted-foreground">0 on fields and .focus-ring, negative on .focus-ring-inset</td></tr>
    <tr class="border-b border-border"><td class="py-2 pr-3 text-label">--focus-ring-color</td><td class="py-2 pr-3" data-hex="focus-ring-color"></td><td class="py-2"><span data-ratio="focus-ring-color|surface" data-need="3"></span> · <span data-ratio="focus-ring-color|background" data-need="3"></span></td></tr>
    <tr class="border-b border-border"><td class="py-2 pr-3 text-label">--focus-ring-color-dark</td><td class="py-2 pr-3" data-hex="focus-ring-color-dark"></td><td class="py-2 text-muted-foreground">checked at 3:1 in the app's dark theme</td></tr>
    <tr class="border-b border-border"><td class="py-2 pr-3 text-label">--focus-ring-on-brand</td><td class="py-2 pr-3" data-hex="focus-ring-on-brand"></td><td class="py-2"><span data-ratio="focus-ring-on-brand|primary" data-need="3"></span></td></tr>
    <tr class="border-b border-border"><td class="py-2 pr-3 text-label">--ring-inverse</td><td class="py-2 pr-3" data-hex="ring-inverse"></td><td class="py-2"><span data-ratio="ring-inverse|surface-inverse" data-need="3"></span></td></tr>
  </tbody>
</table>`;

const rules = `<ul class="grid list-disc gap-1.5 pl-5 text-body text-muted-foreground">
  <li>One indicator per focused element: a 2px <code>outline</code>, never a box-shadow ring, never a second outline.</li>
  <li>Only <code>:focus-visible</code> shows the ring — mouse clicks never trigger it (text inputs excepted: they match <code>:focus-visible</code> so they still indicate focus).</li>
  <li>Fields keep a neutral border at rest; on focus the ring hugs the border (<code>outline-offset: 0</code>) and the border joins the ring colour. No white gap.</li>
  <li>Composite controls take <code>.focus-ring</code> (or <code>.focus-ring-inset</code> when an ancestor clips): the container rings, inner parts never do. Dividers stay 1px neutral.</li>
  <li>Filled brand buttons draw a white ring inside the fill via <code>--focus-ring-on-brand</code>.</li>
  <li>Errors recolour ring and border to <code>--focus-ring-error</code>; the error text stays visible.</li>
  <li>Under forced colours the ring uses <code>Highlight</code>. The ring is a static outline, so reduced motion needs nothing.</li>
  <li>Components never define their own focus colour or width — the lint scan fails on <code>outline:none</code> without a replacement and on <code>focus*:ring|outline|border|shadow</code> utilities.</li>
</ul>`;

export const focusBody = `<div class="mx-auto max-w-container px-gutter py-6 md:py-10">
<h1 class="text-h1">Focus</h1>
<p class="mt-2 max-w-prose text-body-lg text-muted-foreground">One indicator everywhere: a 2px outline in the brand focus colour, offset 2px, shown on <code>:focus-visible</code> only. Fields hug it, composites lift it to the container, filled buttons invert it. Every demo below forces the state with <code>data-force="focus"</code>; press Tab to try the real thing.</p>
<div class="mt-8">
${sec('tokens', 'Tokens', 'Geometry is brand-independent; colours re-resolve per brand and per theme.', tokens)}
${sec('light', 'Light theme', 'Every control with the ring forced on.', controls)}
${sec('dark', 'Dark theme', 'The same controls inside a <code>.dark</code> scope — only the token changes.', darkControls)}
${sec('error', 'Error state', 'Ring and border switch to the error colour.', errorDemo)}
${sec('focus-rules', 'Rules', 'What the pattern guarantees and what the lint enforces.', rules)}
</div></div>`;
