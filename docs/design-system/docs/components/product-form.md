# ProductForm sections

Seller · Phase 4 · Live sheet: `styleguide/components/product-form.html`

## 1. Purpose
Seller listing editor as titled panels: Basic info, Media, Sales, Shipping; sticky Save draft / Publish.

**Use when**
- Add / edit product.

**Don't use when**
- Bulk upload (CSV, PROPOSED).

## 2. Anatomy
1. Section panel: title, description, completion badge.
2. Fields (FormField family).
3. Sticky form bar with draft status.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Section | `formSection()` |  |
| Form bar | `productFormBar()` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Fields. |
| Pressed | n/a: n/a |
| Focus-visible | n/a: Fields. |
| Disabled | n/a: n/a |
| Loading | rendered |
| Error | rendered |
| Selected | rendered |
| Empty | n/a: New product: empty fields with examples in placeholders. |
| Skeleton | n/a: Panel skeletons. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Single column; bar fixed at the bottom. |
| Tablet (md, 768px+) | Two-column field rows where short. |
| Desktop (lg, 1024px+) | Form column next to the sidebar; bar offset by `--sidebar-w`. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| product | Draft | — |  |
| errors | map | {} |  |
| onSaveDraft / onPublish | fn | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Sections labelled by headings. |
| Accessible name | — |
| Keyboard | — |
| Focus management | Publish with errors: focus first invalid field; section badge shows “1 issue”. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Draft saved status polite. |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--container-max`, `--danger`, `--danger-soft`, `--dur`, `--ease-out`, `--elevation-popover`, `--elevation-sticky`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-h4`, `--fs-input`, `--fs-label`, `--gutter`, `--halal-soft`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--r-field`, `--r-panel`, `--r-tile`, `--ring`, `--subtle-foreground`, `--success`, `--success-soft`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--warning`, `--warning-soft`, `--z-sheet`, `currentColor (icons)`, `safe-area-inset-bottom`

## 9. Content rules
- Help text gives rules (no ALL CAPS).

## 10. Do / Don't
**Do**
- Autosave drafts.

**Don't**
- Don’t split into wizard steps on phone.

