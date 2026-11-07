# StatCard

Data display · Phase 2 · Live sheet: `styleguide/components/stat-card.html`

## 1. Purpose
One metric with label, value and change (seller/admin dashboards).

**Use when**
- Dashboards.

**Don't use when**
- Long tables of metrics.

## 2. Anatomy
1. Label + icon.
2. Value (`text-h2`, tabular).
3. Delta with trend icon, sr-only “increase/decrease”, comparison period.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Up | `up: true` |  |
| Down | `up: false` |  |
| No delta | — |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: n/a |
| Pressed | n/a: n/a |
| Focus-visible | n/a: Wrap in a link to drill down. |
| Disabled | n/a: n/a |
| Loading | n/a: Skeleton. |
| Error | n/a: Show “—” and a retry link. |
| Selected | n/a: n/a |
| Empty | rendered |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | 2 columns. |
| Tablet (md, 768px+) | 2–4 columns. |
| Desktop (lg, 1024px+) | 4 columns. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| label / value | string | — |  |
| delta | string | — |  |
| up | boolean | true |  |
| icon | name | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Text. |
| Accessible name | — |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | Trend direction as sr-only text, not colour alone. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--danger`, `--fs-body-sm`, `--fs-h2`, `--muted-foreground`, `--r-badge`, `--r-card`, `--success`, `--surface`, `--surface-muted`, `currentColor (icons)`

## 9. Content rules
- Value formatted: ₱48,250; 3.4k.

## 10. Do / Don't
**Do**
- Name the comparison period.

**Don't**
- Don’t use colour alone for trend.

## 11. HTML usage
```html
<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
  <div class="card grid gap-1 p-4">
    <p class="flex items-center gap-2 text-body-sm text-muted-foreground"><svg class="icon size-4" aria-hidden="true"><use href="#i-wallet"/></svg>Sales</p>
    <p class="text-h2 tabular">₱48,250</p>
    <p class="flex items-center gap-1 text-body-sm font-bold text-success"><svg class="icon size-4" aria-hidden="true"><use href="#i-trending-up"/></svg><span>12%</span><span class="sr-only">increase</span><span class="font-normal text-muted-foreground">vs last 7 days</span></p>
  </div>
  <div class="card grid gap-1 p-4">
    <p class="flex items-center gap-2 text-body-sm text-muted-foreground"><svg class="icon size-4" aria-hidden="true"><use href="#i-package"/></svg>Orders</p>
    <p class="text-h2 tabular">128</p>
    <p class="flex items-center gap-1 text-body-sm font-bold text-success"><svg class="icon size-4" aria-hidden="true"><use href="#i-trending-up"/></svg><span>4%</span><span class="sr-only">increase</span><span class="font-normal text-muted-foreground">vs last 7 days</span></p>
  </div>
  <div class="card grid gap-1 p-4">
    <p class="flex items-center gap-2 text-body-sm text-muted-foreground"><svg class="icon size-4" aria-hidden="true"><use href="#i-eye"/></svg>Visitors</p>
    <p class="text-h2 tabular">3.4k</p>
    <p class="flex items-center gap-1 text-body-sm font-bold text-danger"><svg class="icon size-4" aria-hidden="true"><use href="#i-trending-down"/></svg><span>8%</span><span class="sr-only">decrease</span><span class="font-normal text-muted-foreground">vs last 7 days</span></p>
  </div>
  <div class="card grid gap-1 p-4">
    <p class="flex items-center gap-2 text-body-sm text-muted-foreground"><svg class="icon size-4" aria-hidden="true"><use href="#i-star"/></svg>Rating</p>
    <p class="text-h2 tabular">4.8</p>
  </div>
</div>
```

## 12. Test notes
- Values use tabular numerals.
