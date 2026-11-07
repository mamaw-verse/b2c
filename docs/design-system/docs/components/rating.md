# Rating

Data display · Phase 2 · Live sheet: `styleguide/components/rating.html`

## 1. Purpose
Read-only star rating with numeric value and count. Amber stars are decorative; the number uses `--foreground`.

**Use when**
- Product cards, product detail, shop header, reviews.

**Don't use when**
- Input (RatingInput).

## 2. Anatomy
1. Stars (`--rating` fill, empty `--border-strong`), half-star support.
2. Value “4.8” (foreground, bold, tabular).
3. Count “(1.2k)” muted.
4. Single `role=img` name.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Full | value + count |  |
| Compact | `size-3.5`, value only | Product cards. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: n/a |
| Pressed | n/a: n/a |
| Focus-visible | n/a: n/a |
| Disabled | n/a: n/a |
| Loading | n/a: Skeleton. |
| Error | n/a: n/a |
| Selected | n/a: n/a |
| Empty | rendered |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Compact on cards. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| value | 0–5 | — |  |
| count | number | — | Compact formatted. |
| size | class | `size-4` |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `img` with “Rated 4.8 out of 5, 1240 ratings”. |
| Accessible name | — |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | Inner parts `aria-hidden`. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border-strong`, `--foreground`, `--fs-body-sm`, `--muted-foreground`, `--r-badge`, `--rating`, `--surface-muted`, `currentColor (icons)`

## 9. Content rules
- One decimal; counts “1.2k”.

## 10. Do / Don't
**Do**
- Show the number, not just stars.

**Don't**
- Don’t colour the number amber (fails contrast).

## 11. HTML usage
```html
<span class="inline-flex items-center gap-1" role="img" aria-label="Rated 4.8 out of 5, 1240 ratings"><span class="inline-flex" aria-hidden="true"><svg class="icon size-4 text-rating fill-current stroke-0" aria-hidden="true"><use href="#i-star"/></svg><svg class="icon size-4 text-rating fill-current stroke-0" aria-hidden="true"><use href="#i-star"/></svg><svg class="icon size-4 text-rating fill-current stroke-0" aria-hidden="true"><use href="#i-star"/></svg><svg class="icon size-4 text-rating fill-current stroke-0" aria-hidden="true"><use href="#i-star"/></svg><span class="relative inline-flex"><svg class="icon size-4 text-border-strong fill-current stroke-0" aria-hidden="true"><use href="#i-star"/></svg><span class="absolute inset-0 w-1/2 overflow-hidden"><svg class="icon size-4 text-rating fill-current stroke-0" aria-hidden="true"><use href="#i-star"/></svg></span></span></span><span class="text-body-sm font-bold text-foreground tabular" aria-hidden="true">4.8</span><span class="text-body-sm text-muted-foreground" aria-hidden="true">(1.2k)</span></span>
```

## 12. Test notes
- Accessible name includes value and count.
