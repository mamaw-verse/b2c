# ChatProductCard / ChatOrderCard

Chat & notifications · Phase 3 · Live sheet: `styleguide/components/chat-cards.html`

## 1. Purpose
Rich message cards for a product being asked about and an order reference.

**Use when**
- Sending a product from the product page; referencing an order.

**Don't use when**
- Outside chat.

## 2. Anatomy
1. Product: thumbnail, title, price, Buy now.
2. Order: ID, status badge, items · total, View order.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Product | `chatProductCard()` |  |
| Order | `chatOrderCard()` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Links. |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: Unavailable product: “No longer available”. |
| Loading | n/a: n/a |
| Error | n/a: n/a |
| Selected | n/a: n/a |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Max 20rem. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| product | Product | — |  |
| order | {id, status, total} | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Group within a list item. |
| Accessible name | — |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--brand-100`, `--brand-700`, `--dur`, `--ease-out`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--r-card`, `--r-tile`, `--ring`, `--sale`, `--sale-soft`, `--surface`, `--touch-min`, `--warning`, `--warning-soft`, `currentColor (icons)`

## 9. Content rules
- Order IDs tabular.

## 10. Do / Don't
**Do**
- Link to the real page.

**Don't**
- Don’t allow payment inside chat cards other than Buy now (goes to checkout).

## 11. HTML usage
```html
<div class="grid gap-3">
  <div class="flex max-w-xs gap-3 rounded-card border border-border bg-surface p-2">
    <div class="w-16 shrink-0 overflow-hidden rounded-tile">
      <div class="grid w-full place-items-center overflow-hidden aspect-square bg-brand-100 text-brand-700" aria-hidden="true"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-cookie"/></svg></div>
    </div>
    <div class="grid min-w-0 flex-1 content-center gap-1">
      <p class="line-clamp-2 text-body-sm"><a href="#" class="hover:underline">Ajwa dates 500g, premium grade</a></p>
      <p class="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5"><span class="sr-only">Sale price:</span><span data-price class="text-body font-extrabold text-sale">₱649</span><span class="sr-only">Original price:</span><s data-price class="text-body-sm text-muted-foreground">₱799</s><span class="badge badge-sale">-19%</span></p>
      <p>
        <button type="button" class="btn btn-sm"><span>Buy now</span></button>
      </p>
    </div>
  </div>
  <div class="grid max-w-xs gap-2 rounded-card border border-border bg-surface p-3">
    <p class="flex items-center justify-between gap-2"><span class="text-label">Order <span class="tabular">#240311-0042</span></span><span class="badge badge-warning">To Ship</span></p>
    <p class="text-body-sm text-muted-foreground">2 items · <span class="font-bold text-foreground tabular">₱1,438</span></p>
    <p>
      <button type="button" class="btn btn-outline btn-sm"><span>View order</span></button>
    </p>
  </div>
</div>
```

## 12. Test notes
- Fits in 80% bubble width at 360px.
