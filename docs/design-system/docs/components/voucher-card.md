# VoucherCard

Commerce · Phase 3 · Live sheet: `styleguide/components/voucher-card.html`

## 1. Purpose
Ticket-style voucher: issuer stub, value, condition, expiry, Claim/Use/Applied.

**Use when**
- Shop page, voucher wallet, checkout picker.

**Don't use when**
- Banners.

## 2. Anatomy
1. Stub (shop: primary, platform: sale, shipping: success) with icon + issuer.
2. Dashed perforation.
3. Title, min. spend, expiry.
4. Action: Claim / Use / Applied badge / radio in picker.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Shop | `kind: shop` |  |
| Platform | `kind: platform` | Issuer `{{BRAND_NAME}}`. |
| Shipping | `kind: shipping` |  |
| Selectable | `select` | VoucherPicker. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: Button. |
| Focus-visible | rendered |
| Disabled | rendered |
| Loading | rendered |
| Error | n/a: Toast “Couldn’t claim. Try again.” |
| Selected | rendered |
| Empty | n/a: EmptyState “No vouchers yet”. |
| Skeleton | n/a: Card skeleton. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Full width. |
| Tablet (md, 768px+) | 2 columns. |
| Desktop (lg, 1024px+) | 2–3 columns. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| kind | shop\|platform\|shipping | shop |  |
| title / min / expiry | string | — |  |
| state | available\|claimed\|applied\|unavailable | available |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Group of text + button (or label + radio in picker). |
| Accessible name | Button “Claim”; ports add `aria-describedby` to the title. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | Unavailable reason in text, not only opacity. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--border-outline`, `--brand-100`, `--danger`, `--dur`, `--ease-out`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--fs-body-sm`, `--fs-caption`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--r-card`, `--sale`, `--success`, `--success-soft`, `--surface`, `--surface-muted`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Value first: “₱50 off”, “15% off, up to ₱300”.
- Condition: “Min. spend ₱500”.

## 10. Do / Don't
**Do**
- Explain why it’s unavailable.

**Don't**
- Don’t use colour alone for the issuer (stub has text).

## 11. HTML usage
```html
<div class="flex overflow-hidden rounded-card border bg-surface border-border-outline">
  <div class="flex w-20 shrink-0 flex-col items-center justify-center gap-1 bg-primary text-primary-foreground p-2 text-center text-caption font-bold"><svg class="icon" aria-hidden="true"><use href="#i-store"/></svg><span class="line-clamp-2 break-words">Shop</span></div>
  <div class="relative grid min-w-0 flex-1 content-center gap-0.5 border-l-2 border-dashed border-border py-2 pl-3 pr-2">
    <p class="text-label">₱50 off</p>
    <p class="text-body-sm text-muted-foreground">Min. spend ₱500</p>
    <p class="flex items-center gap-1 text-caption text-muted-foreground"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-clock"/></svg>Valid till Nov 30</p>
  </div>
  <div class="flex shrink-0 items-center pr-3">
    <button type="button" class="btn btn-sm"><span>Claim</span></button>
  </div>
</div>
```

## 12. Test notes
- Stub text contrast (white on primary/sale/success) in report.
