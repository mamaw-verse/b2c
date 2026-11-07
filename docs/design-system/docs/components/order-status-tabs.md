# OrderStatusTabs

Commerce · Phase 3 · Live sheet: `styleguide/components/order-status-tabs.html`

## 1. Purpose
Tabs for To Pay / To Ship / To Receive / Completed / Cancelled / Return-Refund with counts.

**Use when**
- My Purchases.

**Don't use when**
- Seller order filters (QueueFilterBar style).

## 2. Anatomy
1. Tabs component, scrollable on phone, count badges.
2. Panel lists OrderCards or EmptyState.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `tabs({items: orderTabs, counts})` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: See Tabs. |
| Pressed | n/a: n/a |
| Focus-visible | n/a: See Tabs. |
| Disabled | n/a: n/a |
| Loading | n/a: OrderCard skeletons in panel. |
| Error | n/a: ErrorState in panel. |
| Selected | rendered |
| Empty | rendered |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Scroll; selected scrolls into view. |
| Tablet (md, 768px+) | All visible. |
| Desktop (lg, 1024px+) | All visible, inside account shell. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| counts | map | — |  |
| selected | status | To Pay | Deep-linkable via URL. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Tabs. |
| Accessible name | — |
| Keyboard | Arrows. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--brand-700`, `--dur`, `--ease-out`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-label`, `--fs-price`, `--gutter`, `--info`, `--info-soft`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--r-panel`, `--r-tile`, `--sale`, `--success`, `--surface`, `--surface-muted`, `--surface-subtle`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Fixed order (lifecycle).

## 10. Do / Don't
**Do**
- Deep link each tab.

**Don't**
- Don’t hide empty tabs.

## 11. HTML usage
```html
<div class="">
  <div role="tablist" aria-label="My purchases" class="flex overflow-x-auto border-b border-border [scrollbar-width:none]">
    <button type="button" role="tab" id="ost-tab-0" aria-controls="ost-panel-0" aria-selected="false" tabindex="-1" class="relative flex min-h-touch shrink-0 items-center gap-1.5 whitespace-nowrap px-4 text-label text-muted-foreground hover:text-foreground aria-selected:text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full aria-selected:after:bg-primary focus-inset">To Pay<span class="badge badge-neutral">1</span></button>
    <button type="button" role="tab" id="ost-tab-1" aria-controls="ost-panel-1" aria-selected="false" tabindex="-1" class="relative flex min-h-touch shrink-0 items-center gap-1.5 whitespace-nowrap px-4 text-label text-muted-foreground hover:text-foreground aria-selected:text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full aria-selected:after:bg-primary focus-inset">To Ship<span class="badge badge-neutral">2</span></button>
    <button type="button" role="tab" id="ost-tab-2" aria-controls="ost-panel-2" aria-selected="true" tabindex="0" class="relative flex min-h-touch shrink-0 items-center gap-1.5 whitespace-nowrap px-4 text-label text-muted-foreground hover:text-foreground aria-selected:text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full aria-selected:after:bg-primary focus-inset">To Receive<span class="badge badge-neutral">1</span></button>
    <button type="button" role="tab" id="ost-tab-3" aria-controls="ost-panel-3" aria-selected="false" tabindex="-1" class="relative flex min-h-touch shrink-0 items-center gap-1.5 whitespace-nowrap px-4 text-label text-muted-foreground hover:text-foreground aria-selected:text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full aria-selected:after:bg-primary focus-inset">Completed</button>
    <button type="button" role="tab" id="ost-tab-4" aria-controls="ost-panel-4" aria-selected="false" tabindex="-1" class="relative flex min-h-touch shrink-0 items-center gap-1.5 whitespace-nowrap px-4 text-label text-muted-foreground hover:text-foreground aria-selected:text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full aria-selected:after:bg-primary focus-inset">Cancelled</button>
    <button type="button" role="tab" id="ost-tab-5" aria-controls="ost-panel-5" aria-selected="false" tabindex="-1" class="relative flex min-h-touch shrink-0 items-center gap-1.5 whitespace-nowrap px-4 text-label text-muted-foreground hover:text-foreground aria-selected:text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full aria-selected:after:bg-primary focus-inset">Return/Refund</button>
  </div>
  <div role="tabpanel" id="ost-panel-0" aria-labelledby="ost-tab-0" tabindex="0" class="pt-4" hidden>
    <p class="py-6 text-center text-body text-muted-foreground">No orders to pay</p>
  </div>
  <div role="tabpanel" id="ost-panel-1" aria-labelledby="ost-tab-1" tabindex="0" class="pt-4" hidden>
    <p class="py-6 text-center text-body text-muted-foreground">No orders to ship</p>
  </div>
  <div role="tabpanel" id="ost-panel-2" aria-labelledby="ost-tab-2" tabindex="0" class="pt-4">
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
            <p class="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5"><span data-price class="text-body font-bold text-foreground">₱649</span></p>
          </div>
        </li>
      </ul>
      <div class="flex items-baseline justify-end gap-2 border-t border-border px-gutter py-2 text-body md:px-4"><span class="text-muted-foreground">Order total:</span><span class="text-price text-sale tabular">₱1,438</span></div>
      <div class="flex flex-wrap justify-end gap-2 border-t border-border px-gutter py-2 md:px-4">
        <button type="button" class="btn btn-neutral btn-sm"><span>Contact seller</span></button>
        <button type="button" class="btn btn-sm"><span>Order received</span></button>
      </div>
    </article>
  </div>
  <div role="tabpanel" id="ost-panel-3" aria-labelledby="ost-tab-3" tabindex="0" class="pt-4" hidden>
    <p class="py-6 text-center text-body text-muted-foreground">No orders completed</p>
  </div>
  <div role="tabpanel" id="ost-panel-4" aria-labelledby="ost-tab-4" tabindex="0" class="pt-4" hidden>
    <p class="py-6 text-center text-body text-muted-foreground">No orders cancelled</p>
  </div>
  <div role="tabpanel" id="ost-panel-5" aria-labelledby="ost-tab-5" tabindex="0" class="pt-4" hidden>
    <p class="py-6 text-center text-body text-muted-foreground">No orders with returns</p>
  </div>
</div>
```

## 12. Test notes
- No page overflow at 360px.
