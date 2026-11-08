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
Quiet row: icon tile | text block | optional action.
1. Container: neutral `bg-surface`, 1px `border-border`, `rounded-panel`. No tinted background, no accent stripe.
2. Icon tile: `size-9` `rounded-tile`, tone soft background + tone icon colour (decorative).
3. Text block: optional `text-label` title in `text-foreground`, body `text-body-sm` in `text-muted-foreground`. Title and body are never tone-coloured.
4. Action slot (optional): outline/ghost buttons or links only — no solid fills.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Info | `tone: info` | `bg-info-soft` tile, `Info` icon |
| Success | `tone: success` | `bg-success-soft` tile, `CircleCheck` icon |
| Warning | `tone: warning` | Delays, pending review. `bg-warning-soft` tile, `TriangleAlert` icon |
| Danger | `tone: danger` | Suspended, payment failed. `bg-danger-soft` tile, `CircleAlert` icon |
| Destructive | `tone: destructive` | Alias of danger (compat). `TriangleAlert` icon |
| Default | `tone: default` | `bg-surface-muted` tile, muted `Info` icon |
| Live | `live` | Appears after an action: role=status; role=alert for danger/destructive. |

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
| Phone (base, 360px+) | Stacked column: tile above text, action below text. 12px padding. |
| Tablet (md, 768px+) | One row; action right-aligned. 16px padding. Tile top-aligns when a body is present. |
| Desktop (lg, 1024px+) | Same; inside content column. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| tone | info\|success\|warning\|danger\|destructive\|default | info | `destructive` aliases `danger`. |
| title | string | — | `text-label text-foreground`. |
| children | ReactNode | — | Body; `text-body-sm text-muted-foreground`. |
| action | ReactNode | — | Rendered right of the text at md+, below it on phone. |
| icon | ReactNode | tone icon | Overrides the default tone icon inside the tile. |
| live | boolean | false | Only when inserted after an action. |
| className | string | — | |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | None when present on load; `status`, or `alert` for danger/destructive, when `live`. |
| Accessible name | n/a. |
| Keyboard | Links/buttons inside. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | Icon decorative; tone is also in the text/title — never colour alone. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Injected danger/destructive banners use `role=alert`. |
| Forced colours | Container keeps a 1px border so the boundary survives. |

## 8. Tokens used
`--border`, `--dur`, `--ease-out`, `--focus-ring-*`, `--foreground`, `--fs-body-sm`, `--fs-label`, `--muted-foreground`, `--r-panel`, `--r-tile`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--*-soft`, `--*-text` (info, success, warning, danger), `currentColor (icons)`

## 9. Content rules
- Title says what happened; text says what to do.

## 10. Do / Don't
**Do**
- Use for persistent state.
- Use outline or ghost buttons in the action slot.

**Don't**
- Don’t stack more than two banners.
- Don’t put solid destructive buttons in a banner — they belong in confirm dialogs.

## 11. HTML usage
```html
<div class="flex flex-col gap-3 rounded-panel border border-border bg-surface p-3 md:flex-row md:items-start md:gap-4 md:p-4">
  <div class="grid size-9 shrink-0 place-items-center rounded-tile bg-warning-soft text-warning-text">
    <svg class="icon size-5" aria-hidden="true"><use href="#i-triangle-alert"/></svg>
  </div>
  <div class="grid min-w-0 flex-1 gap-0.5">
    <p class="text-label text-foreground">Deliveries may be delayed</p>
    <div class="text-body-sm text-muted-foreground">Typhoon signal no. 2 in Visayas. Orders to Cebu and Iloilo may arrive 2–3 days late.</div>
  </div>
  <div class="shrink-0"><a href="#" class="btn btn-outline">Learn more</a></div>
</div>
```

## 12. Test notes
- Icon tile colour on each soft tone ≥ 3:1 (non-text); title ≥ 4.5:1 and body ≥ 4.5:1 on `--surface`, light and dark (contrast report).
