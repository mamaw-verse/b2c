# OrderCard

Commerce · Phase 3 · Live sheet: `styleguide/components/order-card.html`

## 1. Purpose
Order in My Purchases: shop, status badge, tracking note, items, total, actions for the current status.

**Use when**
- Order lists by status.

**Don't use when**
- Seller order lists (OrderRow, Phase 4).

## 2. Anatomy
1. Header: shop + status badge.
2. Tracking note link (To Receive).
3. Item rows (thumb, title, variation × qty, price).
4. Total.
5. Actions: secondary neutral + primary.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| To Pay | actions: Pay now |  |
| To Ship | Contact seller |  |
| To Receive | Order received |  |
| Completed | Rate / Buy again |  |
| Cancelled | Buy again |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Links. |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | n/a: Action button loading. |
| Error | n/a: n/a |
| Selected | n/a: n/a |
| Empty | rendered |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Edge-to-edge sections. |
| Tablet (md, 768px+) | Rounded panels. |
| Desktop (lg, 1024px+) | Inside the account shell column. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| order | Order | — |  |
| actions | Button[] | by status |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `article` with shop heading. |
| Accessible name | Status in text badge. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--brand-700`, `--dur`, `--ease-out`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-h4`, `--fs-label`, `--fs-price`, `--gutter`, `--info`, `--info-soft`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--r-card`, `--r-panel`, `--r-tile`, `--ring`, `--sale`, `--success`, `--success-soft`, `--surface`, `--surface-muted`, `--surface-subtle`, `--touch-min`, `--warning`, `--warning-soft`, `currentColor (icons)`

## 9. Content rules
- Status names match the tabs.

## 10. Do / Don't
**Do**
- One primary action per status.

**Don't**
- Don’t show more than 3 actions.

## 11. HTML usage
```html
<article class="bg-surface md:rounded-panel md:border md:border-border">
  <div class="flex items-center gap-2 border-b border-border px-gutter py-2 md:px-4">
    <h3 class="flex min-w-0 flex-1 items-center gap-1.5 text-label"><svg class="icon size-4 shrink-0" aria-hidden="true"><use href="#i-store"/></svg><span class="truncate">Barakah Pantry</span></h3>
    <span class="badge badge-info">To Receive</span>
  </div>
  <a href="#" class="flex min-h-touch items-center gap-2 border-b border-border px-gutter text-body-sm text-success hover:bg-surface-subtle md:px-4"><svg class="icon size-4" aria-hidden="true"><use href="#i-truck"/></svg><span class="flex-1">Parcel is out for delivery</span><svg class="icon size-4 text-muted-foreground" aria-hidden="true"><use href="#i-chevron-right"/></svg></a>
  <ul class="divide-y divide-border px-gutter md:px-4">
    <li class="flex gap-3 py-3">
      <div class="w-16 shrink-0 overflow-hidden rounded-tile">
        <div class="grid w-full place-items-center overflow-hidden aspect-square bg-brand-100 text-brand-700" aria-hidden="true"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-cookie"/></svg></div>
      </div>
      <div class="grid min-w-0 flex-1 grid-cols-1 gap-0.5">
        <p class="line-clamp-2 text-body"><a href="#" class="hover:underline">Ajwa dates 500g, premium grade</a></p>
        <p class="text-body-sm text-muted-foreground">Premium, 500g · ×2</p>
      </div>
      <div class="text-right">
        <p class="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5"><span data-price class="text-body font-extrabold text-foreground">₱649</span></p>
      </div>
    </li>
  </ul>
  <div class="flex items-baseline justify-end gap-2 border-t border-border px-gutter py-2 text-body md:px-4"><span class="text-muted-foreground">Order total:</span><span class="text-price text-sale tabular">₱1,438</span></div>
  <div class="flex flex-wrap justify-end gap-2 border-t border-border px-gutter py-2 md:px-4">
    <button type="button" class="btn btn-neutral btn-sm"><span>Contact seller</span></button>
    <button type="button" class="btn btn-sm"><span>Order received</span></button>
  </div>
</article>
```

## 12. Test notes
- Actions wrap at 360px.
