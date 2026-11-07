# OrderSummary / PriceBreakdown

Commerce · Phase 3 · Live sheet: `styleguide/components/order-summary.html`

## 1. Purpose
Itemised totals: subtotal, shipping, discounts, vouchers, total payment.

**Use when**
- Checkout, order detail.

**Don't use when**
- Cart footer (sticky bar shows total only).

## 2. Anatomy
1. Heading.
2. `dl` lines; discounts as “−₱80” in `--sale`.
3. Total row `text-price-lg` in `--sale`.
4. COD note (optional).

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `orderSummary()` |  |
| COD | `cod: true` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: n/a |
| Pressed | n/a: n/a |
| Focus-visible | n/a: n/a |
| Disabled | n/a: n/a |
| Loading | rendered |
| Error | n/a: Banner above if pricing failed. |
| Selected | n/a: n/a |
| Empty | n/a: n/a |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Full width above the sticky Place order bar. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Right column, sticky. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| lines | [label, amount][] | — | Negative = discount. |
| total | number | — |  |
| cod | boolean | false |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `section` + `dl`. |
| Accessible name | — |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | Minus sign is U+2212; ports add sr-only “discount”. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Total updates polite. |

## 8. Tokens used
`--border`, `--fs-body`, `--fs-h4`, `--fs-label`, `--fs-price-lg`, `--muted-foreground`, `--r-badge`, `--r-panel`, `--sale`, `--surface`, `--surface-muted`

## 9. Content rules
- Labels match the receipt.

## 10. Do / Don't
**Do**
- Show every voucher line.

**Don't**
- Don’t round totals.

## 11. HTML usage
```html
<section class="panel p-4" aria-labelledby="os-h">
  <h2 id="os-h" class="text-h4">Payment details</h2>
  <dl class="mt-3 grid gap-2 text-body">
    <div class="flex justify-between gap-3">
      <dt class="text-muted-foreground">Merchandise subtotal (3 items)</dt>
      <dd class="tabular ">₱1,587</dd>
    </div>
    <div class="flex justify-between gap-3">
      <dt class="text-muted-foreground">Shipping fee</dt>
      <dd class="tabular ">₱80</dd>
    </div>
    <div class="flex justify-between gap-3">
      <dt class="text-muted-foreground">Shipping discount</dt>
      <dd class="tabular text-sale">−₱80</dd>
    </div>
    <div class="flex justify-between gap-3">
      <dt class="text-muted-foreground">Shop voucher</dt>
      <dd class="tabular text-sale">−₱50</dd>
    </div>
    <div class="flex justify-between gap-3">
      <dt class="text-muted-foreground">Platform voucher</dt>
      <dd class="tabular text-sale">−₱99</dd>
    </div>
    <div class="mt-1 flex items-baseline justify-between gap-3 border-t border-border pt-3">
      <dt class="text-label">Total payment</dt>
      <dd class="text-price-lg text-sale tabular">₱1,438</dd>
    </div>
  </dl>
</section>
```

## 12. Test notes
- Total equals sum (ports: unit test).
