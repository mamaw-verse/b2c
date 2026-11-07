# TaskCard

Seller · Phase 4 · Live sheet: `styleguide/components/task-card.html`

## 1. Purpose
Seller dashboard to-do: a count and a label that deep-links to the filtered list.

**Use when**
- Seller dashboard “To do”.

**Don't use when**
- Metrics (StatCard).

## 2. Anatomy
1. Icon tile (urgent tasks use `--sale-soft`).
2. Count (`text-h3`, tabular).
3. Label.
4. Chevron; whole card is a link.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Normal | default |  |
| Urgent | `urgent` | Ship today, needs changes. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: Navigates. |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | n/a: Skeleton. |
| Error | n/a: Show “—”. |
| Selected | rendered |
| Empty | rendered |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | 2 columns. |
| Tablet (md, 768px+) | 3 columns. |
| Desktop (lg, 1024px+) | 6 in one row. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| count | number | — |  |
| label | string | — |  |
| icon | name | — |  |
| urgent | boolean | false |  |
| href | url | — | Filtered list. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Link. |
| Accessible name | “4 To ship”. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 48px+. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--border-outline`, `--dur`, `--ease-out`, `--elevation-card-hover`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-width`, `--fs-body-sm`, `--fs-h3`, `--muted-foreground`, `--primary`, `--primary-soft`, `--r-badge`, `--r-card`, `--r-tile`, `--sale`, `--sale-soft`, `--surface`, `--surface-muted`, `--touch-primary`, `currentColor (icons)`

## 9. Content rules
- Label = list name.

## 10. Do / Don't
**Do**
- Order by urgency.

**Don't**
- Don’t exceed 6 tasks.

## 11. HTML usage
```html
<ul class="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
  <li><a href="#" class="card card-interactive flex min-h-touch-primary items-center gap-3 p-3 hover:border-border-outline"><span class="grid size-10 shrink-0 place-items-center rounded-tile bg-primary-soft text-primary"><svg class="icon" aria-hidden="true"><use href="#i-package"/></svg></span><span class="grid min-w-0 flex-1"><span class="text-h3 tabular">4</span><span class="text-body-sm text-muted-foreground">To ship</span></span><svg class="icon text-muted-foreground" aria-hidden="true"><use href="#i-chevron-right"/></svg></a></li>
  <li><a href="#" class="card card-interactive flex min-h-touch-primary items-center gap-3 p-3 hover:border-border-outline"><span class="grid size-10 shrink-0 place-items-center rounded-tile bg-sale-soft text-sale"><svg class="icon" aria-hidden="true"><use href="#i-alarm-clock"/></svg></span><span class="grid min-w-0 flex-1"><span class="text-h3 tabular">2</span><span class="text-body-sm text-muted-foreground">Ship today</span></span><svg class="icon text-muted-foreground" aria-hidden="true"><use href="#i-chevron-right"/></svg></a></li>
  <li><a href="#" class="card card-interactive flex min-h-touch-primary items-center gap-3 p-3 hover:border-border-outline"><span class="grid size-10 shrink-0 place-items-center rounded-tile bg-primary-soft text-primary"><svg class="icon" aria-hidden="true"><use href="#i-undo-2"/></svg></span><span class="grid min-w-0 flex-1"><span class="text-h3 tabular">1</span><span class="text-body-sm text-muted-foreground">Return requests</span></span><svg class="icon text-muted-foreground" aria-hidden="true"><use href="#i-chevron-right"/></svg></a></li>
  <li><a href="#" class="card card-interactive flex min-h-touch-primary items-center gap-3 p-3 hover:border-border-outline"><span class="grid size-10 shrink-0 place-items-center rounded-tile bg-primary-soft text-primary"><svg class="icon" aria-hidden="true"><use href="#i-message-circle"/></svg></span><span class="grid min-w-0 flex-1"><span class="text-h3 tabular">3</span><span class="text-body-sm text-muted-foreground">Unread chats</span></span><svg class="icon text-muted-foreground" aria-hidden="true"><use href="#i-chevron-right"/></svg></a></li>
  <li><a href="#" class="card card-interactive flex min-h-touch-primary items-center gap-3 p-3 hover:border-border-outline"><span class="grid size-10 shrink-0 place-items-center rounded-tile bg-sale-soft text-sale"><svg class="icon" aria-hidden="true"><use href="#i-triangle-alert"/></svg></span><span class="grid min-w-0 flex-1"><span class="text-h3 tabular">1</span><span class="text-body-sm text-muted-foreground">Needs changes</span></span><svg class="icon text-muted-foreground" aria-hidden="true"><use href="#i-chevron-right"/></svg></a></li>
  <li><a href="#" class="card card-interactive flex min-h-touch-primary items-center gap-3 p-3 hover:border-border-outline"><span class="grid size-10 shrink-0 place-items-center rounded-tile bg-primary-soft text-primary"><svg class="icon" aria-hidden="true"><use href="#i-boxes"/></svg></span><span class="grid min-w-0 flex-1"><span class="text-h3 tabular">6</span><span class="text-body-sm text-muted-foreground">Low stock</span></span><svg class="icon text-muted-foreground" aria-hidden="true"><use href="#i-chevron-right"/></svg></a></li>
</ul>
```

## 12. Test notes
- Two columns fit at 360px.
