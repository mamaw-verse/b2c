# Popover / Dropdown

Overlays · Phase 2 · Live sheet: `styleguide/components/popover.html`

## 1. Purpose
Small menu anchored to a trigger (more actions, sort). Native `popover` attribute: light dismiss and Escape for free.

**Use when**
- ≤ 6 actions on desktop and phone.

**Don't use when**
- Long lists on phone (BottomSheet action sheet).
- Forms.

## 2. Anatomy
1. Trigger with `popovertarget` + `aria-haspopup="menu"`.
2. Panel `role=menu`, `--shadow-popover`, `--r-panel`.
3. Items `role=menuitem` 44px; separator; danger item.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Menu | `menu()` |  |
| Align end | `align: end` | Kebab menus at the right edge. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: Item activates. |
| Focus-visible | rendered |
| Disabled | n/a: Use `aria-disabled` on an item and explain why. |
| Loading | n/a: n/a |
| Error | n/a: n/a |
| Selected | n/a: Use `menuitemradio` + `aria-checked` for sort. |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Anchored under the trigger, clamped to 8px from the viewport edge. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| items | {label, icon, danger, onSelect}[] | — |  |
| align | `start` \| `end` | `end` |  |
| trigger | slot | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `menu` / `menuitem`. |
| Accessible name | Trigger label; menu `aria-label`. |
| Keyboard | Enter/Space opens; Down/Up/Home/End move; Escape closes (native light dismiss). |
| Focus management | First item focused on open; focus returns to the trigger on close (native popover). |
| ARIA | `aria-haspopup="menu"`; expanded state exposed by `popovertarget`. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--danger`, `--danger-soft`, `--dur`, `--ease-out`, `--elevation-popover`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-label`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--r-button`, `--r-panel`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `currentColor (icons)`

## 9. Content rules
- Items are verbs.
- Danger item last, separated.

## 10. Do / Don't
**Do**
- Keep ≤ 6 items.

**Don't**
- Don’t put links and actions in one menu without separators.

## 11. HTML usage
```html
<button type="button" class="btn btn-icon btn-ghost text-foreground" aria-label="More actions" popovertarget="pm1" aria-haspopup="menu"><svg class="icon" aria-hidden="true"><use href="#i-ellipsis-vertical"/></svg></button>
<div id="pm1" popover role="menu" aria-label="More actions" class="fixed m-0 min-w-48 rounded-panel border border-border bg-surface p-1 shadow-popover" data-ds-align-end>
  <button type="button" role="menuitem" class="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body text-foreground hover:bg-surface-muted"><svg class="icon size-4" aria-hidden="true"><use href="#i-share-2"/></svg>Share</button>
  <button type="button" role="menuitem" class="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body text-foreground hover:bg-surface-muted"><svg class="icon size-4" aria-hidden="true"><use href="#i-copy"/></svg>Copy link</button>
  <div role="separator" class="my-1 border-t border-border"></div>
  <button type="button" role="menuitem" class="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body text-danger hover:bg-danger-soft"><svg class="icon size-4" aria-hidden="true"><use href="#i-flag"/></svg>Report listing</button>
</div>
```

## 12. Test notes
- Opens within viewport at 360px.
- Escape closes and returns focus.
