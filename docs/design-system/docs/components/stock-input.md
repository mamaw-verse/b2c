# StockInput

Seller · Phase 4 · Live sheet: `styleguide/components/stock-input.html`

## 1. Purpose
Numeric stock field with unit and low-stock hint.

**Use when**
- Product form, quick edit.

**Don't use when**
- Buyer quantity (QuantityStepper).

## 2. Anatomy
1. TextField `inputmode=numeric`, “units” suffix.
2. Help: low-stock warning in `--warning` when below threshold.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `stockInput()` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Field. |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | rendered |
| Loading | n/a: n/a |
| Error | rendered |
| Selected | rendered |
| Empty | n/a: Required. |
| Skeleton | n/a: Field skeleton. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Full width. |
| Tablet (md, 768px+) | Quarter width in grids. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| value | number | — |  |
| lowThreshold | number | 10 |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Text input (numeric keypad). |
| Accessible name | — |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border-control`, `--danger`, `--dur`, `--ease-out`, `--focus-ring-color`, `--focus-ring-error`, `--focus-ring-offset`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-input`, `--fs-label`, `--muted-foreground`, `--r-field`, `--subtle-foreground`, `--surface`, `--surface-muted`, `--touch-min`, `--warning`, `currentColor (icons)`

## 9. Content rules
- “Low stock” wording.

## 10. Do / Don't
**Do**
- Validate integers ≥ 0.

**Don't**
- Don’t use type=number spinners.

## 11. HTML usage
```html
<div class="grid gap-1.5">
  <div class="flex items-baseline justify-between gap-2">
    <label for="si1" class="text-label text-foreground">Stock<span class="text-danger" aria-hidden="true"> *</span></label>
  </div>
  <div class="relative"><input id="si1" type="text" class="field pr-12 tabular" value="6" inputmode="numeric" aria-describedby="si1-help si1-error"><span class="absolute inset-y-0 right-0 flex items-center"><span class="pr-3 text-body text-muted-foreground">units</span></span></div>
  <div class="flex gap-2">
    <p id="si1-help" class="text-body-sm font-bold text-warning">Low stock: you’ll be reminded below 10.</p>
  </div>
  <p id="si1-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
</div>
```

## 12. Test notes
- 16px on phone.
