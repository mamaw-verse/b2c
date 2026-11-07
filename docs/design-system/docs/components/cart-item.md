# CartItem

Commerce · Phase 3 · Live sheet: `styleguide/components/cart-item.html`

## 1. Purpose
One cart line: select, thumbnail, title, variation (opens VariationPicker), price, stepper, stock notes.

**Use when**
- Cart.

**Don't use when**
- Checkout (read-only lines).

## 2. Anatomy
1. Checkbox (44px cell).
2. Thumbnail (decorative link duplicate removed from tab order).
3. 2-line title link.
4. Variation button.
5. PriceBlock sm + QuantityStepper.
6. Stock / unavailable note.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `cartItem()` |  |
| Low stock | `stockNote` |  |
| Unavailable | `unavailable` | Disabled checkbox, reason. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Title link. |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | rendered |
| Loading | n/a: Stepper disabled while syncing. |
| Error | rendered |
| Selected | rendered |
| Empty | n/a: See CartShopGroup / Cart EmptyState. |
| Skeleton | n/a: Row skeleton. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Thumbnail 80px; price and stepper wrap if needed. |
| Tablet (md, 768px+) | 96px thumbnail. |
| Desktop (lg, 1024px+) | Same inside the cart column. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| item | {product, variation, qty, stock} | — |  |
| selected | boolean | true |  |
| unavailable | string | — | Reason. |
| onQty / onVariation / onRemove | fn | — | Remove via swipe is optional; always offer a button in the shop menu. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | List item. |
| Accessible name | Checkbox “Select {title}”; variation “Variation: Premium, 500g. Change”. |
| Keyboard | Checkbox, title, variation, stepper. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | All 44px (variation 36px visual + full-row width). |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Stepper announces quantity. |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--brand-700`, `--danger`, `--dur`, `--ease-out`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-input`, `--fs-label`, `--halal`, `--halal-soft`, `--info`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--r-field`, `--r-tile`, `--ring`, `--sale`, `--sale-soft`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--warning`, `currentColor (icons)`

## 9. Content rules
- Stock warnings in `--warning` with text.

## 10. Do / Don't
**Do**
- Keep price next to quantity.

**Don't**
- Don’t remove at quantity 0 silently.

## 11. HTML usage
```html
<ul class="divide-y divide-border">
  <li class="flex gap-2 py-3">
    <label class="grid min-h-touch min-w-9 content-start justify-items-center pt-6"><input type="checkbox" class="size-5 accent-primary" id="ci1" checked data-ds-bulk-item><span class="sr-only">Select Ajwa dates 500g, premium grade, resealable tub</span></label>
    <a href="#" class="w-20 shrink-0 overflow-hidden rounded-tile md:w-24" tabindex="-1" aria-hidden="true">
    <div class="grid w-full place-items-center overflow-hidden aspect-square bg-brand-100 text-brand-700" aria-hidden="true"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-cookie"/></svg></div>
    </a>
    <div class="grid min-w-0 flex-1 grid-cols-1 gap-1.5">
      <p class="line-clamp-2 text-body"><a href="#" class="hover:underline">Ajwa dates 500g, premium grade, resealable tub</a></p>
      <button type="button" class="relative inline-flex min-h-9 w-fit max-w-full items-center gap-1 rounded-badge bg-surface-muted px-2 text-body-sm text-muted-foreground hover:bg-border after:absolute after:inset-x-0 after:-inset-y-1" aria-label="Variation: Premium, 500g. Change">Premium, 500g<svg class="icon size-4 shrink-0" aria-hidden="true"><use href="#i-chevron-down"/></svg></button>
      <p class="flex flex-wrap items-center gap-x-2 gap-y-1"><span class="badge badge-halal"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-moon-star"/></svg>Halal<span class="sr-only"> certified by IDCP</span></span></p>
      <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 [&>:last-child]:ml-auto">
        <p class="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5"><span class="sr-only">Sale price:</span><span data-price class="text-body font-extrabold text-sale">₱649</span><span class="sr-only">Original price:</span><s data-price class="text-body-sm text-muted-foreground">₱799</s><span class="badge badge-sale">-19%</span></p>
        <div class="inline-flex items-stretch overflow-hidden rounded-field border border-border-control bg-surface" data-ds-stepper role="group" aria-label="Quantity">
          <button type="button" class="btn btn-ghost btn-icon rounded-none border-0 text-foreground hover:bg-surface-muted active:bg-border disabled:text-muted-foreground" data-ds-step="-1" aria-label="Decrease quantity"><svg class="icon size-4" aria-hidden="true"><use href="#i-minus"/></svg></button>
          <label for="ci1-q" class="sr-only">Quantity</label>
          <input id="ci1-q" type="text" inputmode="numeric" pattern="[0-9]*" value="2" min="1" max="10" class="w-12 border-x border-border-control bg-transparent text-center text-input font-bold tabular focus-visible:outline-offset-0">
          <button type="button" class="btn btn-ghost btn-icon rounded-none border-0 text-foreground hover:bg-surface-muted active:bg-border disabled:text-muted-foreground" data-ds-step="1" aria-label="Increase quantity"><svg class="icon size-4" aria-hidden="true"><use href="#i-plus"/></svg></button>
          <p class="sr-only" aria-live="polite" data-ds-live></p>
        </div>
      </div>
    </div>
  </li>
</ul>
```

## 12. Test notes
- Fits at 360px with ₱12,499.
