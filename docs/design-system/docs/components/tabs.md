# Tabs

Navigation · Phase 2 · Live sheet: `styleguide/components/tabs.html`

## 1. Purpose
Switch between views of the same object: order status tabs, shop page tabs, product details/reviews.

**Use when**
- 2–7 peer views.

**Don't use when**
- Filters that combine (chips).
- Steps.

## 2. Anatomy
1. `tablist` scrollable on phone (no scrollbar).
2. `tab` 44px, underline indicator `--primary`, optional count badge.
3. `tabpanel` per tab.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Scrollable | default | Order tabs (6). |
| Fill | `fill` | md+: equal widths (shop page). |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: Hide unavailable tabs instead. |
| Loading | n/a: Panel shows Skeleton. |
| Error | n/a: Panel shows ErrorState. |
| Selected | rendered |
| Empty | n/a: Panel shows EmptyState. |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Scrolls horizontally; selected tab scrolls into view. |
| Tablet (md, 768px+) | Same, or fill when ≤ 4 tabs. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| items | string[] | — |  |
| selected | number | 0 |  |
| counts | map | — |  |
| fill | boolean | false |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `tablist` / `tab` / `tabpanel`. |
| Accessible name | `aria-label` on tablist. |
| Keyboard | Left/Right/Home/End move and activate (roving tabindex). |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | `aria-selected`, `aria-controls`, `aria-labelledby`. |
| Touch target | 44px tabs. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-caption`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--surface-muted`, `--touch-min`

## 9. Content rules
- Short labels; counts as badges, not in text.

## 10. Do / Don't
**Do**
- Keep order tabs in the lifecycle order.

**Don't**
- Don’t wrap tabs to two lines.

## 11. HTML usage
```html
<div class="">
  <div role="tablist" aria-label="Orders" class="flex overflow-x-auto border-b border-border [scrollbar-width:none]">
    <button type="button" role="tab" id="tb1-tab-0" aria-controls="tb1-panel-0" aria-selected="true" tabindex="0" class="relative flex min-h-touch shrink-0 items-center gap-1.5 whitespace-nowrap px-4 text-label text-muted-foreground hover:text-foreground aria-selected:text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full aria-selected:after:bg-primary focus-inset">To Pay<span class="badge badge-neutral">1</span></button>
    <button type="button" role="tab" id="tb1-tab-1" aria-controls="tb1-panel-1" aria-selected="false" tabindex="-1" class="relative flex min-h-touch shrink-0 items-center gap-1.5 whitespace-nowrap px-4 text-label text-muted-foreground hover:text-foreground aria-selected:text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full aria-selected:after:bg-primary focus-inset">To Ship<span class="badge badge-neutral">2</span></button>
    <button type="button" role="tab" id="tb1-tab-2" aria-controls="tb1-panel-2" aria-selected="false" tabindex="-1" class="relative flex min-h-touch shrink-0 items-center gap-1.5 whitespace-nowrap px-4 text-label text-muted-foreground hover:text-foreground aria-selected:text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full aria-selected:after:bg-primary focus-inset">To Receive<span class="badge badge-neutral">1</span></button>
    <button type="button" role="tab" id="tb1-tab-3" aria-controls="tb1-panel-3" aria-selected="false" tabindex="-1" class="relative flex min-h-touch shrink-0 items-center gap-1.5 whitespace-nowrap px-4 text-label text-muted-foreground hover:text-foreground aria-selected:text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full aria-selected:after:bg-primary focus-inset">Completed</button>
    <button type="button" role="tab" id="tb1-tab-4" aria-controls="tb1-panel-4" aria-selected="false" tabindex="-1" class="relative flex min-h-touch shrink-0 items-center gap-1.5 whitespace-nowrap px-4 text-label text-muted-foreground hover:text-foreground aria-selected:text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full aria-selected:after:bg-primary focus-inset">Cancelled</button>
    <button type="button" role="tab" id="tb1-tab-5" aria-controls="tb1-panel-5" aria-selected="false" tabindex="-1" class="relative flex min-h-touch shrink-0 items-center gap-1.5 whitespace-nowrap px-4 text-label text-muted-foreground hover:text-foreground aria-selected:text-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full aria-selected:after:bg-primary focus-inset">Return/Refund</button>
  </div>
  <div role="tabpanel" id="tb1-panel-0" aria-labelledby="tb1-tab-0" tabindex="0" class="pt-4">
    <p class="text-body text-muted-foreground">To Pay orders appear here.</p>
  </div>
  <div role="tabpanel" id="tb1-panel-1" aria-labelledby="tb1-tab-1" tabindex="0" class="pt-4" hidden>
    <p class="text-body text-muted-foreground">To Ship orders appear here.</p>
  </div>
  <div role="tabpanel" id="tb1-panel-2" aria-labelledby="tb1-tab-2" tabindex="0" class="pt-4" hidden>
    <p class="text-body text-muted-foreground">To Receive orders appear here.</p>
  </div>
  <div role="tabpanel" id="tb1-panel-3" aria-labelledby="tb1-tab-3" tabindex="0" class="pt-4" hidden>
    <p class="text-body text-muted-foreground">Completed orders appear here.</p>
  </div>
  <div role="tabpanel" id="tb1-panel-4" aria-labelledby="tb1-tab-4" tabindex="0" class="pt-4" hidden>
    <p class="text-body text-muted-foreground">Cancelled orders appear here.</p>
  </div>
  <div role="tabpanel" id="tb1-panel-5" aria-labelledby="tb1-tab-5" tabindex="0" class="pt-4" hidden>
    <p class="text-body text-muted-foreground">Return/Refund orders appear here.</p>
  </div>
</div>
```

## 12. Test notes
- Keyboard pattern; no page overflow at 360px with 6 tabs.
