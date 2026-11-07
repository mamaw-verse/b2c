# Avatar

Data display · Phase 2 · Live sheet: `styleguide/components/avatar.html`

## 1. Purpose
User or shop identity with initials fallback and optional presence dot.

**Use when**
- Chat list, reviews, shop header, admin queue.

**Don't use when**
- Product images (media).

## 2. Anatomy
1. Circle (user) or tile (shop).
2. Initials (2 letters) on a tone derived from the name.
3. Presence dot with sr-only status.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| sm 32 | `size: sm` | Lists. |
| md 40 | default | Chat. |
| lg 56 | `size: lg` | Shop card. |
| xl 80 | `size: xl` | Shop header. |
| Shop | `shape: tile` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Wrap in a link if interactive. |
| Pressed | n/a: n/a |
| Focus-visible | n/a: Link wrapper. |
| Disabled | n/a: n/a |
| Loading | n/a: Skeleton. |
| Error | n/a: Initials fallback when the image fails. |
| Selected | rendered |
| Empty | rendered |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Same sizes at all tiers. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| name | string | — | Initials + accessible name. |
| src | url | — | Falls back to initials. |
| size | sm\|md\|lg\|xl | md |  |
| status | `online` \| `offline` | — |  |
| shape | `circle` \| `tile` | circle |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `img` with name, or `aria-hidden` when the name is adjacent text. |
| Accessible name | Person/shop name. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | Presence in sr-only text. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--fs-caption`, `--fs-h3`, `--fs-h4`, `--fs-label`, `--r-badge`, `--r-tile`, `--sale`, `--sale-soft`, `--success`, `--success-soft`, `--surface`, `--surface-muted`, `--warning`, `--warning-soft`

## 9. Content rules
- Initials from first and last word.

## 10. Do / Don't
**Do**
- Hide from AT when the name is printed next to it.

**Don't**
- Don’t rely on dot colour alone.

## 11. HTML usage
```html
<div class="flex flex-wrap items-center gap-2"><span class="relative inline-grid shrink-0 place-items-center font-bold rounded-full size-8 text-caption bg-success-soft text-success" role="img" aria-label="Maria Santos"><span aria-hidden="true">MS</span></span><span class="relative inline-grid shrink-0 place-items-center font-bold rounded-full size-10 text-label bg-warning-soft text-warning" role="img" aria-label="Jose Reyes"><span aria-hidden="true">JR</span><span class="absolute bottom-0 right-0 size-3 rounded-full border-2 border-surface bg-success"></span><span class="sr-only">, online</span></span><span class="relative inline-grid shrink-0 place-items-center font-bold rounded-tile size-14 text-h4 bg-sale-soft text-sale" role="img" aria-label="Barakah Pantry"><span aria-hidden="true">BP</span></span><span class="relative inline-grid shrink-0 place-items-center font-bold rounded-full size-20 text-h3 bg-success-soft text-success" role="img" aria-label="Ana Cruz"><span aria-hidden="true">AC</span></span></div>
```

## 12. Test notes
- Initial tones pass contrast (tone pairs are soft/fg).
