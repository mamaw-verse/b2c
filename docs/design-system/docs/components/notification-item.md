# NotificationItem

Chat & notifications · Phase 3 · Live sheet: `styleguide/components/notification-item.html`

## 1. Purpose
Activity and order updates in the Notifications tab.

**Use when**
- Order updates, promos, account notices.

**Don't use when**
- Chat messages.

## 2. Anatomy
1. Icon circle (tone by type) or product thumb.
2. Title (sr-only “Unread:”), 2-line text, time.
3. Unread dot + tinted row.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Order update | `ic: truck` |  |
| Promo | `ic: ticket` |  |
| Product | `thumb` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | n/a: Row skeletons. |
| Error | n/a: ErrorState. |
| Selected | rendered |
| Empty | rendered |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Full width list. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Inside account shell. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| type | order\|promo\|account | — |  |
| title / text / time | string | — |  |
| unread | boolean | false |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Link in a list. |
| Accessible name | Title + text. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | Unread as sr-only text, dot `aria-hidden`. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--brand-100`, `--brand-700`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-width`, `--fs-body-sm`, `--fs-caption`, `--fs-h4`, `--fs-label`, `--gutter`, `--info`, `--info-soft`, `--muted-foreground`, `--primary-soft`, `--r-panel`, `--r-tile`, `--sale`, `--sale-soft`, `--surface`, `--surface-subtle`, `currentColor (icons)`

## 9. Content rules
- Title ≤ 40 chars; action-oriented.

## 10. Do / Don't
**Do**
- Deep link to the order.

**Don't**
- Don’t send promos as order updates.

## 11. HTML usage
```html
<ul class="divide-y divide-border overflow-hidden rounded-panel border border-border">
  <li><a href="#" class="relative flex gap-3 px-gutter py-3 hover:bg-surface-subtle bg-primary-soft md:px-4"><span class="grid size-12 shrink-0 place-items-center rounded-full bg-info-soft text-info"><svg class="icon" aria-hidden="true"><use href="#i-truck"/></svg></span><span class="grid min-w-0 flex-1 grid-cols-1 gap-0.5"><span class="text-label"><span class="sr-only">Unread: </span>Parcel out for delivery</span><span class="line-clamp-2 text-body-sm text-muted-foreground">Order #240311-0042 will arrive today. Prepare ₱1,438 if paying by COD.</span><time class="text-caption text-muted-foreground">2h ago</time></span><span class="mt-1.5 size-2.5 shrink-0 rounded-full bg-sale" aria-hidden="true"></span></a></li>
  <li><a href="#" class="relative flex gap-3 px-gutter py-3 hover:bg-surface-subtle bg-surface md:px-4"><span class="grid size-12 shrink-0 place-items-center rounded-full bg-sale-soft text-sale"><svg class="icon" aria-hidden="true"><use href="#i-ticket"/></svg></span><span class="grid min-w-0 flex-1 grid-cols-1 gap-0.5"><span class="text-label">Halal Pantry Fair vouchers are live</span><span class="line-clamp-2 text-body-sm text-muted-foreground">Claim up to ₱300 off before they run out.</span><time class="text-caption text-muted-foreground">Yesterday</time></span></a></li>
  <li><a href="#" class="relative flex gap-3 px-gutter py-3 hover:bg-surface-subtle bg-surface md:px-4"><span class="w-12 shrink-0 overflow-hidden rounded-tile">
    <div class="grid w-full place-items-center overflow-hidden aspect-square bg-brand-100 text-brand-700" aria-hidden="true"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-package"/></svg></div>
    </span><span class="grid min-w-0 flex-1 grid-cols-1 gap-0.5"><span class="text-label">Rate your purchase</span><span class="line-clamp-2 text-body-sm text-muted-foreground">How were the Ajwa dates? Share a review.</span><time class="text-caption text-muted-foreground">Oct 30</time></span></a>
  </li>
</ul>
```

## 12. Test notes
- Unread row tint contrast (text on brand-soft) passes.
