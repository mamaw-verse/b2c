# Skeleton

Feedback · Phase 2 · Live sheet: `styleguide/components/skeleton.html`

## 1. Purpose
Placeholder shapes while content loads, matching the final layout to avoid shifts.

**Use when**
- First load of lists, cards, detail pages > 300ms.

**Don't use when**
- Short actions (button loading).
- Errors.

## 2. Anatomy
1. Wrapper `aria-busy=true` with sr-only “Loading”.
2. Blocks `bg-surface-muted animate-pulse` sized like the content, `aria-hidden`.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Text line | `skel("h-4 w-3/4")` |  |
| Media | `skel("aspect-square")` |  |
| Composite | ProductCard skeleton etc. | Each component documents its own. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: n/a |
| Pressed | n/a: n/a |
| Focus-visible | n/a: Not focusable. |
| Disabled | n/a: n/a |
| Loading | n/a: Skeleton is the loading state. |
| Error | n/a: Replace with ErrorState. |
| Selected | n/a: n/a |
| Empty | n/a: Replace with EmptyState. |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Matches the phone layout of the real content. |
| Tablet (md, 768px+) | Matches tablet layout. |
| Desktop (lg, 1024px+) | Matches desktop layout. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| shape | class string | — |  |
| label | string | “Loading” | Wrapper sr-only text. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Wrapper `aria-busy="true"`. |
| Accessible name | sr-only “Loading”. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | Blocks `aria-hidden`. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Pulse stops under reduced motion. |
| Announcements | One “Loading” per region; content replaces it. |

## 8. Tokens used
`--r-badge`, `--r-card`, `--surface-muted`

## 9. Content rules
- No text inside skeletons.

## 10. Do / Don't
**Do**
- Keep sizes equal to the content to avoid layout shift.

**Don't**
- Don’t show skeleton and spinner together.

## 11. HTML usage
```html
<div aria-busy="true"><span class="sr-only">Loading</span>
  <div aria-hidden="true">
    <div class="grid max-w-xs gap-2"><span class="block animate-pulse rounded-badge bg-surface-muted aspect-square w-full rounded-card"></span><span class="block animate-pulse rounded-badge bg-surface-muted h-4 w-full"></span><span class="block animate-pulse rounded-badge bg-surface-muted h-4 w-2/3"></span><span class="block animate-pulse rounded-badge bg-surface-muted h-5 w-1/3"></span></div>
  </div>
</div>
```

## 12. Test notes
- No CLS when content swaps in.
- Pulse disabled with reduced motion.
