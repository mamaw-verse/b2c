# ErrorState

Feedback · Phase 2 · Live sheet: `styleguide/components/error-state.html`

## 1. Purpose
Replaces content that failed to load, with a retry.

**Use when**
- Network/server failures for a region or page.

**Don't use when**
- Field validation (inline error).

## 2. Anatomy
1. Icon in danger-soft circle.
2. Title + explanation.
3. Retry (outline).
4. Optional error code.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Network | `ic: wifi-off` |  |
| Server | `ic: octagon-alert` |  |
| Not found | `ic: search` | 404 pages. |

## 4. States
| State | Status |
|---|---|
| Default | n/a: ErrorState is itself the error state. |
| Hover (pointer only) | n/a: Retry button. |
| Pressed | n/a: Retry button. |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | rendered |
| Error | rendered |
| Selected | n/a: n/a |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Centered. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| title / text | string | defaults |  |
| code | string | — | Support reference. |
| onRetry | fn | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `alert` when it replaces content after an attempt. |
| Accessible name | — |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Announced assertively once. |

## 8. Tokens used
`--brand-100`, `--danger`, `--danger-soft`, `--dur`, `--ease-out`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-h3`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--r-button`, `--surface`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Plain language; no stack traces.
- Say what the user can do.

## 10. Do / Don't
**Do**
- Keep surrounding navigation usable.

**Don't**
- Don’t blame the user.

## 11. HTML usage
```html
<div class="mx-auto flex max-w-sm flex-col items-center gap-3 py-10 text-center" role="alert"><span class="grid size-16 place-items-center rounded-full bg-danger-soft text-danger"><svg class="icon size-8" aria-hidden="true"><use href="#i-wifi-off"/></svg></span>
  <h3 class="text-h3">Something went wrong</h3>
  <p class="text-body text-muted-foreground">We couldn’t load this page. Check your connection and try again.</p>
  <button type="button" class="btn btn-outline"><svg class="icon" aria-hidden="true"><use href="#i-refresh-cw"/></svg><span>Try again</span></button>
  <p class="text-caption text-muted-foreground">Error code: <span class="tabular">NET-502</span></p>
</div>
```

## 12. Test notes
- Retry focusable; announced as alert.
