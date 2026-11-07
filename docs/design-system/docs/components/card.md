# Card / Panel

Data display · Phase 2 · Live sheet: `styleguide/components/card.html`

## 1. Purpose
Surface containers. Card (`--r-card`, `--border`) groups one item; Panel (`--r-panel`) groups a section.

**Use when**
- Product, shop, order, stat items; settings sections.

**Don't use when**
- Wrapping every element (keep layouts flat).

## 2. Anatomy
1. Surface `bg-surface`, 1px `--border`.
2. Optional header (title + action).
3. Body.
4. Interactive cards: whole card is one link; hover elevation on pointer devices.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Card | `.card` |  |
| Interactive | `.card.card-interactive` | Hover shadow. |
| Panel | `.panel` | Sections. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | n/a: Skeleton. |
| Error | n/a: Banner inside. |
| Selected | rendered |
| Empty | n/a: EmptyState inside. |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Cards full-bleed in lists may drop side borders (`-mx-gutter rounded-none` on phone). |
| Tablet (md, 768px+) | Standard. |
| Desktop (lg, 1024px+) | Standard. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| as | `div` \| `a` \| `section` | div |  |
| interactive | boolean | false |  |
| selected | boolean | false |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `section` with heading when it is a region; `a` when the card is a link. |
| Accessible name | Heading. |
| Keyboard | One focus stop per interactive card. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--dur`, `--ease-out`, `--elevation-card-hover`, `--fs-body`, `--fs-h4`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-soft`, `--r-badge`, `--r-card`, `--r-panel`, `--ring`, `--surface`, `--surface-muted`, `--touch-min`

## 9. Content rules
- Header title ≤ 3 words.

## 10. Do / Don't
**Do**
- One primary link per card.

**Don't**
- Don’t nest interactive cards.

## 11. HTML usage
```html
<section class="panel" aria-labelledby="cp-h">
  <div class="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
    <h3 id="cp-h" class="text-h4">Shipping address</h3>
    <a href="#" class="inline-flex min-h-touch items-center text-label text-primary underline">Change</a>
  </div>
  <div class="p-4 text-body">
    <p class="font-bold">Maria Santos · +63 917 123 4567</p>
    <p class="text-muted-foreground">Unit 4B, 12 Maginhawa St., Teachers Village East, Quezon City, Metro Manila 1101</p>
  </div>
</section>
```

## 12. Test notes
- Hover elevation only with pointer.
