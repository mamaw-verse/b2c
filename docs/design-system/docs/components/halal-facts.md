# HalalFacts

Halal · Phase 6 · Live sheet: `styleguide/components/halal-facts.html`

## 1. Purpose
Three scannable facts above the fold on product detail: status, certifier, valid-to. Plus “Ships frozen” for cold-chain items. Links down to the full certificate card.

**Use when**
- Directly under title and rating on product detail.

**Don't use when**
- Lists, cards or the cart (use HalalBadge).

## 2. Anatomy
1. Status badge.
2. Certifier name.
3. Valid-to month and year.
4. Optional cold-chain note.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `halalFacts()` |  |
| Frozen | `frozen` | Adds “Ships frozen”. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: n/a |
| Pressed | n/a: n/a |
| Focus-visible | n/a: n/a |
| Disabled | n/a: n/a |
| Loading | n/a: n/a |
| Error | n/a: n/a |
| Selected | n/a: n/a |
| Empty | n/a: Non-food: not rendered. |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Wraps to two lines. |
| Tablet (md, 768px+) | One line. |
| Desktop (lg, 1024px+) | One line. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| body | string | — | Certifier acronym. |
| valid | string | — | Month and year. |
| frozen | boolean | false |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `ul` labelled “Halal summary”. |
| Accessible name | Label on the list. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-label`, `--halal`, `--halal-soft`, `--info`, `--info-soft`, `--muted-foreground`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-panel`, `currentColor (icons)`

## 9. Content rules
- Keep the certifier acronym; spell it out in the certificate card.

## 10. Do / Don't
**Do**
- Place above the price block on phone so the claim is read before the CTA.

**Don't**
- Don’t repeat it in the description.

## 11. HTML usage
```html
<ul class="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm" aria-label="Halal summary">
  <li><span class="badge badge-halal"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-moon-star"/></svg>Halal certified</span></li>
  <li class="text-muted-foreground">Certified by <span class="font-bold text-foreground">IDCP</span></li>
  <li class="text-muted-foreground">Valid to <span class="font-bold text-foreground tabular">Mar 2028</span></li>
</ul>
```

## 12. Test notes
- Wraps without clipping at 360px.
