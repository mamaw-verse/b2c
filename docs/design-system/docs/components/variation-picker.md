# VariationPicker

Commerce · Phase 3 · Live sheet: `styleguide/components/variation-picker.html`

## 1. Purpose
Bottom sheet for choosing variation (color, size) and quantity before Add to cart / Buy now.

**Use when**
- Product detail when the product has variations.

**Don't use when**
- Single-SKU products (add directly).

## 2. Anatomy
1. Sheet header “Select variation”.
2. Summary: thumbnail, price for the selection, stock.
3. Option groups (`fieldset` + radios styled as chips, image chips for color, sold-out dashed + disabled).
4. QuantityStepper.
5. Footer: Add to cart (secondary) + Buy now.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Sheet | `variationPicker()` | Phone + tablet. |
| Inline | `variationBody()` in the buy box | Desktop product detail. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Chips tint on hover. |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: Sold-out options are shown in the default cell (dashed, disabled, “(sold out)”). |
| Loading | n/a: Footer buttons loading after submit. |
| Error | rendered |
| Selected | n/a: Checked chip: primary border + soft bg. |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Bottom sheet from the sticky bar; footer buttons side by side. |
| Tablet (md, 768px+) | Bottom sheet, 36rem wide. |
| Desktop (lg, 1024px+) | Inline in the buy box (no sheet). |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| product | Product | — |  |
| options | {name, values[{label, image, soldOut}]}[] | — |  |
| selection | map | — |  |
| mode | `add` \| `buy` \| `both` | `both` | Which buttons show. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Modal dialog; each option group is a radio group. |
| Accessible name | Legend shows the current choice (“Color: Sage”). |
| Keyboard | Arrows within a group; Tab between groups. |
| Focus management | Into the sheet; back to the triggering button. |
| ARIA | Sold-out = native disabled radio + visible “(sold out)”. |
| Touch target | Chips 44px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Price/stock update text is in the summary (polite on change in ports). |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--brand-700`, `--brand-950`, `--danger`, `--dur`, `--ease-out`, `--elevation-sheet`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-h3`, `--fs-input`, `--fs-label`, `--fs-price-lg`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--r-field`, `--r-panel`, `--r-tile`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--z-modal`, `currentColor (icons)`

## 9. Content rules
- Option labels as the seller wrote them.
- Error: “Select a color and size.”

## 10. Do / Don't
**Do**
- Update price and stock for the selection.

**Don't**
- Don’t hide sold-out options.

