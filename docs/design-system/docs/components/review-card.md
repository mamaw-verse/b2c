# ReviewCard

Commerce · Phase 3 · Live sheet: `styleguide/components/review-card.html`

## 1. Purpose
Buyer review with stars, variation, text, photos, helpful, report and seller response.

**Use when**
- Product reviews, shop reviews.

**Don't use when**
- Moderation preview (ContentPreview, Phase 4).

## 2. Anatomy
1. Avatar + name (or masked) + stars.
2. Variation.
3. Text.
4. Photo buttons (open viewer).
5. Date, Helpful toggle (`aria-pressed`), Report.
6. Seller response block.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `reviewCard()` |  |
| Anonymous | `anonymous` |  |
| With reply | `reply` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Buttons. |
| Pressed | n/a: Helpful toggles. |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | n/a: n/a |
| Error | n/a: n/a |
| Selected | rendered |
| Empty | rendered |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Full width list. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same; photos 80px. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| review | Review | — |  |
| onHelpful / onReport | fn | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `article`. |
| Accessible name | Photos “Open photo 1 of 3”. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | Helpful `aria-pressed`. |
| Touch target | Photos 80px; buttons 44px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--brand-100`, `--dur`, `--ease-out`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-label`, `--info`, `--info-soft`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--r-badge`, `--r-button`, `--r-tile`, `--rating`, `--sale`, `--sale-soft`, `--success`, `--success-soft`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--warning`, `--warning-soft`, `currentColor (icons)`

## 9. Content rules
- Mask anonymous names.

## 10. Do / Don't
**Do**
- Show variation.

**Don't**
- Don’t truncate review text without “See more”.

## 11. HTML usage
```html
<article class="grid gap-2 border-b border-border py-4 last:border-0">
  <div class="flex items-center gap-3"><span class="relative inline-grid shrink-0 place-items-center font-bold rounded-full size-8 text-caption bg-success-soft text-success" aria-hidden="true"><span aria-hidden="true">AC</span></span>
    <div class="grid gap-0.5">
      <p class="text-label">Ana Cruz</p>
      <span class="inline-flex items-center gap-1" role="img" aria-label="Rated 5 out of 5"><span class="inline-flex" aria-hidden="true"><svg class="icon size-3.5 text-rating fill-current stroke-0" aria-hidden="true"><use href="#i-star"/></svg><svg class="icon size-3.5 text-rating fill-current stroke-0" aria-hidden="true"><use href="#i-star"/></svg><svg class="icon size-3.5 text-rating fill-current stroke-0" aria-hidden="true"><use href="#i-star"/></svg><svg class="icon size-3.5 text-rating fill-current stroke-0" aria-hidden="true"><use href="#i-star"/></svg><svg class="icon size-3.5 text-rating fill-current stroke-0" aria-hidden="true"><use href="#i-star"/></svg></span></span>
    </div>
  </div>
  <p class="text-body-sm text-muted-foreground">Variation: Premium, 500g</p>
  <p class="text-body">Malamig pa rin yung tubig after 12 hours. Packaging was secure and delivery was fast. Will buy another for my sister.</p>
  <ul class="flex gap-2" aria-label="Review photos">
    <li>
      <button type="button" class="block size-20 overflow-hidden rounded-tile" aria-label="Open photo 1 of 3">
        <div class="grid w-full place-items-center overflow-hidden aspect-square bg-info-soft text-info" aria-hidden="true"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-image"/></svg></div>
      </button>
    </li>
    <li>
      <button type="button" class="block size-20 overflow-hidden rounded-tile" aria-label="Open photo 2 of 3">
        <div class="grid w-full place-items-center overflow-hidden aspect-square bg-sale-soft text-sale" aria-hidden="true"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-image"/></svg></div>
      </button>
    </li>
    <li>
      <button type="button" class="block size-20 overflow-hidden rounded-tile" aria-label="Open photo 3 of 3">
        <div class="grid w-full place-items-center overflow-hidden aspect-square bg-warning-soft text-warning" aria-hidden="true"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-image"/></svg></div>
      </button>
    </li>
  </ul>
  <div class="flex items-center justify-between gap-2">
    <p class="text-body-sm text-muted-foreground"><time>Oct 30, 2026</time></p>
    <div class="flex gap-1">
      <button type="button" class="btn btn-ghost btn-sm text-muted-foreground" aria-pressed="false"><svg class="icon size-4" aria-hidden="true"><use href="#i-thumbs-up"/></svg>Helpful (12)</button>
      <button type="button" class="btn btn-icon btn-ghost btn-sm text-foreground text-muted-foreground" aria-label="Report review"><svg class="icon" aria-hidden="true"><use href="#i-flag"/></svg></button>
    </div>
  </div>
  <div class="rounded-tile bg-surface-muted p-3">
    <p class="text-label">Seller’s response</p>
    <p class="mt-1 text-body text-muted-foreground">Jazakallahu khair po! Enjoy your dates.</p>
  </div>
</article>
```

## 12. Test notes
- Long Taglish text wraps.
