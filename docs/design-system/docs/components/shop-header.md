# ShopHeader

Commerce · Phase 3 · Live sheet: `styleguide/components/shop-header.html`

## 1. Purpose
Top of the shop page: cover, avatar, name + badge, location/activity, Follow and Chat, stats.

**Use when**
- Shop page.

**Don't use when**
- Lists (ShopCard).

## 2. Anatomy
1. Cover band (`--surface-inverse` placeholder; brand image slot).
2. Avatar overlapping cover.
3. Name `h1` + Official badge.
4. Location · activity.
5. Follow (primary) + Chat (outline).
6. Stats `dl`: rating, followers, products, chat reply rate.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `shopHeader(s)` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Buttons. |
| Pressed | n/a: Buttons. |
| Focus-visible | n/a: Buttons. |
| Disabled | n/a: n/a |
| Loading | n/a: Follow button loading. |
| Error | n/a: n/a |
| Selected | rendered |
| Empty | n/a: n/a |
| Skeleton | n/a: Cover + avatar + 2 lines. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Edge-to-edge; buttons share width; stats 4 columns. |
| Tablet (md, 768px+) | Avatar + name + buttons in one row. |
| Desktop (lg, 1024px+) | Same, inside the container with rounded panel. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| shop | Shop | — |  |
| following | boolean | false | Follow → Following (`aria-pressed`). |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `section` labelled by the shop name `h1`. |
| Accessible name | — |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | Follow uses `aria-pressed`. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--brand-100`, `--brand-300`, `--dur`, `--ease-out`, `--fs-body-sm`, `--fs-caption`, `--fs-h2`, `--fs-h3`, `--fs-label`, `--gutter`, `--halal`, `--halal-soft`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--r-panel`, `--r-tile`, `--ring`, `--sale`, `--sale-soft`, `--success`, `--success-soft`, `--surface`, `--surface-inverse`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Chat reply rate as %.

## 10. Do / Don't
**Do**
- Keep Follow + Chat reachable without scrolling.

**Don't**
- Don’t put text on the cover image.

## 11. HTML usage
```html
<section class="overflow-hidden bg-surface md:rounded-panel md:border md:border-border" aria-labelledby="shop-name">
  <div class="pattern-geo h-20 bg-surface-inverse md:h-28" aria-hidden="true"></div>
  <div class="-mt-8 grid gap-3 px-gutter pb-4 md:-mt-10 md:flex md:items-end md:gap-5 md:px-6"><span class="rounded-tile border-4 border-surface bg-surface"><span class="relative inline-grid shrink-0 place-items-center font-bold rounded-tile size-20 text-h3 bg-sale-soft text-sale" aria-hidden="true"><span aria-hidden="true">BP</span></span></span>
    <div class="min-w-0 flex-1 md:pb-1">
      <h1 id="shop-name" class="flex flex-wrap items-center gap-2 text-h2">Barakah Pantry<span class="badge badge-solid"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-badge-check"/></svg>Official</span><span class="badge badge-halal"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-moon-star"/></svg>Halal-only shop</span></h1>
      <p class="mt-1 flex items-center gap-1 text-body-sm text-muted-foreground"><svg class="icon size-4" aria-hidden="true"><use href="#i-map-pin"/></svg>Cotabato City · <span class="text-success">Active 5 min ago</span></p>
    </div>
    <div class="flex gap-2 md:pb-1">
      <button type="button" class="btn flex-1 md:flex-none"><svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg><span>Follow</span></button>
      <button type="button" class="btn btn-outline flex-1 md:flex-none"><svg class="icon" aria-hidden="true"><use href="#i-message-circle"/></svg><span>Chat</span></button>
    </div>
  </div>
  <dl class="grid grid-cols-4 border-t border-border text-center">
    <div class="flex flex-col-reverse gap-0.5 px-1 py-3">
      <dt class="text-caption text-muted-foreground">Rating</dt>
      <dd class="text-label tabular">4.9 / 5</dd>
    </div>
    <div class="flex flex-col-reverse gap-0.5 px-1 py-3">
      <dt class="text-caption text-muted-foreground">Followers</dt>
      <dd class="text-label tabular">12.8k</dd>
    </div>
    <div class="flex flex-col-reverse gap-0.5 px-1 py-3">
      <dt class="text-caption text-muted-foreground">Products</dt>
      <dd class="text-label tabular">86</dd>
    </div>
    <div class="flex flex-col-reverse gap-0.5 px-1 py-3">
      <dt class="text-caption text-muted-foreground">Chat reply</dt>
      <dd class="text-label tabular">97%</dd>
    </div>
  </dl>
</section>
```

## 12. Test notes
- Stats fit at 360px.
