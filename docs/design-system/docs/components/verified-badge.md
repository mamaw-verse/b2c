# VerifiedBadge

Commerce · Phase 3 · Live sheet: `styleguide/components/verified-badge.html`

## 1. Purpose
Generic, configurable trust badge for verified/official/preferred shops. Label comes from config; no brand marks.

**Use when**
- Shop names, product cards of verified sellers.

**Don't use when**
- Moderation states.

## 2. Anatomy
1. Badge-check icon + configurable label.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Soft | `tone: soft` | Inline in titles (“Verified”). |
| Solid | `tone: solid` | Official shops. |
| Outline | `tone: outline` | On media. |
| sm | `size: sm` | Cards. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: n/a |
| Pressed | n/a: n/a |
| Focus-visible | n/a: If it explains itself, wrap in a button that opens a Popover. |
| Disabled | n/a: n/a |
| Loading | n/a: n/a |
| Error | n/a: n/a |
| Selected | n/a: n/a |
| Empty | n/a: Not rendered. |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Same. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| label | string | “Verified” | From platform config (e.g. `{{VERIFIED_LABEL}}`). |
| tone | soft\|solid\|outline | soft |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Text with decorative icon. |
| Accessible name | Label text. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--fs-caption`, `--primary`, `--primary-foreground`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--surface`, `currentColor (icons)`

## 9. Content rules
- One word.

## 10. Do / Don't
**Do**
- Keep the label config-driven per brand.

**Don't**
- Don’t imitate other marketplaces’ marks.

## 11. HTML usage
```html
<div class="flex flex-wrap gap-2"><span class="badge"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-badge-check"/></svg>Verified</span><span class="badge badge-solid"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-badge-check"/></svg>Official</span><span class="badge border border-primary bg-surface text-primary"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-badge-check"/></svg>Preferred</span></div>
```

## 12. Test notes
- Contrast of each tone in contrast report.
