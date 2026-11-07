# SoldCount

Commerce · Phase 3 · Live sheet: `styleguide/components/sold-count.html`

## 1. Purpose
Social proof “N sold” in compact notation.

**Use when**
- Cards, product detail, shop products.

**Don't use when**
- Exact stock (use “Only 3 left”).

## 2. Anatomy
1. Compact number + “sold”, tabular.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `soldCount(n)` |  |

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
| Empty | rendered |
| Skeleton | n/a: Part of card skeleton. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Same everywhere. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| count | number | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Text. |
| Accessible name | Reads “1.2k sold”; ports may add full number in `title`/sr-only. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--fs-body-sm`, `--muted-foreground`

## 9. Content rules
- `860 sold`, `1.2k sold`, `25.3k sold`, `1.2m sold` (lowercase suffix).
- Filipino: “1.2k nabenta” via translation key with `{count}`.

## 10. Do / Don't
**Do**
- Use `Intl.NumberFormat("en",{notation:"compact"})` lowercased.

**Don't**
- Don’t show “0 sold”.

## 11. HTML usage
```html
<p class="flex gap-4 text-body-sm text-muted-foreground"><span class="tabular">860 sold</span><span class="tabular">1.2k sold</span><span class="tabular">25.3k sold</span><span class="tabular">1.2m sold</span></p>
```

## 12. Test notes
- 1,000 → “1k”, 1,240 → “1.2k”.
