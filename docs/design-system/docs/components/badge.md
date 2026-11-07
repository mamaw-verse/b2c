# Badge / Chip / Tag

Data display · Phase 2 · Live sheet: `styleguide/components/badge.html`

## 1. Purpose
Badge: non-interactive status or label. Chip: toggleable filter (`aria-pressed`). Tag: removable value.

**Use when**
- Badge: order status, discount, “Preferred”.
- Chip: quick filters above results.
- Tag: applied filters, product keywords.

**Don't use when**
- Moderation states (StatusPill, Phase 4).
- Actions (Button).

## 2. Anatomy
1. Badge: `.badge` `--r-badge`, 12px bold, tone bg/fg pair.
2. Chip: 36px pill (44px hit area), check icon when pressed.
3. Tag: text + 36px remove button with “Remove X” name.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Badge tones | `.badge-{neutral,sale,sale-solid,success,warning,danger,info,solid}` | All fg/bg pairs ≥ 4.5:1. |
| Chip | `chip(label,{pressed})` | Filters. |
| Tag | `tag(label)` | Removable. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | rendered |
| Focus-visible | rendered |
| Disabled | rendered |
| Loading | n/a: n/a |
| Error | n/a: n/a |
| Selected | rendered |
| Empty | n/a: Hide the badge. |
| Skeleton | n/a: Pill skeleton `h-6 w-16 rounded-full`. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Chip rows scroll horizontally (`overflow-x-auto`). |
| Tablet (md, 768px+) | Wrap. |
| Desktop (lg, 1024px+) | Wrap. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| tone | see variants | default |  |
| icon | name | — |  |
| pressed | boolean | false | Chip. |
| onRemove | fn | — | Tag. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Badge: text. Chip: `button` + `aria-pressed`. Tag: text + remove `button`. |
| Accessible name | Visible text; tag remove “Remove Cebu”. |
| Keyboard | Chip/Tag remove: Enter/Space. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | Chips 36px visual with 44px hit area; tag remove 36px + hit area. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Pressed state via `aria-pressed`. |

## 8. Tokens used
`--border`, `--border-control`, `--border-strong`, `--danger`, `--danger-soft`, `--dur`, `--ease-out`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--fs-body-sm`, `--fs-caption`, `--fs-label`, `--info`, `--info-soft`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--sale`, `--sale-soft`, `--success`, `--success-soft`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--warning`, `--warning-soft`, `currentColor (icons)`

## 9. Content rules
- Badges ≤ 2 words; status in sentence case.
- Discount as “-25%”.

## 10. Do / Don't
**Do**
- Pair colour with text.

**Don't**
- Don’t use badges as buttons.

## 11. HTML usage
```html
<div class="flex flex-wrap items-center gap-2"><span class="badge badge-warning">To ship</span><span class="badge badge-sale-solid">-25%</span><span class="badge badge-solid"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-badge-check"/></svg>Preferred</span><span class="badge badge-success">Delivered</span></div>
```

## 12. Test notes
- Every tone pair in contrast report.
- Chip hit area ≥ 44px.