## 11. HTML usage
```html
<div class="grid gap-4">
  <section class="panel" aria-labelledby="pf-basic">
    <header class="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
      <div>
        <h2 id="pf-basic" class="text-h4">Basic information</h2>
      </div>
      <span class="badge badge-success"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-check"/></svg>Complete</span>
    </header>
    <div class="grid gap-4 p-4">
      <div class="grid gap-1.5">
        <div class="flex items-baseline justify-between gap-2">
          <label for="pf-name" class="text-label text-foreground">Product name<span class="text-danger" aria-hidden="true"> *</span></label>
        </div>
        <input id="pf-name" type="text" class="field" value="Ajwa dates 500g, premium grade" maxlength="120" aria-describedby="pf-name-help pf-name-error pf-name-count">
        <div class="flex gap-2">
          <p id="pf-name-help" class="text-body-sm text-muted-foreground">Brand, model and key feature. No emojis or ALL CAPS.</p>
          <p id="pf-name-count" class="ml-auto shrink-0 text-body-sm text-muted-foreground tabular">38 / 120</p>
        </div>
        <p id="pf-name-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
      </div>
      <div class="grid gap-1.5">
        <div class="flex items-baseline justify-between gap-2">
          <label for="pf-cat" class="text-label text-foreground">Category<span class="text-danger" aria-hidden="true"> *</span></label>
        </div>
        <div class="relative" data-ds-combobox><input id="pf-cat" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="pf-cat-list" autocomplete="off" value="Halal Food › Dates &amp; Sweets › Dates" class="field pr-10" required aria-describedby="pf-cat-error" data-ds-open-on-focus><svg class="icon pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true"><use href="#i-chevron-down"/></svg>
          <ul id="pf-cat-list" role="listbox" aria-label="Category" class="absolute inset-x-0 top-full z-sheet mt-1 max-h-64 overflow-auto rounded-panel border border-border bg-surface py-1 shadow-popover" hidden>
            <li id="pf-cat-opt-0" role="option" aria-selected="true" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Halal Food › Dates & Sweets › Dates</li>
            <li id="pf-cat-opt-1" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Halal Food › Pantry › Spreads</li>
          </ul>
          <p data-ds-empty hidden class="absolute inset-x-0 top-full z-sheet mt-1 rounded-panel border border-border bg-surface px-3 py-3 text-body text-muted-foreground shadow-popover">No matches</p>
          <p class="sr-only" aria-live="polite" data-ds-live></p>
        </div>
        <p id="pf-cat-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
      </div>
      <div class="grid gap-1.5">
        <div class="flex items-baseline justify-between gap-2">
          <label for="pf-desc" class="text-label text-foreground">Description<span class="text-danger" aria-hidden="true"> *</span></label>
        </div>
        <textarea id="pf-desc" rows="5" class="field" maxlength="3000" aria-describedby="pf-desc-error pf-desc-count" data-ds-counter="pf-desc-count">Premium Ajwa dates, soft and moist. Packed in a resealable tub. No added sugar or preservatives.</textarea>
        <div class="flex gap-2">
          <p id="pf-desc-count" class="ml-auto shrink-0 text-body-sm text-muted-foreground tabular">212 / 3000</p>
        </div>
        <p id="pf-desc-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
      </div>
    </div>
  </section>
  <section class="panel" aria-labelledby="pf-halal">
    <header class="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
      <div>
        <h2 id="pf-halal" class="text-h4">Halal information</h2>
        <p class="text-body-sm text-muted-foreground">Required for food, drinks, supplements and cosmetics. Buyers see the certifier and expiry date.</p>
      </div>
      <span class="badge badge-warning"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-clock"/></svg>In review</span>
    </header>
    <div class="grid gap-4 p-4">
      <fieldset class="grid">
        <legend class="mb-1 text-label">Halal status</legend>
        <label for="pf-hs1" class="flex min-h-touch items-start gap-3 py-2.5"><input id="pf-hs1" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="pf-hs" checked aria-describedby="pf-hs1-desc"><span class="grid gap-0.5"><span class="text-body">Halal certified</span><span id="pf-hs1-desc" class="text-body-sm text-muted-foreground">I have a valid certificate that covers this product.</span></span></label>
        <label for="pf-hs2" class="flex min-h-touch items-start gap-3 py-2.5"><input id="pf-hs2" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="pf-hs" aria-describedby="pf-hs2-desc"><span class="grid gap-0.5"><span class="text-body">Not food or ingestible</span><span id="pf-hs2-desc" class="text-body-sm text-muted-foreground">Modest fashion, prayer items, books. No certificate needed.</span></span></label>
      </fieldset>
      <div class="grid gap-4 md:grid-cols-2">
        <div class="grid gap-1.5">
          <div class="flex items-baseline justify-between gap-2">
            <label for="pf-body" class="text-label text-foreground">Certifying body<span class="text-danger" aria-hidden="true"> *</span></label>
          </div>
          <div class="relative" data-ds-combobox><input id="pf-body" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="pf-body-list" autocomplete="off" value="Islamic Da’wah Council of the Philippines (IDCP)" class="field pr-10" required aria-describedby="pf-body-error" data-ds-open-on-focus><svg class="icon pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true"><use href="#i-chevron-down"/></svg>
            <ul id="pf-body-list" role="listbox" aria-label="Certifying body" class="absolute inset-x-0 top-full z-sheet mt-1 max-h-64 overflow-auto rounded-panel border border-border bg-surface py-1 shadow-popover" hidden>
              <li id="pf-body-opt-0" role="option" aria-selected="true" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Islamic Da’wah Council of the Philippines (IDCP)</li>
              <li id="pf-body-opt-1" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Halal Development Institute of the Philippines (HDIP)</li>
              <li id="pf-body-opt-2" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Mindanao Halal Authority (MinHA)</li>
            </ul>
            <p data-ds-empty hidden class="absolute inset-x-0 top-full z-sheet mt-1 rounded-panel border border-border bg-surface px-3 py-3 text-body text-muted-foreground shadow-popover">No matches</p>
            <p class="sr-only" aria-live="polite" data-ds-live></p>
          </div>
          <p id="pf-body-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
        </div>
        <div class="grid gap-1.5">
          <div class="flex items-baseline justify-between gap-2">
            <label for="pf-cno" class="text-label text-foreground">Certificate number<span class="text-danger" aria-hidden="true"> *</span></label>
          </div>
          <input id="pf-cno" type="text" class="field" value="HC-2026-00481" inputmode="text" aria-describedby="pf-cno-error">
          <p id="pf-cno-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
        </div>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <div class="grid gap-1.5">
          <div class="flex items-baseline justify-between gap-2">
            <label for="pf-exp" class="text-label text-foreground">Valid until<span class="text-danger" aria-hidden="true"> *</span></label>
          </div>
          <input id="pf-exp" type="date" class="field" value="2028-03-14" aria-describedby="pf-exp-help pf-exp-error">
          <div class="flex gap-2">
            <p id="pf-exp-help" class="text-body-sm text-muted-foreground">We hide halal listings the day after this date.</p>
          </div>
          <p id="pf-exp-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
        </div>
        <div class="grid content-start gap-1">
          <p class="text-label" id="pf-cert-l">Certificate file</p>
          <div class="flex min-h-touch items-center gap-2 rounded-field border border-border-control bg-surface px-3" role="group" aria-labelledby="pf-cert-l"><svg class="icon text-muted-foreground" aria-hidden="true"><use href="#i-file-text"/></svg><span class="min-w-0 flex-1 truncate text-body">IDCP-certificate.pdf</span>
            <button type="button" class="btn btn-ghost btn-sm">Replace</button>
          </div>
          <p class="text-body-sm text-muted-foreground">PDF or photo, up to 10 MB. Reviewed within 1 business day.</p>
        </div>
      </div>
      <div class="grid gap-1.5">
        <div class="flex items-baseline justify-between gap-2">
          <label for="pf-ing" class="text-label text-foreground">Ingredients<span class="text-danger" aria-hidden="true"> *</span></label>
        </div>
        <textarea id="pf-ing" rows="3" class="field" aria-describedby="pf-ing-help pf-ing-error">Ajwa dates (100%).</textarea>
        <div class="flex gap-2">
          <p id="pf-ing-help" class="text-body-sm text-muted-foreground">List every ingredient, including additives, gelatin, enzymes and flavourings.</p>
        </div>
        <p id="pf-ing-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
      </div>
      <label for="pf-decl" class="flex min-h-touch items-start gap-3 py-2.5 rounded-panel bg-halal-soft px-3"><input id="pf-decl" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary" checked><span class="grid gap-0.5"><span class="text-body">I confirm this product contains no pork, alcohol or their derivatives.</span></span></label>
    </div>
  </section>
  <section class="panel" aria-labelledby="pf-media">
    <header class="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
      <div>
        <h2 id="pf-media" class="text-h4">Media</h2>
        <p class="text-body-sm text-muted-foreground">Up to 9 photos. The first is the cover.</p>
      </div>
    </header>
    <div class="grid gap-4 p-4">
      <div class="grid gap-2" data-ds-uploader>
        <div class="flex items-baseline justify-between">
          <p id="pf-photos-label" class="text-label">Product photos</p>
          <p class="text-body-sm text-muted-foreground tabular">3 / 9</p>
        </div>
        <ul class="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-2" data-ds-tiles aria-labelledby="pf-photos-label">
          <li class="relative" data-name="Cover.jpg">
            <div class="relative aspect-square overflow-hidden rounded-tile border border-border bg-surface-muted"><img alt="" class="size-full object-cover"><span class="badge badge-solid absolute left-1 top-1">Cover</span></div>
            <button type="button" class="btn btn-icon btn-neutral btn-sm absolute right-0 top-0 rounded-full border-transparent text-danger shadow-popover" data-ds-remove aria-label="Remove Cover.jpg"><svg class="icon size-4" aria-hidden="true"><use href="#i-x"/></svg></button>
            <div class="mt-1 flex justify-between">
              <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="-1" aria-label="Move Cover.jpg earlier"><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-left"/></svg></button>
              <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="1" aria-label="Move Cover.jpg later"><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-right"/></svg></button>
            </div>
          </li>
          <li class="relative" data-name="Side.jpg">
            <div class="relative aspect-square overflow-hidden rounded-tile border border-border bg-surface-muted"><img alt="" class="size-full object-cover"></div>
            <button type="button" class="btn btn-icon btn-neutral btn-sm absolute right-0 top-0 rounded-full border-transparent text-danger shadow-popover" data-ds-remove aria-label="Remove Side.jpg"><svg class="icon size-4" aria-hidden="true"><use href="#i-x"/></svg></button>
            <div class="mt-1 flex justify-between">
              <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="-1" aria-label="Move Side.jpg earlier"><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-left"/></svg></button>
              <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="1" aria-label="Move Side.jpg later"><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-right"/></svg></button>
            </div>
          </li>
          <li class="relative" data-name="Lid.jpg">
            <div class="relative aspect-square overflow-hidden rounded-tile border border-border bg-surface-muted"><img alt="" class="size-full object-cover">
              <div class="absolute inset-x-2 bottom-2 h-1.5 overflow-hidden rounded-full bg-surface" role="progressbar" aria-label="Uploading Lid.jpg" aria-valuenow="70" aria-valuemin="0" aria-valuemax="100">
                <div class="h-full bg-primary" style="width:70%"></div>
              </div>
            </div>
            <button type="button" class="btn btn-icon btn-neutral btn-sm absolute right-0 top-0 rounded-full border-transparent text-danger shadow-popover" data-ds-remove aria-label="Remove Lid.jpg"><svg class="icon size-4" aria-hidden="true"><use href="#i-x"/></svg></button>
            <div class="mt-1 flex justify-between">
              <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="-1" aria-label="Move Lid.jpg earlier"><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-left"/></svg></button>
              <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="1" aria-label="Move Lid.jpg later"><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-right"/></svg></button>
            </div>
          </li>
          <li data-ds-add>
            <label for="pf-photos" class="grid aspect-square cursor-pointer place-items-center rounded-tile border-2 border-dashed border-border-control bg-surface text-center text-body-sm font-bold text-primary hover:bg-primary-soft has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring"><span><svg class="icon mx-auto size-6" aria-hidden="true"><use href="#i-image-plus"/></svg>Add photo</span></label>
            <input id="pf-photos" type="file" accept="image/*" multiple class="sr-only">
          </li>
        </ul>
        <template>
          <li class="relative" data-name="">
            <div class="relative aspect-square overflow-hidden rounded-tile border border-border bg-surface-muted"><img alt="" class="size-full object-cover"></div>
            <button type="button" class="btn btn-icon btn-neutral btn-sm absolute right-0 top-0 rounded-full border-transparent text-danger shadow-popover" data-ds-remove aria-label="Remove "><svg class="icon size-4" aria-hidden="true"><use href="#i-x"/></svg></button>
            <div class="mt-1 flex justify-between">
              <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="-1" aria-label="Move earlier"><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-left"/></svg></button>
              <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="1" aria-label="Move later"><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-right"/></svg></button>
            </div>
          </li>
        </template>
        <p class="sr-only" aria-live="polite" data-ds-live></p>
      </div>
    </div>
  </section>
  <section class="panel" aria-labelledby="pf-sales">
    <header class="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
      <div>
        <h2 id="pf-sales" class="text-h4">Sales information</h2>
      </div>
    </header>
    <div class="grid gap-4 p-4">
      <label for="pf-hasvar" class="flex min-h-touch items-center justify-between gap-4 py-2"><span class="grid gap-0.5"><span class="text-body">This product has variations</span><span class="text-body-sm text-muted-foreground">Colors, sizes, flavors.</span></span><input id="pf-hasvar" type="checkbox" role="switch" class="relative h-7 w-12 shrink-0 cursor-pointer appearance-none rounded-full bg-border-control transition-colors duration-token before:absolute before:left-1 before:top-1 before:size-5 before:rounded-full before:bg-surface before:shadow-popover before:transition-transform before:duration-token checked:bg-primary checked:before:translate-x-5 hover:bg-muted-foreground checked:hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60" checked></label>
      <p class="text-body-sm text-muted-foreground">Set price and stock per variation in the table below.</p>
    </div>
  </section>
  <section class="panel" aria-labelledby="pf-ship">
    <header class="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
      <div>
        <h2 id="pf-ship" class="text-h4">Shipping</h2>
      </div>
      <span class="badge badge-danger"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-circle-alert"/></svg>1 issue</span>
    </header>
    <div class="grid gap-4 p-4">
      <div class="grid gap-4 md:grid-cols-4">
        <div class="grid gap-1.5">
          <div class="flex items-baseline justify-between gap-2">
            <label for="pf-w" class="text-label text-foreground">Weight<span class="text-danger" aria-hidden="true"> *</span></label>
          </div>
          <div class="relative"><input id="pf-w" type="text" class="field pr-12" inputmode="decimal" aria-invalid="true" aria-describedby="pf-w-error"><span class="absolute inset-y-0 right-0 flex items-center"><span class="pr-3 text-body text-muted-foreground">kg</span></span></div>
          <p id="pf-w-error" class="flex items-start gap-1 text-body-sm font-bold text-danger"><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Enter the packed weight.</span></p>
        </div>
        <div class="grid gap-1.5">
          <div class="flex items-baseline justify-between gap-2">
            <label for="pf-L" class="text-label text-foreground">Length <span class="font-normal text-muted-foreground">(optional)</span></label>
          </div>
          <div class="relative"><input id="pf-L" type="text" class="field pr-12" value="9" inputmode="decimal" aria-describedby="pf-L-error"><span class="absolute inset-y-0 right-0 flex items-center"><span class="pr-3 text-body text-muted-foreground">cm</span></span></div>
          <p id="pf-L-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
        </div>
        <div class="grid gap-1.5">
          <div class="flex items-baseline justify-between gap-2">
            <label for="pf-W" class="text-label text-foreground">Width <span class="font-normal text-muted-foreground">(optional)</span></label>
          </div>
          <div class="relative"><input id="pf-W" type="text" class="field pr-12" value="9" inputmode="decimal" aria-describedby="pf-W-error"><span class="absolute inset-y-0 right-0 flex items-center"><span class="pr-3 text-body text-muted-foreground">cm</span></span></div>
          <p id="pf-W-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
        </div>
        <div class="grid gap-1.5">
          <div class="flex items-baseline justify-between gap-2">
            <label for="pf-H" class="text-label text-foreground">Height <span class="font-normal text-muted-foreground">(optional)</span></label>
          </div>
          <div class="relative"><input id="pf-H" type="text" class="field pr-12" value="24" inputmode="decimal" aria-describedby="pf-H-error"><span class="absolute inset-y-0 right-0 flex items-center"><span class="pr-3 text-body text-muted-foreground">cm</span></span></div>
          <p id="pf-H-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
        </div>
      </div>
    </div>
  </section>
  <div class="relative border-t border-border bg-surface shadow-sticky pb-safe">
    <div class="mx-auto flex max-w-container items-center gap-2 px-gutter py-2">
      <p class="hidden flex-1 text-body-sm text-muted-foreground md:block">Draft saved 2 min ago</p>
      <button type="button" class="btn btn-neutral btn-lg flex-1 md:flex-none"><span>Save draft</span></button>
      <button type="button" class="btn btn-lg flex-1 md:flex-none"><span>Publish</span></button>
    </div>
  </div>
</div>
```

## 12. Test notes
- Bar doesn’t cover last field at 360px.
