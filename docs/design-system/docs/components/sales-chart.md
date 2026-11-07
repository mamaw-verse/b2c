# SalesChart

Seller · Phase 4 · Live sheet: `styleguide/components/sales-chart.html`

## 1. Purpose
Simple accessible bar chart with a summary line and a data-table alternative.

**Use when**
- Seller dashboard; admin dashboard.

**Don't use when**
- Complex analytics.

## 2. Anatomy
1. Title + total summary (the key insight in text).
2. Period SegmentedControl.
3. SVG bars (token fills: `--primary` for max, `--brand-400` others; ≥ 3:1 against surface).
4. `desc` lists every value.
5. “View as table” disclosure.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Bars | `salesChart()` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Tooltips are not used; values are in the table. |
| Pressed | n/a: n/a |
| Focus-visible | n/a: Table disclosure. |
| Disabled | n/a: n/a |
| Loading | n/a: Skeleton. |
| Error | n/a: ErrorState. |
| Selected | n/a: Period selection. |
| Empty | rendered |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | 192px tall. |
| Tablet (md, 768px+) | 224px. |
| Desktop (lg, 1024px+) | 224px; may sit beside StatCards. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| data | [label, value][] | — |  |
| title | string | — |  |
| period | `7D` \| `30D` \| `90D` | `7D` |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | SVG `role=img` labelled by title + desc. |
| Accessible name | Title. |
| Keyboard | Table disclosure. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | Axis labels `aria-hidden` (values are in desc/table). |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--brand-400`, `--elevation-card-hover`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-h4`, `--fs-label`, `--fs-th`, `--muted-foreground`, `--primary`, `--r-badge`, `--r-button`, `--r-panel`, `--surface`, `--surface-muted`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Summary sentence first.

## 10. Do / Don't
**Do**
- Provide the table.

**Don't**
- Don’t encode meaning in colour alone.

## 11. HTML usage
```html
<section class="panel p-4" aria-labelledby="sc-t">
  <div class="flex flex-wrap items-center justify-between gap-2">
    <div>
      <h2 id="sc-t" class="text-h4">Sales, last 7 days</h2>
      <p class="text-body-sm text-muted-foreground">Total <span class="font-bold text-foreground tabular">₱56,150</span> · best day Sat</p>
    </div>
    <fieldset class="inline-flex focus-ring rounded-button bg-surface-muted p-1">
      <legend class="sr-only">Period</legend>
      <label class="relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-button px-3 text-label text-muted-foreground hover:text-foreground has-[:checked]:bg-surface has-[:checked]:text-foreground has-[:checked]:shadow-card-hover min-h-9 min-w-11 after:absolute after:-inset-y-1"><input type="radio" name="sc-p" class="sr-only" checked>7D</label>
      <label class="relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-button px-3 text-label text-muted-foreground hover:text-foreground has-[:checked]:bg-surface has-[:checked]:text-foreground has-[:checked]:shadow-card-hover min-h-9 min-w-11 after:absolute after:-inset-y-1"><input type="radio" name="sc-p" class="sr-only">30D</label>
      <label class="relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-button px-3 text-label text-muted-foreground hover:text-foreground has-[:checked]:bg-surface has-[:checked]:text-foreground has-[:checked]:shadow-card-hover min-h-9 min-w-11 after:absolute after:-inset-y-1"><input type="radio" name="sc-p" class="sr-only">90D</label>
    </fieldset>
  </div>
  <figure class="mt-4"><svg viewBox="0 0 100 52" class="h-48 w-full md:h-56" role="img" aria-labelledby="sc-t sc-d" preserveAspectRatio="none"><desc id="sc-d">Bar chart. Mon ₱5,200, Tue ₱6,100, Wed ₱4,300, Thu ₱7,900, Fri ₱9,400, Sat ₱12,800, Sun ₱10,450.</desc><line x1="0" x2="100" y1="48" y2="48" class="stroke-border" stroke-width=".3" vector-effect="non-scaling-stroke"/><line x1="0" x2="100" y1="26" y2="26" class="stroke-border" stroke-width=".3" vector-effect="non-scaling-stroke"/><line x1="0" x2="100" y1="4" y2="4" class="stroke-border" stroke-width=".3" vector-effect="non-scaling-stroke"/><rect x="2.8571428571428577" y="30.125" width="8.571428571428571" height="17.875" rx="1" class="fill-brand-400"/><rect x="17.142857142857146" y="27.03125" width="8.571428571428571" height="20.96875" rx="1" class="fill-brand-400"/><rect x="31.42857142857143" y="33.21875" width="8.571428571428571" height="14.78125" rx="1" class="fill-brand-400"/><rect x="45.71428571428572" y="20.84375" width="8.571428571428571" height="27.15625" rx="1" class="fill-brand-400"/><rect x="60" y="15.6875" width="8.571428571428571" height="32.3125" rx="1" class="fill-brand-400"/><rect x="74.28571428571429" y="4" width="8.571428571428571" height="44" rx="1" class="fill-primary"/><rect x="88.57142857142858" y="12.078125" width="8.571428571428571" height="35.921875" rx="1" class="fill-brand-400"/></svg><figcaption class="mt-1 grid text-center text-caption text-muted-foreground" style="grid-template-columns:repeat(7,minmax(0,1fr))" aria-hidden="true"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></figcaption></figure>
  <details class="mt-3">
    <summary class="inline-flex min-h-touch items-center gap-1 text-label text-primary"><svg class="icon size-4" aria-hidden="true"><use href="#i-list"/></svg>View as table</summary>
    <table class="mt-2 w-full text-body">
      <caption class="sr-only">Sales, last 7 days</caption>
      <thead>
        <tr>
          <th scope="col" class="py-1 text-left text-th uppercase text-muted-foreground">Day</th>
          <th scope="col" class="py-1 text-right text-th uppercase text-muted-foreground">Sales</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        <tr>
          <th scope="row" class="py-1.5 text-left font-normal">Mon</th>
          <td class="py-1.5 text-right tabular">₱5,200</td>
        </tr>
        <tr>
          <th scope="row" class="py-1.5 text-left font-normal">Tue</th>
          <td class="py-1.5 text-right tabular">₱6,100</td>
        </tr>
        <tr>
          <th scope="row" class="py-1.5 text-left font-normal">Wed</th>
          <td class="py-1.5 text-right tabular">₱4,300</td>
        </tr>
        <tr>
          <th scope="row" class="py-1.5 text-left font-normal">Thu</th>
          <td class="py-1.5 text-right tabular">₱7,900</td>
        </tr>
        <tr>
          <th scope="row" class="py-1.5 text-left font-normal">Fri</th>
          <td class="py-1.5 text-right tabular">₱9,400</td>
        </tr>
        <tr>
          <th scope="row" class="py-1.5 text-left font-normal">Sat</th>
          <td class="py-1.5 text-right tabular">₱12,800</td>
        </tr>
        <tr>
          <th scope="row" class="py-1.5 text-left font-normal">Sun</th>
          <td class="py-1.5 text-right tabular">₱10,450</td>
        </tr>
      </tbody>
    </table>
  </details>
</section>
```

## 12. Test notes
- Bar colour ≥ 3:1 vs surface in both brands.
