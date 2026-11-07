# DataTable

Data display · Phase 2 · Live sheet: `styleguide/components/data-table.html`

## 1. Purpose
Sortable, selectable table for seller/admin lists that becomes a card list on phone.

**Use when**
- Orders, products, users, payouts.

**Don't use when**
- Storefront.

## 2. Anatomy
1. md+: `table` with caption (sr-only), sticky-ish header, select-all checkbox, sort button header with `aria-sort`.
2. Phone: card list, first column as title, badge column top-right, others as `dl`.
3. Bulk bar via `data-ds-bulk` (Phase 4 BulkActionBar).

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Basic | default |  |
| Selectable | `selectable` |  |
| Sortable | `sort: key` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: n/a |
| Focus-visible | n/a: Cells contain focusable links/checkboxes. |
| Disabled | n/a: n/a |
| Loading | n/a: Skeleton rows. |
| Error | n/a: ErrorState in place of tbody. |
| Selected | rendered |
| Empty | rendered |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Card list (`md:hidden`): no horizontal scrolling. |
| Tablet (md, 768px+) | Table; wraps in `overflow-x-auto` if needed. |
| Desktop (lg, 1024px+) | Table. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| columns | {key,label,align,badge}[] | — |  |
| rows | object[] | — |  |
| selectable | boolean | false |  |
| sort | {key, dir} | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Native table with `caption`, `th scope=col`. |
| Accessible name | Caption. |
| Keyboard | Sort buttons and row links; checkboxes. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | `aria-sort` on sorted header; select-all indeterminate. |
| Touch target | Checkbox cells 44px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Selection count in the BulkActionBar live region. |

## 8. Tokens used
`--border`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-h4`, `--fs-th`, `--info`, `--info-soft`, `--muted-foreground`, `--primary`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-card`, `--r-panel`, `--success`, `--success-soft`, `--surface`, `--surface-muted`, `--surface-subtle`, `--touch-min`, `--warning`, `--warning-soft`, `currentColor (icons)`

## 9. Content rules
- Header labels ≤ 2 words.
- Money right-aligned, tabular.

## 10. Do / Don't
**Do**
- Keep the card fallback for every table.

**Don't**
- Don’t hide important columns on phone; move them into the card.

