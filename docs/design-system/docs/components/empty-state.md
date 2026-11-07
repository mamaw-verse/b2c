# EmptyState

Feedback · Phase 2 · Live sheet: `styleguide/components/empty-state.html`

## 1. Purpose
Explains why a list or page is empty and offers the next action.

**Use when**
- No cart items, no orders in a tab, no search results, empty queue.

**Don't use when**
- Errors (ErrorState).

## 2. Anatomy
1. Icon in a 64px soft brand circle.
2. Title (`text-h3`).
3. One-sentence explanation.
4. Primary action (optional) + secondary.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `emptyState()` |  |
| Compact | `compact` | Inside tabs/panels. |

## 4. States
| State | Status |
|---|---|
| Default | n/a: EmptyState is itself the empty state of a list. |
| Hover (pointer only) | n/a: Actions only. |
| Pressed | n/a: n/a |
| Focus-visible | n/a: Actions only. |
| Disabled | n/a: n/a |
| Loading | n/a: Show Skeleton first; never flash EmptyState while loading. |
| Error | n/a: Use ErrorState. |
| Selected | n/a: n/a |
| Empty | rendered |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Centered, max 24rem. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| icon | name | `inbox` |  |
| title / text | string | — |  |
| action / secondary | Button props | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Plain content; title is a heading at the right level. |
| Accessible name | — |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | If it replaces results after a search, results count is announced by the search live region. |

## 8. Tokens used
`--brand-100`, `--dur`, `--ease-out`, `--fs-body`, `--fs-h3`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--r-button`, `--ring`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Title states the fact; text gives the reason/next step.
- No blame, no jokes in errors.

## 10. Do / Don't
**Do**
- Offer one clear action.

**Don't**
- Don’t show EmptyState before data loads.

## 11. HTML usage
```html
<div class="mx-auto flex max-w-sm flex-col items-center text-center gap-3 py-10"><span class="grid size-16 place-items-center rounded-full bg-primary-soft text-primary"><svg class="icon size-8" aria-hidden="true"><use href="#i-shopping-cart"/></svg></span>
  <h3 class="text-h3">Your cart is empty</h3>
  <p class="text-body text-muted-foreground">Browse today’s deals and add something you like.</p>
  <div class="mt-1 flex flex-wrap justify-center gap-2">
    <button type="button" class="btn"><span>Start shopping</span></button>
  </div>
</div>
```

## 12. Test notes
- Heading level fits the page outline.
