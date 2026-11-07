# CartShopGroup

Commerce · Phase 3 · Live sheet: `styleguide/components/cart-shop-group.html`

## 1. Purpose
Cart section per shop with select-all, shop link, chat, items and shop voucher.

**Use when**
- Cart.

**Don't use when**
- Checkout (OrderCard-like groups).

## 2. Anatomy
1. Header: select-all checkbox (indeterminate), shop name + badge, chat IconButton.
2. CartItems.
3. Shop voucher row.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `cartShopGroup()` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Children. |
| Pressed | n/a: n/a |
| Focus-visible | n/a: Children. |
| Disabled | n/a: All items unavailable → group shows “Unavailable items” heading. |
| Loading | n/a: n/a |
| Error | n/a: n/a |
| Selected | rendered |
| Empty | rendered |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Edge-to-edge white sections separated by 8px canvas. |
| Tablet (md, 768px+) | Rounded panels. |
| Desktop (lg, 1024px+) | Left column; OrderSummary + Checkout on the right. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| shop | Shop | — |  |
| items | CartItem[] | — |  |
| voucher | Voucher | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `section` labelled by the shop name. |
| Accessible name | — |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | Select-all reflects mixed state. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Selection changes update the checkout total (polite). |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--brand-700`, `--dur`, `--ease-out`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-h4`, `--fs-input`, `--fs-label`, `--gutter`, `--halal`, `--halal-soft`, `--info`, `--info-soft`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--r-field`, `--r-panel`, `--r-tile`, `--ring`, `--sale`, `--sale-soft`, `--surface`, `--surface-muted`, `--surface-subtle`, `--touch-min`, `--touch-primary`, `--warning`, `currentColor (icons)`

## 9. Content rules
- Shop name links to the shop.

## 10. Do / Don't
**Do**
- Group by shop (shipping is per shop).

**Don't**
- Don’t mix shops in one group.

## 11. HTML usage
```html
<section class="bg-surface md:rounded-panel md:border md:border-border" aria-labelledby="csg1-h" data-ds-bulk>
  <div class="flex items-center gap-2 border-b border-border px-gutter md:px-4">
    <label class="grid min-h-touch min-w-9 place-items-center"><input type="checkbox" class="size-5 accent-primary" data-ds-select-all><span class="sr-only">Select all from Barakah Pantry</span></label>
    <h2 id="csg1-h" class="flex min-w-0 flex-1 items-center gap-1.5 text-label"><svg class="icon size-4 shrink-0" aria-hidden="true"><use href="#i-store"/></svg><a href="#" class="flex min-h-touch min-w-0 items-center hover:underline"><span class="truncate">Barakah Pantry</span></a><span class="badge badge-solid px-1.5"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-badge-check"/></svg>Official</span><svg class="icon size-4 shrink-0 text-muted-foreground" aria-hidden="true"><use href="#i-chevron-right"/></svg></h2>
    <button type="button" class="btn btn-icon btn-ghost btn-sm text-foreground" aria-label="Chat with Barakah Pantry"><svg class="icon" aria-hidden="true"><use href="#i-message-circle"/></svg></button>
  </div>
  <ul class="divide-y divide-border px-gutter md:px-4">
    <li class="flex gap-2 py-3">
      <label class="grid min-h-touch min-w-9 content-start justify-items-center pt-6"><input type="checkbox" class="size-5 accent-primary" id="csg1-i0" checked data-ds-bulk-item><span class="sr-only">Select Ajwa dates 500g, premium grade, resealable tub</span></label>
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
            <label for="csg1-i0-q" class="sr-only">Quantity</label>
            <input id="csg1-i0-q" type="text" inputmode="numeric" pattern="[0-9]*" value="2" min="1" max="10" class="w-12 border-x border-border-control bg-transparent text-center text-input font-bold tabular focus-visible:outline-offset-0">
            <button type="button" class="btn btn-ghost btn-icon rounded-none border-0 text-foreground hover:bg-surface-muted active:bg-border disabled:text-muted-foreground" data-ds-step="1" aria-label="Increase quantity"><svg class="icon size-4" aria-hidden="true"><use href="#i-plus"/></svg></button>
            <p class="sr-only" aria-live="polite" data-ds-live></p>
          </div>
        </div>
      </div>
    </li>
    <li class="flex gap-2 py-3">
      <label class="grid min-h-touch min-w-9 content-start justify-items-center pt-6"><input type="checkbox" class="size-5 accent-primary" id="csg1-i1" checked data-ds-bulk-item><span class="sr-only">Select Handwoven Maranao malong, hand-stitched tapestry</span></label>
      <a href="#" class="w-20 shrink-0 overflow-hidden rounded-tile md:w-24" tabindex="-1" aria-hidden="true">
      <div class="grid w-full place-items-center overflow-hidden aspect-square bg-info-soft text-info" aria-hidden="true"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-shopping-bag"/></svg></div>
      </a>
      <div class="grid min-w-0 flex-1 grid-cols-1 gap-1.5">
        <p class="line-clamp-2 text-body"><a href="#" class="hover:underline">Handwoven Maranao malong, hand-stitched tapestry</a></p>
        <button type="button" class="relative inline-flex min-h-9 w-fit max-w-full items-center gap-1 rounded-badge bg-surface-muted px-2 text-body-sm text-muted-foreground hover:bg-border after:absolute after:inset-x-0 after:-inset-y-1" aria-label="Variation: Black. Change">Black<svg class="icon size-4 shrink-0" aria-hidden="true"><use href="#i-chevron-down"/></svg></button>
        <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 [&>:last-child]:ml-auto">
          <p class="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5"><span data-price class="text-body font-extrabold text-foreground">₱1,850</span></p>
          <div class="inline-flex items-stretch overflow-hidden rounded-field border border-border-control bg-surface" data-ds-stepper role="group" aria-label="Quantity">
            <button type="button" class="btn btn-ghost btn-icon rounded-none border-0 text-foreground hover:bg-surface-muted active:bg-border disabled:text-muted-foreground" data-ds-step="-1" aria-label="Decrease quantity" disabled><svg class="icon size-4" aria-hidden="true"><use href="#i-minus"/></svg></button>
            <label for="csg1-i1-q" class="sr-only">Quantity</label>
            <input id="csg1-i1-q" type="text" inputmode="numeric" pattern="[0-9]*" value="1" min="1" max="10" class="w-12 border-x border-border-control bg-transparent text-center text-input font-bold tabular focus-visible:outline-offset-0">
            <button type="button" class="btn btn-ghost btn-icon rounded-none border-0 text-foreground hover:bg-surface-muted active:bg-border disabled:text-muted-foreground" data-ds-step="1" aria-label="Increase quantity"><svg class="icon size-4" aria-hidden="true"><use href="#i-plus"/></svg></button>
            <p class="sr-only" aria-live="polite" data-ds-live></p>
          </div>
        </div>
        <p class="text-body-sm text-warning">Only 3 left</p>
      </div>
    </li>
  </ul>
  <button type="button" class="flex min-h-touch w-full items-center gap-2 border-t border-border px-gutter text-body-sm hover:bg-surface-subtle md:px-4"><svg class="icon size-4 text-sale" aria-hidden="true"><use href="#i-ticket"/></svg><span class="flex-1 text-left">Shop voucher: <span class="font-bold">₱50 off</span> on ₱500</span><span class="text-primary">More vouchers</span><svg class="icon size-4 text-muted-foreground" aria-hidden="true"><use href="#i-chevron-right"/></svg></button>
</section>
```

## 12. Test notes
- Select-all indeterminate when partially selected.
