# ProductCard

Commerce · Phase 3 · Live sheet: `styleguide/components/product-card.html`

## 1. Purpose
The dense, scannable product tile: image, 2-line title, price, discount, rating, “N sold”, location, verified badge. One link per card.

**Use when**
- Product grids (home, search, category, shop).
- List view in search; compact in carousels and chat.

**Don't use when**
- Cart and order lines (CartItem, OrderCard).

## 2. Anatomy
1. Square media (placeholder slot), discount badge top-right (`badge-sale-solid`), Free shipping badge bottom-left.
2. Title: `line-clamp-2`, reserved 2 lines; verified sellers get an icon-only VerifiedBadge prefix (sr-only “Verified seller:”) so the title keeps both lines.
3. PriceBlock without its % badge (the corner badge already shows it).
4. Rating star (decorative) + value + SoldCount.
5. Location with pin.
6. Stretched link: title `` covers the card (`after:inset-0`).

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Grid | `productCard(p)` | 2 columns on phone (Shopee-dense). |
| List | `variant: "list"` | Search list view. |
| Compact | `variant: "compact"` | 128px tiles in horizontal rails / chat. |
| Skeleton | `variant: "skeleton"` | Loading grid. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: Navigates. |
| Focus-visible | rendered |
| Disabled | rendered |
| Loading | n/a: Skeleton. |
| Error | n/a: Media falls back to placeholder. |
| Selected | n/a: n/a |
| Empty | rendered |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | 2-column grid, 8px gap; title 14px, price 17px. |
| Tablet (md, 768px+) | 3 columns, 12px gap. |
| Desktop (lg, 1024px+) | 5 columns in a 1240px container; hover elevation. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| product | {name, price, was, rating, sold, loc, verified, free, image} | — |  |
| variant | `grid` \| `list` \| `compact` \| `skeleton` | `grid` |  |
| href | url | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `article` with heading; one link (the title) stretched over the card. |
| Accessible name | Product title. |
| Keyboard | One Tab stop per card. |
| Focus management | Card shows the ring via `has-[:focus-visible]`. |
| ARIA | Media decorative (title names it); star `aria-hidden`; sr-only “Rated”. |
| Touch target | Whole card. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Prices use `data-price` (tabular numerals) and `--sale` only when discounted; struck-through price has sr-only “Original price:”. |

## 8. Tokens used
`--border`, `--brand-100`, `--brand-700`, `--dur`, `--ease-out`, `--elevation-card-hover`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-label`, `--fs-price`, `--halal`, `--halal-soft`, `--info`, `--info-soft`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--promo`, `--r-badge`, `--r-button`, `--r-card`, `--r-tile`, `--rating`, `--ring`, `--sale`, `--sale-soft`, `--success`, `--success-soft`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--warning`, `--warning-soft`, `currentColor (icons)`

## 9. Content rules
- Title from seller, clamped to 2 lines (never cut mid-word in code; CSS clamps).
- Sold: `1.2k sold`, `12.4k sold`; hide when 0 (show “New”).
- Location: city only.

## 10. Do / Don't
**Do**
- Reserve 2 title lines so prices align.
- Keep the card a single link.

**Don't**
- Don’t add buttons inside grid cards.
- Don’t show more than 2 badges on the image.

## 11. HTML usage
```html
<article class="card card-interactive relative flex flex-col overflow-hidden focus-ring">
  <div class="relative">
    <div class="grid w-full place-items-center overflow-hidden aspect-square bg-brand-100 text-brand-700" aria-hidden="true"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-cookie"/></svg></div>
    <span class="badge badge-promo-solid absolute right-0 top-0 rounded-none rounded-bl-tile"><span class="sr-only">Discount </span>-19%</span><span class="badge badge-halal-solid absolute left-1.5 top-1.5" aria-label="Halal certified, verified by {{BRAND_NAME}}"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-moon-star"/></svg>Halal<span class="sr-only"> certified by IDCP</span></span><span class="badge badge-success absolute bottom-1.5 left-1.5"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-truck"/></svg>Free shipping</span>
  </div>
  <div class="flex flex-1 flex-col gap-1 p-2">
    <h3 class="line-clamp-2 min-h-[2lh] text-body" title="Ajwa dates 500g, premium grade, resealable tub"><a href="#" class="after:absolute after:inset-0">Ajwa dates 500g, premium grade, resealable tub</a></h3>
    <div class="mt-auto grid gap-1">
      <div class="flex items-center gap-2">
        <p class="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 min-w-0 flex-1"><span class="sr-only">Sale price:</span><span data-price class="text-price text-foreground">₱649</span><span class="sr-only">Original price:</span><s data-price class="text-body-sm text-muted-foreground">₱799</s></p>
        <button type="button" class="btn btn-icon btn-secondary btn-sm relative z-10 ml-auto shrink-0" aria-label="Add Ajwa dates 500g, premium grade, resealable tub to cart"><svg class="icon" aria-hidden="true"><use href="#i-shopping-cart"/></svg></button>
      </div>
      <p class="flex items-center gap-1.5 text-caption text-muted-foreground"><svg class="icon size-3.5 fill-current stroke-0 text-rating" aria-hidden="true"><use href="#i-star"/></svg><span class="sr-only">Rated</span><span class="font-bold text-foreground tabular">4.9</span><span aria-hidden="true">·</span><span class="tabular">12.4k sold</span></p>
      <p class="flex min-w-0 items-center gap-1 text-caption text-muted-foreground"><svg class="icon size-3.5 shrink-0" aria-hidden="true"><use href="#i-map-pin"/></svg><span class="truncate">Taguig</span></p>
    </div>
  </div>
</article>
```

## 12. Test notes
- Two columns fit at 360px with ₱12,499 and “-42%”.
- One focus stop; ring visible.
- Screen reader reads title, sale + original price, rating, sold, location.
