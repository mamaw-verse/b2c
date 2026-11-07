# Tooltip

Overlays · Phase 2 · Live sheet: `styleguide/components/tooltip.html`

## 1. Purpose
Supplementary label on hover (pointer) or keyboard focus. Never on touch, never the only source of information.

**Use when**
- Icon buttons on desktop toolbars (seller/admin).

**Don't use when**
- Essential info, rich content, touch-only screens.

## 2. Anatomy
1. Wrapper `[data-ds-tooltip]`.
2. Trigger with `aria-describedby` (it already has its own name).
3. Bubble `role=tooltip` on inverse surface, `text-caption`.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Top | default |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: Hidden on press. |
| Focus-visible | rendered |
| Disabled | n/a: Disabled triggers do not show tooltips; explain inline instead. |
| Loading | n/a: n/a |
| Error | n/a: n/a |
| Selected | n/a: n/a |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Not shown on touch (hover media query); the trigger’s `aria-label` carries meaning. |
| Tablet (md, 768px+) | Same (most tablets are touch). |
| Desktop (lg, 1024px+) | Shown on hover and keyboard focus. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| content | string | — | ≤ 40 chars. |
| placement | `top` | `top` |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `tooltip`. |
| Accessible name | Trigger has its own `aria-label`; tooltip is a description. |
| Keyboard | Shows on focus; Escape dismisses (WCAG 1.4.13). |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | n/a (pointer only). |
| Reduced motion | Fade removed under reduced motion. |
| Announcements | Read as description. |

## 8. Tokens used
`--brand-100`, `--dur`, `--ease-out`, `--foreground`, `--foreground-inverse`, `--fs-caption`, `--fs-label`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--r-badge`, `--r-button`, `--ring`, `--surface-inverse`, `--touch-min`, `--touch-primary`, `--z-toast`, `currentColor (icons)`

## 9. Content rules
- Short noun/verb phrase.

## 10. Do / Don't
**Do**
- Use on icon-only toolbar buttons.

**Don't**
- Don’t put links inside.

## 11. HTML usage
```html
<span class="group relative inline-flex" data-ds-tooltip>
<button aria-describedby="tt1" type="button" class="btn btn-icon btn-ghost text-foreground" aria-label="Copy order ID"><svg class="icon" aria-hidden="true"><use href="#i-copy"/></svg></button>
<span role="tooltip" id="tt1" class="pointer-events-none absolute bottom-full left-1/2 z-toast mb-2 w-max max-w-56 -translate-x-1/2 rounded-badge bg-surface-inverse px-2 py-1 text-caption text-foreground-inverse transition-opacity duration-token invisible opacity-0 group-hover:visible group-hover:opacity-100 group-has-[:focus-visible]:visible group-has-[:focus-visible]:opacity-100 group-data-[dismissed]:invisible">Copy order ID</span></span>
```

## 12. Test notes
- Escape hides it.
- No tooltip on touch emulation.
