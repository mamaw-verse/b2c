# SegmentedControl

Navigation · Phase 2 · Live sheet: `styleguide/components/segmented-control.html`

## 1. Purpose
Exclusive choice among 2–4 short options that changes a view (grid/list, period).

**Use when**
- View switches; chart periods.

**Don't use when**
- Navigation between pages (Tabs).

## 2. Anatomy
1. `fieldset` + sr-only legend.
2. Native radios (sr-only) in labels; checked = surface + shadow.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| md | default |  |
| sm | `size: sm` | Chart toolbars. |
| Block | `block` | Full width on phone. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | n/a: n/a |
| Error | n/a: n/a |
| Selected | rendered |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Inline or block. |
| Tablet (md, 768px+) | Inline. |
| Desktop (lg, 1024px+) | Inline. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| options | string[] | — |  |
| selected | number | 0 |  |
| name | string | — |  |
| size | `sm` \| `md` | `md` |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Radio group. |
| Accessible name | Legend. |
| Keyboard | Arrows (native). |
| Focus management | One ring on the group via `.focus-ring`; the checked option reads through its selected pill. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--elevation-card-hover`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-width`, `--foreground`, `--fs-label`, `--muted-foreground`, `--r-button`, `--surface`, `--surface-muted`, `--touch-min`

## 9. Content rules
- 1–2 words each.

## 10. Do / Don't
**Do**
- Max 4 options.

**Don't**
- Don’t use for actions.

## 11. HTML usage
```html
<fieldset class="inline-flex focus-ring rounded-button bg-surface-muted p-1">
  <legend class="sr-only">Period</legend>
  <label class="relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-button px-3 text-label text-muted-foreground hover:text-foreground has-[:checked]:bg-surface has-[:checked]:text-foreground has-[:checked]:shadow-card-hover min-h-touch"><input type="radio" name="period" class="sr-only" checked>7 days</label>
  <label class="relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-button px-3 text-label text-muted-foreground hover:text-foreground has-[:checked]:bg-surface has-[:checked]:text-foreground has-[:checked]:shadow-card-hover min-h-touch"><input type="radio" name="period" class="sr-only">30 days</label>
  <label class="relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-button px-3 text-label text-muted-foreground hover:text-foreground has-[:checked]:bg-surface has-[:checked]:text-foreground has-[:checked]:shadow-card-hover min-h-touch"><input type="radio" name="period" class="sr-only">90 days</label>
</fieldset>
```

## 12. Test notes
- Arrow keys change selection.
