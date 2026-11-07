# Link

Actions · Phase 2 · Live sheet: `styleguide/components/link.html`

## 1. Purpose
Navigates to another page or section. Underlined inline; brand coloured.

**Use when**
- Navigation in text, “See all”, policy links.

**Don't use when**
- Actions that change data: use Button.

## 2. Anatomy
1. `` with `text-primary`, underline 1px, offset 2px.
2. Optional external icon + sr-only “(opens in a new tab)”.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Inline | `link()` | Inside sentences. |
| Standalone | `link()` + `min-h-touch inline-flex` | “See all”, “View shop”: needs 44px target. |
| External | `external: true` | Opens a new tab; says so. |
| Inverse | `text-inverse-link` inside `.on-inverse` | On inverse surfaces. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: No separate pressed style; navigation is immediate. |
| Focus-visible | rendered |
| Disabled | n/a: Links are never disabled; remove the link or render plain text. |
| Loading | n/a: n/a |
| Error | n/a: n/a |
| Selected | rendered |
| Empty | n/a: n/a |
| Skeleton | n/a: Inline text skeleton. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Standalone links get a 44px target; inline links are exempt (WCAG 2.5.8 inline exception). |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same; hover thickens underline. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| href | string | — | Required. |
| external | boolean | false | Adds icon, `target=_blank rel=noopener` and sr-only hint. |
| current | boolean | false | `aria-current="page"`. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Native ``. |
| Accessible name | Link text; must make sense out of context (“View order #1042”, not “here”). |
| Keyboard | Enter. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | Standalone ≥ 44px; inline exempt. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-width`, `--foreground`, `--foreground-inverse`, `--fs-body`, `--inverse-link`, `--primary`, `--primary-hover`, `--r-panel`, `--surface-inverse`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Describe the destination.
- Never “click here”.

## 10. Do / Don't
**Do**
- Underline links in body text (colour alone is not enough).

**Don't**
- Don’t style links as plain text.
- Don’t open new tabs without saying so.

## 11. HTML usage
```html
<p class="text-body">By placing your order you agree to the <a href="#" class="font-bold text-primary underline decoration-1 underline-offset-2 hover:text-primary-hover hover:decoration-2">Terms of Service</a>.</p>
```

## 12. Test notes
- Underline present (`link-in-text-block` axe rule).
- External links announce “opens in a new tab”.
