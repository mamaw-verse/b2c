# ShopCard

Commerce · Phase 3 · Live sheet: `styleguide/components/shop-card.html`

## 1. Purpose
Shop summary in search results and “Shops you follow”.

**Use when**
- Shop results, follows.

**Don't use when**
- Shop page header (ShopHeader).

## 2. Anatomy
1. Shop avatar (tile).
2. Name (stretched link) + Official badge.
3. Rating, followers, location.
4. “Visit” button (raised above the link).

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `shopCard(s)` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Card link. |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | n/a: Skeleton. |
| Error | n/a: n/a |
| Selected | n/a: n/a |
| Empty | n/a: n/a |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Full width. |
| Tablet (md, 768px+) | 2 columns. |
| Desktop (lg, 1024px+) | 2–3 columns. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| shop | {name, avatar, rating, followers, loc, verified} | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `article`; link on name. |
| Accessible name | — |
| Keyboard | Name link + Visit button. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--brand-100`, `--dur`, `--ease-out`, `--foreground`, `--fs-body-sm`, `--fs-caption`, `--fs-h4`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--r-card`, `--r-tile`, `--rating`, `--ring`, `--sale`, `--sale-soft`, `--success`, `--success-soft`, `--surface`, `--surface-muted`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Followers compact (12.8k).

## 10. Do / Don't
**Do**
- Show location.

**Don't**
- Don’t nest the Visit button inside the link.

## 11. HTML usage
```html
<article class="card relative flex items-center gap-3 p-3"><span class="relative inline-grid shrink-0 place-items-center font-bold rounded-tile size-14 text-h4 bg-sale-soft text-sale" aria-hidden="true"><span aria-hidden="true">BP</span></span>
  <div class="min-w-0 flex-1">
    <h3 class="flex flex-wrap items-center gap-1.5 text-h4"><a href="#" class="after:absolute after:inset-0">Barakah Pantry</a><span class="badge badge-solid px-1.5"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-badge-check"/></svg>Official</span></h3>
    <p class="mt-0.5 flex flex-wrap gap-x-3 text-body-sm text-muted-foreground"><span class="inline-flex items-center gap-1"><svg class="icon size-3.5 fill-current stroke-0 text-rating" aria-hidden="true"><use href="#i-star"/></svg><span class="font-bold text-foreground">4.9</span></span><span>12.8k followers</span><span class="inline-flex items-center gap-1"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-map-pin"/></svg>Cotabato City</span></p>
  </div>
  <button type="button" class="btn btn-outline btn-sm relative z-10" tabindex="-1" aria-hidden="true"><span>Visit</span></button>
</article>
```

## 12. Test notes
- Visit button clickable above stretched link.