## 11. HTML usage
```html
<button type="button" class="btn btn-secondary" data-ds-open="vp1"><span>Select variation</span></button>
<dialog id="vp1" aria-labelledby="vp1-title" class="z-modal bg-surface p-0 shadow-sheet transition-[translate,opacity,scale,display,overlay] transition-discrete duration-token mt-auto mb-0 w-full max-h-[90dvh] rounded-t-panel md:mx-auto md:max-w-xl starting:open:translate-y-full">
  <div class="flex max-h-[inherit] flex-col ">
    <div class="flex justify-center pt-2 md:hidden" data-ds-sheet-handle><span class="h-1.5 w-10 rounded-full bg-border-control" aria-hidden="true"></span></div>
    <div class="flex items-center gap-2 border-b border-border py-1 pl-4 pr-1 md:py-2">
      <h2 id="vp1-title" class="flex-1 text-h3">Select variation</h2>
      <button type="button" class="btn btn-icon btn-ghost text-foreground" aria-label="Close" data-ds-close><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg></button>
    </div>
    <div class="overflow-y-auto overscroll-contain flex-1 p-4">
      <div class="grid gap-5">
        <div class="flex gap-3">
          <div class="w-20 shrink-0 overflow-hidden rounded-tile">
            <div class="grid w-full place-items-center overflow-hidden aspect-square bg-brand-100 text-brand-700" aria-hidden="true"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-cookie"/></svg></div>
          </div>
          <div class="grid content-end gap-1">
            <p class="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5"><span class="sr-only">Sale price:</span><span data-price class="text-price-lg text-foreground">₱649</span><span class="sr-only">Original price:</span><s data-price class="text-body text-muted-foreground">₱799</s><span class="badge badge-promo">-19%</span></p>
            <p class="text-body-sm text-muted-foreground">Stock: <span class="tabular">42</span></p>
          </div>
        </div>
        <fieldset>
          <legend class="mb-2 text-label">Grade: <span class="font-normal text-muted-foreground">Premium</span></legend>
          <div class="flex flex-wrap gap-2">
            <label class="relative flex min-h-touch cursor-pointer items-center gap-2 rounded-button border border-border-control bg-surface px-3 text-body hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary-soft-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:border-dashed has-[:disabled]:text-muted-foreground has-[:disabled]:hover:border-border-control focus-ring"><input type="radio" name="vp1-c" class="sr-only" checked>Premium</label>
            <label class="relative flex min-h-touch cursor-pointer items-center gap-2 rounded-button border border-border-control bg-surface px-3 text-body hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary-soft-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:border-dashed has-[:disabled]:text-muted-foreground has-[:disabled]:hover:border-border-control focus-ring"><input type="radio" name="vp1-c" class="sr-only">Standard</label>
            <label class="relative flex min-h-touch cursor-pointer items-center gap-2 rounded-button border border-border-control bg-surface px-3 text-body hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary-soft-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:border-dashed has-[:disabled]:text-muted-foreground has-[:disabled]:hover:border-border-control focus-ring"><input type="radio" name="vp1-c" class="sr-only" disabled>Sukkari<span class="text-caption">(sold out)</span></label>
          </div>
        </fieldset>
        <fieldset>
          <legend class="mb-2 text-label">Weight</legend>
          <div class="flex flex-wrap gap-2">
            <label class="relative flex min-h-touch cursor-pointer items-center gap-2 rounded-button border border-border-control bg-surface px-3 text-body hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary-soft-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:border-dashed has-[:disabled]:text-muted-foreground has-[:disabled]:hover:border-border-control focus-ring"><input type="radio" name="vp1-s" class="sr-only">250g</label>
            <label class="relative flex min-h-touch cursor-pointer items-center gap-2 rounded-button border border-border-control bg-surface px-3 text-body hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary-soft-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:border-dashed has-[:disabled]:text-muted-foreground has-[:disabled]:hover:border-border-control focus-ring"><input type="radio" name="vp1-s" class="sr-only" checked>500g</label>
            <label class="relative flex min-h-touch cursor-pointer items-center gap-2 rounded-button border border-border-control bg-surface px-3 text-body hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary-soft-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:border-dashed has-[:disabled]:text-muted-foreground has-[:disabled]:hover:border-border-control focus-ring"><input type="radio" name="vp1-s" class="sr-only">1kg</label>
          </div>
        </fieldset>
        <div class="flex items-center justify-between">
          <p class="text-label" id="vp1-qty-l">Quantity</p>
          <div class="focus-ring inline-flex items-stretch overflow-hidden rounded-field border border-border-control bg-surface" data-ds-stepper role="group" aria-label="Quantity">
            <button type="button" class="btn btn-ghost btn-icon rounded-none border-0 text-foreground hover:bg-surface-muted active:bg-border disabled:text-muted-foreground" data-ds-step="-1" aria-label="Decrease quantity" disabled><svg class="icon size-4" aria-hidden="true"><use href="#i-minus"/></svg></button>
            <label for="vp1-qty" class="sr-only">Quantity</label>
            <input id="vp1-qty" type="text" inputmode="numeric" pattern="[0-9]*" value="1" min="1" max="42" class="w-12 border-x border-border-control bg-transparent text-center text-input font-bold tabular">
            <button type="button" class="btn btn-ghost btn-icon rounded-none border-0 text-foreground hover:bg-surface-muted active:bg-border disabled:text-muted-foreground" data-ds-step="1" aria-label="Increase quantity"><svg class="icon size-4" aria-hidden="true"><use href="#i-plus"/></svg></button>
            <p class="sr-only" aria-live="polite" data-ds-live></p>
          </div>
        </div>
      </div>
    </div>
    <div class="flex flex-row gap-2 border-t border-border px-4 pt-3 pb-[calc(.75rem+env(safe-area-inset-bottom,0px))]">
      <button type="button" class="btn btn-secondary btn-lg flex-1"><span>Add to cart</span></button>
      <button type="button" class="btn btn-lg flex-1"><span>Buy now</span></button>
    </div>
  </div>
</dialog>
```

## 12. Test notes
- Disabled chips are skipped by arrow keys.
- Footer above safe area.
