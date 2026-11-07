# PriceBlock

Commerce · Phase 3 · Live sheet: `styleguide/components/price-block.html`

## 1. Purpose
Formats price in ₱ with tabular numerals: current, original (struck), discount %, ranges.

**Use when**
- Anywhere a price shows.

**Don't use when**
- Order totals (OrderSummary).

## 2. Anatomy
1. Current price (`text-price` / `text-price-lg`), `--sale` when discounted else `--foreground`.
2. Original price `` in `--subtle-foreground` (replaces the template’s failing old-price grey).
3. Discount badge `-NN%`.
4. sr-only labels “Sale price:” / “Original price:”.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| md | default | Cards. |
| lg | `size: lg` | Product detail, variation sheet. |
| sm | `size: sm` | Cart, chat. |
| Range | `max` | “₱349 – ₱599” for variations. |
| Unit | `unit` | “/ kg”. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: n/a |
| Pressed | n/a: n/a |
| Focus-visible | n/a: n/a |
| Disabled | n/a: Sold out: keep price, add “Sold out” badge. |
| Loading | n/a: Skeleton. |
| Error | n/a: n/a |
| Selected | rendered |
| Empty | n/a: Never render without a price. |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | lg 24px, md 17px. |
| Tablet (md, 768px+) | lg 26px. |
| Desktop (lg, 1024px+) | lg 28px. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| price | number | — |  |
| was | number | — |  |
| max | number | — | Range. |
| size | sm\|md\|lg | md |  |
| unit | string | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Text. |
| Accessible name | — |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Prices use `data-price` (tabular numerals) and `--sale` only when discounted; struck-through price has sr-only “Original price:”. |

## 8. Tokens used
`--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-price`, `--fs-price-lg`, `--muted-foreground`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--sale`, `--sale-soft`, `--surface-muted`

## 9. Content rules
- ₱ prefix, thousands comma, no decimals unless non-zero (₱2,150.50).
- Discount rounds to whole %.

## 10. Do / Don't
**Do**
- Format with `Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP"})`.

**Don't**
- Don’t use the old-price template grey (failed contrast).
- Don’t show “-0%”.

## 11. HTML usage
```html
<p class="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5"><span class="sr-only">Sale price:</span><span data-price class="text-price-lg text-sale">₱349</span><span class="sr-only">Original price:</span><s data-price class="text-body text-muted-foreground">₱599</s><span class="badge badge-sale">-42%</span></p>
```

## 12. Test notes
- Tabular numerals align in lists.
- Original price announced with its label.