## 11. HTML usage
```html
<div data-ds-bulk>
  <div class="hidden overflow-x-auto rounded-panel border border-border bg-surface md:block">
    <table class="w-full text-body">
      <caption class="sr-only">Recent orders</caption>
      <thead class="border-b border-border bg-surface-subtle">
        <tr>
          <th scope="col" class="w-12 px-3">
            <label class="grid min-h-touch place-items-center"><input type="checkbox" class="size-5 accent-primary" data-ds-select-all><span class="sr-only">Select all</span></label>
          </th>
          <th scope="col" class="px-3 py-2 text-th uppercase text-muted-foreground text-left">Order</th>
          <th scope="col" class="px-3 py-2 text-th uppercase text-muted-foreground text-left">Status</th>
          <th scope="col" class="px-3 py-2 text-th uppercase text-muted-foreground text-right">Items</th>
          <th scope="col" class="px-3 py-2 text-th uppercase text-muted-foreground text-right">Total</th>
          <th scope="col" class="px-3 py-2 text-th uppercase text-muted-foreground text-left" aria-sort="descending">
            <button type="button" class="inline-flex min-h-touch items-center gap-1 uppercase hover:text-foreground">Date<svg class="icon size-3.5" aria-hidden="true"><use href="#i-arrow-down"/></svg></button>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        <tr class="hover:bg-surface-subtle has-[:checked]:bg-primary-soft">
          <td class="px-3">
            <label class="grid min-h-touch place-items-center"><input type="checkbox" class="size-5 accent-primary" data-ds-bulk-item><span class="sr-only">Select #240311-0042Maria Santos</span></label>
          </td>
          <td class="px-3 py-2.5 align-middle"><a href="#" class="font-bold text-primary underline">#240311-0042</a>
            <p class="text-body-sm text-muted-foreground">Maria Santos</p>
          </td>
          <td class="px-3 py-2.5 align-middle"><span class="badge badge-warning">To ship</span></td>
          <td class="px-3 py-2.5 align-middle text-right tabular">2</td>
          <td class="px-3 py-2.5 align-middle text-right tabular">₱1,438</td>
          <td class="px-3 py-2.5 align-middle">Nov 1</td>
        </tr>
        <tr class="hover:bg-surface-subtle has-[:checked]:bg-primary-soft">
          <td class="px-3">
            <label class="grid min-h-touch place-items-center"><input type="checkbox" class="size-5 accent-primary" data-ds-bulk-item><span class="sr-only">Select #240311-0041Jose Reyes</span></label>
          </td>
          <td class="px-3 py-2.5 align-middle"><a href="#" class="font-bold text-primary underline">#240311-0041</a>
            <p class="text-body-sm text-muted-foreground">Jose Reyes</p>
          </td>
          <td class="px-3 py-2.5 align-middle"><span class="badge badge-info">Shipped</span></td>
          <td class="px-3 py-2.5 align-middle text-right tabular">1</td>
          <td class="px-3 py-2.5 align-middle text-right tabular">₱499</td>
          <td class="px-3 py-2.5 align-middle">Oct 31</td>
        </tr>
        <tr class="hover:bg-surface-subtle has-[:checked]:bg-primary-soft">
          <td class="px-3">
            <label class="grid min-h-touch place-items-center"><input type="checkbox" class="size-5 accent-primary" data-ds-bulk-item><span class="sr-only">Select #240311-0039Ana Cruz</span></label>
          </td>
          <td class="px-3 py-2.5 align-middle"><a href="#" class="font-bold text-primary underline">#240311-0039</a>
            <p class="text-body-sm text-muted-foreground">Ana Cruz</p>
          </td>
          <td class="px-3 py-2.5 align-middle"><span class="badge badge-success">Completed</span></td>
          <td class="px-3 py-2.5 align-middle text-right tabular">4</td>
          <td class="px-3 py-2.5 align-middle text-right tabular">₱2,150.50</td>
          <td class="px-3 py-2.5 align-middle">Oct 30</td>
        </tr>
      </tbody>
    </table>
  </div>
  <ul class="grid gap-2 md:hidden" aria-label="Recent orders">
    <li class="card grid gap-2 p-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0"><a href="#" class="font-bold text-primary underline">#240311-0042</a>
          <p class="text-body-sm text-muted-foreground">Maria Santos</p>
        </div>
        <span class="badge badge-warning">To ship</span>
      </div>
      <dl class="grid grid-cols-2 gap-x-3 gap-y-1 text-body-sm">
        <div class="contents">
          <dt class="text-muted-foreground">Items</dt>
          <dd class="text-right text-foreground tabular">2</dd>
        </div>
        <div class="contents">
          <dt class="text-muted-foreground">Total</dt>
          <dd class="text-right text-foreground tabular">₱1,438</dd>
        </div>
        <div class="contents">
          <dt class="text-muted-foreground">Date</dt>
          <dd class="text-right text-foreground tabular">Nov 1</dd>
        </div>
      </dl>
    </li>
    <li class="card grid gap-2 p-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0"><a href="#" class="font-bold text-primary underline">#240311-0041</a>
          <p class="text-body-sm text-muted-foreground">Jose Reyes</p>
        </div>
        <span class="badge badge-info">Shipped</span>
      </div>
      <dl class="grid grid-cols-2 gap-x-3 gap-y-1 text-body-sm">
        <div class="contents">
          <dt class="text-muted-foreground">Items</dt>
          <dd class="text-right text-foreground tabular">1</dd>
        </div>
        <div class="contents">
          <dt class="text-muted-foreground">Total</dt>
          <dd class="text-right text-foreground tabular">₱499</dd>
        </div>
        <div class="contents">
          <dt class="text-muted-foreground">Date</dt>
          <dd class="text-right text-foreground tabular">Oct 31</dd>
        </div>
      </dl>
    </li>
    <li class="card grid gap-2 p-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0"><a href="#" class="font-bold text-primary underline">#240311-0039</a>
          <p class="text-body-sm text-muted-foreground">Ana Cruz</p>
        </div>
        <span class="badge badge-success">Completed</span>
      </div>
      <dl class="grid grid-cols-2 gap-x-3 gap-y-1 text-body-sm">
        <div class="contents">
          <dt class="text-muted-foreground">Items</dt>
          <dd class="text-right text-foreground tabular">4</dd>
        </div>
        <div class="contents">
          <dt class="text-muted-foreground">Total</dt>
          <dd class="text-right text-foreground tabular">₱2,150.50</dd>
        </div>
        <div class="contents">
          <dt class="text-muted-foreground">Date</dt>
          <dd class="text-right text-foreground tabular">Oct 30</dd>
        </div>
      </dl>
    </li>
  </ul>
</div>
```

## 12. Test notes
- Phone shows cards, not a scrolled table.
- Select-all toggles rows and indeterminate.
