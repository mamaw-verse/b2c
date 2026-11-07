# ChatThread

Chat & notifications · Phase 3 · Live sheet: `styleguide/components/chat-thread.html`

## 1. Purpose
Message thread with day dividers, bubbles, product/order cards, safety notice and composer.

**Use when**
- Buyer ↔ seller chat.

**Don't use when**
- Support tickets (PROPOSED separate).

## 2. Anatomy
1. Thread header: back (phone), avatar, presence, shop link, menu (Report).
2. `ol` of messages (`aria-live=polite` for new incoming).
3. Day divider chips.
4. System/safety note.
5. ChatComposer.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Full screen | phone |  |
| Split | md+ | List + thread. |

## 4. States
| State | Status |
|---|---|
| Default | n/a: See example. |
| Hover (pointer only) | n/a: n/a |
| Pressed | n/a: n/a |
| Focus-visible | n/a: Thread items are not focusable; actions inside are. |
| Disabled | n/a: Blocked chats replace the composer with a Banner. |
| Loading | rendered |
| Error | rendered |
| Selected | n/a: n/a |
| Empty | rendered |
| Skeleton | n/a: Bubble skeletons. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Full screen with back button; composer pinned above the keyboard/safe area. |
| Tablet (md, 768px+) | Split: list 300px + thread. |
| Desktop (lg, 1024px+) | Same split inside the public shell. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| messages | Message[] | — | {type: text\|product\|order\|system, out, time, status} |
| peer | Shop \| User | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Ordered list of messages. |
| Accessible name | `aria-label` “Messages with {name}”. |
| Keyboard | — |
| Focus management | Opening a thread focuses the composer on desktop only (no keyboard pop on phone). |
| ARIA | sr-only “You,” / “Seller,” prefixes; status text (Sent/Read/Not sent). |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | New incoming messages via polite live list. |

## 8. Tokens used
`--background`, `--border`, `--border-control`, `--brand-100`, `--brand-700`, `--brand-800`, `--danger`, `--dur`, `--ease-out`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-h4`, `--fs-input`, `--fs-label`, `--gutter`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--r-card`, `--r-field`, `--r-panel`, `--r-search`, `--r-tile`, `--ring`, `--sale`, `--sale-soft`, `--subtle-foreground`, `--success`, `--success-soft`, `--surface`, `--surface-muted`, `--surface-subtle`, `--touch-min`, `--touch-primary`, `--warning`, `--warning-soft`, `currentColor (icons)`

## 9. Content rules
- Safety note: “Never pay outside the app.”

## 10. Do / Don't
**Do**
- Show failed state with Retry.

**Don't**
- Don’t announce your own sent messages twice.

