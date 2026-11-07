# StatusPill (moderation)

Moderation · Phase 4 · Live sheet: `styleguide/components/status-pill.html`

## 1. Purpose
Item state in the moderation console: pending, flagged, hidden, suspended, resolved.

**Use when**
- Queue rows, detail pane, audit log.

**Don't use when**
- Buyer-facing order status (badge).

## 2. Anatomy
1. Icon (never colour alone) + label, on the `--mod-*` soft tokens.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| pending | state: 'pending' |  |
| flagged | state: 'flagged' |  |
| hidden | state: 'hidden' |  |
| suspended | state: 'suspended' |  |
| resolved | state: 'resolved' |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Not interactive. |
| Pressed | n/a: n/a |
| Focus-visible | n/a: n/a |
| Disabled | n/a: n/a |
| Loading | n/a: n/a |
| Error | n/a: n/a |
| Selected | rendered |
| Empty | n/a: n/a |
| Skeleton | n/a: Badge-sized skeleton. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Same at all sizes. |
| Tablet (md, 768px+) |  |
| Desktop (lg, 1024px+) |  |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| state | mod state | — |  |
| label | string | default | Override for i18n. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | — |
| Accessible name | Text + icon; colour is reinforcement only. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--fs-caption`, `--mod-flagged`, `--mod-flagged-bg`, `--mod-hidden`, `--mod-hidden-bg`, `--mod-pending`, `--mod-pending-bg`, `--mod-resolved`, `--mod-resolved-bg`, `--mod-suspended`, `--mod-suspended-bg`, `currentColor (icons)`

## 9. Content rules
- Labels: Pending, Flagged, Hidden, Suspended, Resolved.

## 10. Do / Don't
**Do**
- Pair with the SLA text.

**Don't**
- Don’t invent colours outside `--mod-*`.

## 11. HTML usage
```html
<div class="flex flex-wrap gap-2"><span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-mod-pending-bg px-2 py-0.5 text-caption font-bold text-mod-pending"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-clock"/></svg>Pending</span><span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-mod-flagged-bg px-2 py-0.5 text-caption font-bold text-mod-flagged"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-flag"/></svg>Flagged</span><span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-mod-hidden-bg px-2 py-0.5 text-caption font-bold text-mod-hidden"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-eye-off"/></svg>Hidden</span><span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-mod-suspended-bg px-2 py-0.5 text-caption font-bold text-mod-suspended"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-ban"/></svg>Suspended</span><span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-mod-resolved-bg px-2 py-0.5 text-caption font-bold text-mod-resolved"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-circle-check"/></svg>Resolved</span></div>
```

## 12. Test notes
- All five pairs in the contrast report.
