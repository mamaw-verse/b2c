# Banner / Alert

Feedback · Phase 2 · Live sheet: `styleguide/components/banner.html`

## 1. Purpose
Persistent inline message about a page or form: account status, shipping delays, form summary errors.

**Use when**
- Info that stays until resolved: “Your shop is under review”.
- Form error summary after submit.

**Don't use when**
- Transient confirmation (Toast).

## 2. Anatomy
1. Container with soft tone bg and 4px tone left border.
2. Icon.
3. Title (optional), text, action link.
4. Dismiss (optional).

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Info | `tone: info` |  |
| Success | `tone: success` |  |
| Warning | `tone: warning` | Delays, pending review. |
| Danger | `tone: danger` | Suspended, payment failed. |
| Live | `live` | Appears after an action: role=status / role=alert (danger). |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | n/a: n/a |
| Error | rendered |
| Selected | n/a: n/a |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Full width, 12px padding. |
| Tablet (md, 768px+) | 16px padding. |
| Desktop (lg, 1024px+) | Same; inside content column. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| tone | info\|success\|warning\|danger | info |  |
| title | string | — |  |
| action | {label, href} | — |  |
| dismissible | boolean | false |  |
| live | boolean | false | Only when inserted after an action. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | None when present on load; `status` / `alert` when injected. |
| Accessible name | n/a. |
| Keyboard | Links/buttons inside. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | Icon decorative; tone is also in the text/title. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Injected danger banners use `role=alert`. |

## 8. Tokens used
`--danger`, `--danger-soft`, `--dur`, `--ease-out`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-label`, `--info`, `--info-soft`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--r-button`, `--r-panel`, `--success`, `--success-soft`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--warning`, `--warning-soft`, `currentColor (icons)`

## 9. Content rules
- Title says what happened; text says what to do.

## 10. Do / Don't
**Do**
- Use for persistent state.

**Don't**
- Don’t stack more than two banners.

## 11. HTML usage
```html
<div class="flex items-start gap-3 rounded-panel border-l-4 p-3 md:p-4 bg-warning-soft border-warning"><svg class="icon mt-0.5 text-warning" aria-hidden="true"><use href="#i-triangle-alert"/></svg>
  <div class="grid flex-1 gap-1">
    <p class="text-label text-warning">Deliveries may be delayed</p>
    <p class="text-body text-foreground">Typhoon signal no. 2 in Visayas. Orders to Cebu and Iloilo may arrive 2–3 days late.</p>
    <p><a href="#" class="text-label text-warning underline underline-offset-2">Learn more</a></p>
  </div>
</div>
```

## 12. Test notes
- Text on each soft tone ≥ 4.5:1 (contrast report).
