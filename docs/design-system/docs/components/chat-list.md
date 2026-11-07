# ChatList

Chat & notifications · Phase 3 · Live sheet: `styleguide/components/chat-list.html`

## 1. Purpose
Conversation list: avatar with presence, name, last message, time, unread count.

**Use when**
- Chat tab (phone), left column (tablet/desktop).

**Don't use when**
- Notifications.

## 2. Anatomy
1. Search field.
2. Rows (64px): avatar, name, time, last message (bold when unread), unread badge.
3. Active row `aria-current`.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `chatList()` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | n/a: Skeleton. |
| Error | n/a: ErrorState. |
| Selected | rendered |
| Empty | rendered |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Full screen list; tapping opens the thread screen. |
| Tablet (md, 768px+) | Left column `--chat-list-w` (300px) in a split view. |
| Desktop (lg, 1024px+) | Same split. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| conversations | Conversation[] | — |  |
| activeId | id | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `nav` “Conversations” with links. |
| Accessible name | Row text; unread count sr-only “2 unread”. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | Active `aria-current="true"`. |
| Touch target | 64px rows. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--brand-800`, `--danger`, `--dur`, `--ease-out`, `--focus-ring-color`, `--focus-ring-error`, `--focus-ring-offset`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-h4`, `--fs-input`, `--fs-label`, `--gutter`, `--muted-foreground`, `--primary-foreground`, `--primary-soft`, `--r-badge`, `--r-field`, `--r-panel`, `--r-search`, `--sale`, `--sale-soft`, `--subtle-foreground`, `--success`, `--success-soft`, `--surface`, `--surface-muted`, `--surface-subtle`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Times: “9:41 AM”, “Yesterday”, “Mon”, “Oct 28”.

## 10. Do / Don't
**Do**
- Bold unread rows.

**Don't**
- Don’t show full messages.

## 11. HTML usage
```html
<div class="max-w-sm rounded-panel border border-border bg-surface">
  <nav aria-label="Conversations">
    <div class="px-gutter py-2 md:px-3">
      <label for="chat-q" class="sr-only">Search chats</label>
      <div class="relative"><svg class="icon pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true"><use href="#i-search"/></svg><input id="chat-q" type="search" placeholder="Search chats" class="field rounded-search pl-10"></div>
    </div>
    <ul class="divide-y divide-border">
      <li><a href="#" class="flex min-h-16 items-center gap-3 px-gutter py-2 hover:bg-surface-subtle aria-[current=true]:bg-primary-soft md:px-3" aria-current="true"><span class="relative inline-grid shrink-0 place-items-center font-bold rounded-full size-10 text-label bg-sale-soft text-sale" aria-hidden="true"><span aria-hidden="true">BP</span><span class="absolute bottom-0 right-0 size-3 rounded-full border-2 border-surface bg-success"></span><span class="sr-only">, online</span></span><span class="grid min-w-0 flex-1 grid-cols-1 gap-0.5"><span class="flex items-baseline justify-between gap-2"><span class="truncate text-label">Barakah Pantry</span><time class="shrink-0 text-caption text-muted-foreground">9:41 AM</time></span><span class="flex items-center justify-between gap-2"><span class="truncate text-body-sm font-bold text-foreground">Yes po, available pa ang Ajwa. Ship today!</span><span class="grid min-w-5 shrink-0 place-items-center rounded-full bg-sale px-1.5 text-caption leading-5 text-primary-foreground">2<span class="sr-only"> unread</span></span></span></span></a></li>
      <li><a href="#" class="flex min-h-16 items-center gap-3 px-gutter py-2 hover:bg-surface-subtle aria-[current=true]:bg-primary-soft md:px-3"><span class="relative inline-grid shrink-0 place-items-center font-bold rounded-full size-10 text-label bg-success-soft text-success" aria-hidden="true"><span aria-hidden="true">MH</span></span><span class="grid min-w-0 flex-1 grid-cols-1 gap-0.5"><span class="flex items-baseline justify-between gap-2"><span class="truncate text-label">Mindanao Halal Meats</span><time class="shrink-0 text-caption text-muted-foreground">Yesterday</time></span><span class="flex items-center justify-between gap-2"><span class="truncate text-body-sm text-muted-foreground">Thank you for your order!</span></span></span></a></li>
      <li><a href="#" class="flex min-h-16 items-center gap-3 px-gutter py-2 hover:bg-surface-subtle aria-[current=true]:bg-primary-soft md:px-3"><span class="relative inline-grid shrink-0 place-items-center font-bold rounded-full size-10 text-label bg-brand-100 text-brand-800" aria-hidden="true"><span aria-hidden="true">HH</span></span><span class="grid min-w-0 flex-1 grid-cols-1 gap-0.5"><span class="flex items-baseline justify-between gap-2"><span class="truncate text-label">Hijab House PH</span><time class="shrink-0 text-caption text-muted-foreground">Mon</time></span><span class="flex items-center justify-between gap-2"><span class="truncate text-body-sm text-muted-foreground"><svg class="icon mr-1 inline size-3.5 align-[-0.15em]" aria-hidden="true"><use href="#i-package"/></svg>Sent a product</span></span></span></a></li>
      <li><a href="#" class="flex min-h-16 items-center gap-3 px-gutter py-2 hover:bg-surface-subtle aria-[current=true]:bg-primary-soft md:px-3"><span class="relative inline-grid shrink-0 place-items-center font-bold rounded-full size-10 text-label bg-success-soft text-success" aria-hidden="true"><span aria-hidden="true">LP</span></span><span class="grid min-w-0 flex-1 grid-cols-1 gap-0.5"><span class="flex items-baseline justify-between gap-2"><span class="truncate text-label">Lola’s Pantry</span><time class="shrink-0 text-caption text-muted-foreground">Oct 28</time></span><span class="flex items-center justify-between gap-2"><span class="truncate text-body-sm font-bold text-foreground">Your parcel is on the way 🙂</span><span class="grid min-w-5 shrink-0 place-items-center rounded-full bg-sale px-1.5 text-caption leading-5 text-primary-foreground">1<span class="sr-only"> unread</span></span></span></span></a></li>
    </ul>
  </nav>
</div>
```

## 12. Test notes
- Truncation of long names/messages.