## 11. HTML usage
```html
<div class="flex h-[32rem] flex-col overflow-hidden rounded-panel border border-border">
  <div class="flex items-center gap-2 border-b border-border bg-surface px-2 py-1">
    <button type="button" class="btn btn-icon btn-ghost text-foreground md:hidden" aria-label="Back to chats"><svg class="icon" aria-hidden="true"><use href="#i-arrow-left"/></svg></button>
    <span class="relative inline-grid shrink-0 place-items-center font-bold rounded-full size-8 text-caption bg-sale-soft text-sale" aria-hidden="true"><span aria-hidden="true">BP</span><span class="absolute bottom-0 right-0 size-3 rounded-full border-2 border-surface bg-success"></span><span class="sr-only">, online</span></span>
    <div class="min-w-0 flex-1">
      <p class="truncate text-label">Barakah Pantry</p>
      <p class="text-caption text-success">Online</p>
    </div>
    <button type="button" class="btn btn-icon btn-ghost text-foreground" aria-label="Visit shop"><svg class="icon" aria-hidden="true"><use href="#i-store"/></svg></button>
    <button type="button" class="btn btn-icon btn-ghost text-foreground" aria-label="More"><svg class="icon" aria-hidden="true"><use href="#i-ellipsis-vertical"/></svg></button>
  </div>
  <div class="flex h-full min-h-0 flex-col bg-background">
    <ol id="th1" class="flex flex-1 flex-col gap-3 overflow-y-auto px-gutter py-4" aria-label="Messages with Barakah Pantry" aria-live="polite">
      <li class="text-center"><span class="rounded-full bg-surface-muted px-3 py-1 text-caption text-muted-foreground">Today</span></li>
      <li class="flex justify-end">
        <div class="flex max-w-xs gap-3 rounded-card border border-border bg-surface p-2">
          <div class="w-16 shrink-0 overflow-hidden rounded-tile">
            <div class="grid w-full place-items-center overflow-hidden aspect-square bg-brand-100 text-brand-700" aria-hidden="true"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-cookie"/></svg></div>
          </div>
          <div class="grid min-w-0 flex-1 content-center gap-1">
            <p class="line-clamp-2 text-body-sm"><a href="#" class="hover:underline">Ajwa dates 500g, premium grade</a></p>
            <p class="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5"><span class="sr-only">Sale price:</span><span data-price class="text-body font-extrabold text-sale">₱649</span><span class="sr-only">Original price:</span><s data-price class="text-body-sm text-muted-foreground">₱799</s><span class="badge badge-sale">-19%</span></p>
          </div>
        </div>
      </li>
      <li class="flex justify-end">
        <div class="grid max-w-[80%] gap-1 justify-items-end">
          <p class="rounded-panel px-3 py-2 text-body rounded-br-badge bg-primary text-primary-foreground" data-ds-bubble-text>Hi! Available pa po ba ang Ajwa 500g?</p>
          <p class="flex items-center gap-1 text-caption text-muted-foreground"><span class="sr-only">You, </span><time>9:38 AM</time><svg class="icon size-3.5 text-primary" aria-hidden="true"><use href="#i-check-check"/></svg><span>Read</span></p>
        </div>
      </li>
      <li class="flex justify-start">
        <div class="grid max-w-[80%] gap-1 ">
          <p class="rounded-panel px-3 py-2 text-body rounded-bl-badge border border-border bg-surface text-foreground" data-ds-bubble-text>Yes po, available pa ang Ajwa. Ship today if you order before 3 PM!</p>
          <p class="flex items-center gap-1 text-caption text-muted-foreground"><span class="sr-only">Seller, </span><time>9:41 AM</time></p>
        </div>
      </li>
      <li class="flex justify-start">
        <div class="grid max-w-xs gap-2 rounded-card border border-border bg-surface p-3">
          <p class="flex items-center justify-between gap-2"><span class="text-label">Order <span class="tabular">#240311-0042</span></span><span class="badge badge-warning">To Ship</span></p>
          <p class="text-body-sm text-muted-foreground">2 items · <span class="font-bold text-foreground tabular">₱1,438</span></p>
          <p>
            <button type="button" class="btn btn-outline btn-sm"><span>View order</span></button>
          </p>
        </div>
      </li>
      <li class="text-center text-caption text-muted-foreground">Chats are monitored for your safety. Never pay outside the app.</li>
      <li class="flex justify-end">
        <div class="grid max-w-[80%] gap-1 justify-items-end">
          <p class="rounded-panel px-3 py-2 text-body rounded-br-badge bg-primary text-primary-foreground" data-ds-bubble-text>Salamat po!</p>
          <p class="flex items-center gap-1 text-caption text-danger"><span class="sr-only">You, </span><time>9:42 AM</time><svg class="icon size-3.5" aria-hidden="true"><use href="#i-circle-alert"/></svg>Not sent · 
            <button type="button" class="inline-flex min-h-touch min-w-touch items-center justify-center font-bold underline">Retry</button>
          </p>
        </div>
      </li>
    </ol>
    <template>
      <li class="flex justify-end">
        <div class="grid max-w-[80%] gap-1 justify-items-end">
          <p class="rounded-panel px-3 py-2 text-body rounded-br-badge bg-primary text-primary-foreground" data-ds-bubble-text></p>
          <p class="flex items-center gap-1 text-caption text-muted-foreground"><span class="sr-only">You, </span><time>Now</time><svg class="icon size-3.5" aria-hidden="true"><use href="#i-check"/></svg><span>Sent</span></p>
        </div>
      </li>
    </template>
    <form class="flex items-end gap-1 border-t border-border bg-surface px-2 pt-2 pb-[calc(.5rem+env(safe-area-inset-bottom,0px))]" data-ds-composer="th1">
      <button type="button" class="btn btn-icon btn-ghost text-foreground" aria-label="Attach photo, product or order"><svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg></button>
      <label for="cmp" class="sr-only">Message</label>
      <textarea id="cmp" rows="1" placeholder="Type a message" class="field max-h-40 min-h-touch flex-1 resize-none rounded-search py-2.5" data-ds-autosize enterkeyhint="send"></textarea>
      <button type="submit" class="btn btn-icon rounded-full" aria-label="Send"><svg class="icon" aria-hidden="true"><use href="#i-send"/></svg></button>
      <p class="sr-only" aria-live="polite" data-ds-live></p>
    </form>
  </div>
</div>
```

## 12. Test notes
- Composer above iOS home indicator.
- Split at 768px.
