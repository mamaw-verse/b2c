# Toast

Feedback · Phase 2 · Live sheet: `styleguide/components/toast.html`

## 1. Purpose
Short, transient confirmation of something the user just did (“Added to cart”). Polite live region; auto-dismiss after 5s, paused on hover/focus.

**Use when**
- Success or info after an action, when the result is not otherwise visible.

**Don't use when**
- Errors the user must fix (inline error / Banner).
- Anything the user needs to read later.

## 2. Anatomy
1. Toaster region `#ds-toaster` (`role=status`, `aria-live=polite`), above the tab bar + safe area, `z-toast`.
2. Toast on `--surface-inverse` with icon, text, optional action, dismiss button.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Success | `tone: success` | Added to cart, saved. |
| Info | `tone: info` | Copied, link shared. |
| With action | `action` | “View cart”, “Undo”. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | n/a: Don’t toast “loading”; use button loading. |
| Error | n/a: Toast only for non-blocking failures (“Couldn’t save draft”); otherwise inline. |
| Selected | n/a: n/a |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Bottom centre, full width minus gutters, above tab bar / sticky bar. |
| Tablet (md, 768px+) | Same, max 24rem. |
| Desktop (lg, 1024px+) | Bottom right, max 24rem. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| message | string | — |  |
| tone | `success` \| `info` \| `danger` | `success` |  |
| action | {label, href} | — |  |
| duration | ms | 5000 | Paused on hover/focus; never < 5s. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Container `role=status` (polite). |
| Accessible name | n/a. |
| Keyboard | Dismiss button reachable by Tab; focus is not moved to the toast. |
| Focus management | After dismiss, focus returns to the trigger. |
| ARIA | Icon `aria-hidden`. |
| Touch target | Dismiss 44px hit area. |
| Reduced motion | No slide under reduced motion. |
| Announcements | Message read politely once. |

## 8. Tokens used
`--border`, `--border-control`, `--brand-800`, `--brand-950`, `--dur`, `--ease-out`, `--elevation-popover`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--foreground-inverse`, `--fs-body`, `--fs-label`, `--inverse-link`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--r-button`, `--r-panel`, `--surface`, `--surface-inverse`, `--surface-muted`, `--touch-min`, `--touch-primary`, `currentColor (icons)`

## 9. Content rules
- Past tense, ≤ 40 characters: “Added to cart”.
- Action is a verb: “View cart”, “Undo”.

## 10. Do / Don't
**Do**
- One toast at a time; replace older.

**Don't**
- Don’t put critical errors in a toast.

## 11. HTML usage
```html
<div class="flex flex-wrap gap-3">
  <button type="button" class="btn" data-ds-toast="Added to cart"><span>Add to cart</span></button>
  <button type="button" class="btn btn-neutral" data-ds-toast="Order ID copied" data-ds-toast-tone="info"><svg class="icon" aria-hidden="true"><use href="#i-copy"/></svg><span>Copy order ID</span></button>
</div>
```

## 12. Test notes
- Announced by VoiceOver/TalkBack.
- Not hidden behind sticky bar or tab bar.
- Timer pauses on hover/focus.
