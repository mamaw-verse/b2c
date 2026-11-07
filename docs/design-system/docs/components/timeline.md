# Timeline / OrderTracker

Data display · Phase 2 · Live sheet: `styleguide/components/timeline.html`

## 1. Purpose
Chronological events with done / current / to-do states (order tracking, audit history).

**Use when**
- Order tracking, return/refund progress.

**Don't use when**
- Steps of a form (ProgressSteps).

## 2. Anatomy
1. Ordered list.
2. Node: done (check), current (truck, ring), to-do (hollow).
3. Connector line.
4. Title, detail, time.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Vertical | default |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: n/a |
| Pressed | n/a: n/a |
| Focus-visible | n/a: n/a |
| Disabled | n/a: n/a |
| Loading | n/a: Skeleton. |
| Error | rendered |
| Selected | rendered |
| Empty | rendered |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Vertical, full width. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same, in a side panel on order detail. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| events | {title, time, detail, state}[] | — | Newest last. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Ordered list. |
| Accessible name | — |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | `aria-current="step"` on current; sr-only “Completed:”/“Current:”. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border-control`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-soft`, `--r-badge`, `--surface`, `--surface-muted`, `currentColor (icons)`

## 9. Content rules
- Times in “Nov 1, 8:02 AM”.

## 10. Do / Don't
**Do**
- Show courier tracking number with a copy action.

**Don't**
- Don’t rely on node colour alone.

## 11. HTML usage
```html
<ol class="grid" aria-label="Order tracking">
  <li class="relative grid grid-cols-[1.5rem_1fr] gap-3 pb-5 last:pb-0"><span class="absolute bottom-0 left-[.6875rem] top-6 w-0.5 bg-primary" aria-hidden="true"></span><span class="relative z-10 mt-0.5 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-check"/></svg></span>
    <div class="grid gap-0.5">
      <p class="text-label text-foreground"><span class="sr-only">Completed: </span>Order placed</p>
      <p class="text-body-sm text-muted-foreground">Paid via GCash</p>
      <p class="text-body-sm text-muted-foreground tabular"><time>Oct 28, 9:14 AM</time></p>
    </div>
  </li>
  <li class="relative grid grid-cols-[1.5rem_1fr] gap-3 pb-5 last:pb-0"><span class="absolute bottom-0 left-[.6875rem] top-6 w-0.5 bg-primary" aria-hidden="true"></span><span class="relative z-10 mt-0.5 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-check"/></svg></span>
    <div class="grid gap-0.5">
      <p class="text-label text-foreground"><span class="sr-only">Completed: </span>Shipped</p>
      <p class="text-body-sm text-muted-foreground">Handed to courier, tracking SPX0042910</p>
      <p class="text-body-sm text-muted-foreground tabular"><time>Oct 29, 2:30 PM</time></p>
    </div>
  </li>
  <li class="relative grid grid-cols-[1.5rem_1fr] gap-3 pb-5 last:pb-0" aria-current="step"><span class="absolute bottom-0 left-[.6875rem] top-6 w-0.5 bg-primary" aria-hidden="true"></span><span class="relative z-10 mt-0.5 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground ring-4 ring-primary-soft"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-truck"/></svg></span>
    <div class="grid gap-0.5">
      <p class="text-label text-foreground"><span class="sr-only">Current: </span>Out for delivery</p>
      <p class="text-body-sm text-muted-foreground">Rider: Jun · Quezon City hub</p>
      <p class="text-body-sm text-muted-foreground tabular"><time>Nov 1, 8:02 AM</time></p>
    </div>
  </li>
  <li class="relative grid grid-cols-[1.5rem_1fr] gap-3 pb-5 last:pb-0"><span class="relative z-10 mt-0.5 grid size-6 place-items-center rounded-full border-2 border-border-control bg-surface"></span>
    <div class="grid gap-0.5">
      <p class="text-label text-muted-foreground">Delivered</p>
      <p class="text-body-sm text-muted-foreground">Estimated Nov 1</p>
    </div>
  </li>
</ol>
```

## 12. Test notes
- State is conveyed in text.
