# OrderRow / OrderActionBar

Seller · Phase 4 · Live sheet: `styleguide/components/order-row.html`

## 1. Purpose
Seller order list row (card on phone, row on md+) and the order-detail action bar (sticky on phone).

**Use when**
- Seller Orders list; order detail.

**Don't use when**
- Buyer orders (OrderCard).

## 2. Anatomy
1. Select checkbox (bulk ship / print).
2. Thumbnail, order ID link, buyer · items · payment.
3. Ship-by deadline (urgent = `--sale`, bold, clock icon).
4. Total.
5. Status badge (phone) + primary action (Arrange shipment / Track).
6. ActionBar: chat buyer, Print waybill, Arrange shipment.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| To ship | default |  |
| Shipped | `status: Shipped` |  |
| ActionBar | `orderActionBar()` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Row link. |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | rendered |
| Error | n/a: Toast “Couldn’t arrange shipment”. |
| Selected | rendered |
| Empty | rendered |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Stacked card; checkbox top-right; action full row. Detail page: sticky ActionBar. |
| Tablet (md, 768px+) | Single row grid. |
| Desktop (lg, 1024px+) | Same; ActionBar inline at the bottom of the detail panel. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| order | SellerOrder | — |  |
| selectable | boolean | true |  |
| primaryAction | by status | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | List items; checkbox labelled “Select order #…”. |
| Accessible name | — |
| Keyboard | Checkbox, ID link, action. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Selection count in BulkActionBar. |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--brand-700`, `--dur`, `--ease-out`, `--elevation-sticky`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-h4`, `--fs-label`, `--fs-price`, `--gutter`, `--info`, `--info-soft`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--r-card`, `--r-panel`, `--r-tile`, `--ring`, `--sale`, `--sale-soft`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--warning`, `--warning-soft`, `currentColor (icons)`, `safe-area-inset-bottom`

## 9. Content rules
- Deadline: “Ship by today, 6 PM”.

## 10. Do / Don't
**Do**
- Sort by deadline.

**Don't**
- Don’t hide payment method (COD matters).

## 11. HTML usage
```html
<div data-ds-bulk>
  <ul class="divide-y divide-border overflow-hidden rounded-panel border border-border">
    <li class="relative grid gap-3 bg-surface p-3 md:grid-cols-[auto_4rem_minmax(0,1.5fr)_minmax(0,1fr)_auto_auto] md:items-center md:gap-4 md:px-4 has-[:checked]:bg-primary-soft">
      <label class="absolute right-2 top-2 grid size-11 place-items-center md:static"><input type="checkbox" class="size-5 accent-primary" data-ds-bulk-item><span class="sr-only">Select order #240311-0042</span></label>
      <div class="flex gap-3 md:contents">
        <div class="w-14 shrink-0 overflow-hidden rounded-tile md:w-16">
          <div class="grid w-full place-items-center overflow-hidden aspect-square bg-brand-100 text-brand-700" aria-hidden="true"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-package"/></svg></div>
        </div>
        <div class="grid min-w-0 gap-0.5 pr-10 md:pr-0">
          <p class="text-label"><a href="#" class="text-primary underline">#240311-0042</a></p>
          <p class="truncate text-body-sm text-muted-foreground">Maria Santos · 2 items · GCash</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-2 md:contents">
        <p class="flex items-center gap-1 text-body-sm font-bold text-sale"><svg class="icon size-4" aria-hidden="true"><use href="#i-clock"/></svg>Ship by today, 6 PM</p>
        <p class="text-price text-foreground tabular md:text-right">₱1,438</p>
      </div>
      <div class="flex gap-2 md:justify-end"><span class="badge badge-warning self-center md:hidden">To ship</span><span class="flex-1 md:hidden"></span>
        <button type="button" class="btn btn-sm"><span>Arrange shipment</span></button>
      </div>
    </li>
    <li class="relative grid gap-3 bg-surface p-3 md:grid-cols-[auto_4rem_minmax(0,1.5fr)_minmax(0,1fr)_auto_auto] md:items-center md:gap-4 md:px-4 has-[:checked]:bg-primary-soft">
      <label class="absolute right-2 top-2 grid size-11 place-items-center md:static"><input type="checkbox" class="size-5 accent-primary" data-ds-bulk-item><span class="sr-only">Select order #240311-0041</span></label>
      <div class="flex gap-3 md:contents">
        <div class="w-14 shrink-0 overflow-hidden rounded-tile md:w-16">
          <div class="grid w-full place-items-center overflow-hidden aspect-square bg-info-soft text-info" aria-hidden="true"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-package"/></svg></div>
        </div>
        <div class="grid min-w-0 gap-0.5 pr-10 md:pr-0">
          <p class="text-label"><a href="#" class="text-primary underline">#240311-0041</a></p>
          <p class="truncate text-body-sm text-muted-foreground">Jose Reyes · 1 item · COD</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-2 md:contents">
        <p class="flex items-center gap-1 text-body-sm text-muted-foreground"><svg class="icon size-4" aria-hidden="true"><use href="#i-clock"/></svg>Ship by tomorrow</p>
        <p class="text-price text-foreground tabular md:text-right">₱499</p>
      </div>
      <div class="flex gap-2 md:justify-end"><span class="badge badge-warning self-center md:hidden">To ship</span><span class="flex-1 md:hidden"></span>
        <button type="button" class="btn btn-sm"><span>Arrange shipment</span></button>
      </div>
    </li>
    <li class="relative grid gap-3 bg-surface p-3 md:grid-cols-[auto_4rem_minmax(0,1.5fr)_minmax(0,1fr)_auto_auto] md:items-center md:gap-4 md:px-4 has-[:checked]:bg-primary-soft">
      <label class="absolute right-2 top-2 grid size-11 place-items-center md:static"><input type="checkbox" class="size-5 accent-primary" data-ds-bulk-item><span class="sr-only">Select order #240311-0039</span></label>
      <div class="flex gap-3 md:contents">
        <div class="w-14 shrink-0 overflow-hidden rounded-tile md:w-16">
          <div class="grid w-full place-items-center overflow-hidden aspect-square bg-sale-soft text-sale" aria-hidden="true"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-package"/></svg></div>
        </div>
        <div class="grid min-w-0 gap-0.5 pr-10 md:pr-0">
          <p class="text-label"><a href="#" class="text-primary underline">#240311-0039</a></p>
          <p class="truncate text-body-sm text-muted-foreground">Ana Cruz · 4 items · GCash</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-2 md:contents">
        <p class="flex items-center gap-1 text-body-sm text-muted-foreground"><svg class="icon size-4" aria-hidden="true"><use href="#i-clock"/></svg>Picked up Oct 31</p>
        <p class="text-price text-foreground tabular md:text-right">₱2,150.50</p>
      </div>
      <div class="flex gap-2 md:justify-end"><span class="badge badge-info self-center md:hidden">Shipped</span><span class="flex-1 md:hidden"></span>
        <button type="button" class="btn btn-neutral btn-sm"><span>Track</span></button>
      </div>
    </li>
  </ul>
</div>
```

## 12. Test notes
- Row layout from 768px; card at 360px.
