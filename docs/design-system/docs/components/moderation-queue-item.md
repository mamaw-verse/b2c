# ModerationQueueItem

Moderation · Phase 4 · Live sheet: `styleguide/components/moderation-queue-item.html`

## 1. Purpose
Queue row: type icon, title, excerpt, StatusPill, age/SLA, reporter count, priority.

**Use when**
- Moderation queue list.

**Don't use when**
- Seller order lists (OrderRow).

## 2. Anatomy
1. Bulk checkbox (md+, 44px).
2. Type tile: Listing, Review, Chat, Seller application, User/Shop report, Dispute.
3. ID (tabular) + priority badge.
4. Title link (stretched row) + excerpt.
5. StatusPill · age + SLA (warn 15 min before, breach = danger) · “N reports”.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Pending | default |  |
| SLA warning | `slaState: warn` |  |
| SLA breached | `slaState: breach` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: Row click opens detail. |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | n/a: Skeleton. |
| Error | n/a: ErrorState with Retry. |
| Selected | rendered |
| Empty | n/a: “Queue is clear” EmptyState. |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Full-width row, checkbox hidden (long-press multi-select in ports). |
| Tablet (md, 768px+) | Checkbox + row; detail opens in split pane. |
| Desktop (lg, 1024px+) | Same; BulkActionBar on selection. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| item | QueueItem | — | {type, title, excerpt, state, ageSec, slaSec, reports, priority, id} |
| active | boolean | false |  |
| selectable | boolean | true |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | List item; stretched title link. |
| Accessible name | Row contents read naturally; priority has sr-only prefix. |
| Keyboard | Tab to row link; checkbox toggles bulk mode. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | `aria-current` on the open item. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Bulk count via `aria-live` in BulkActionBar. |

## 8. Tokens used
`--border`, `--brand-800`, `--brand-950`, `--danger`, `--danger-soft`, `--dur`, `--ease-out`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--foreground-inverse`, `--fs-body-sm`, `--fs-caption`, `--fs-label`, `--gutter`, `--mod-flagged`, `--mod-flagged-bg`, `--mod-hidden`, `--mod-hidden-bg`, `--mod-pending`, `--mod-pending-bg`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--r-tile`, `--surface`, `--surface-inverse`, `--surface-muted`, `--surface-subtle`, `--touch-min`, `--warning`, `--warning-soft`, `--z-sticky-bar`, `currentColor (icons)`

## 9. Content rules
- Age: “3h 52m” · SLA: “SLA 4h” / “SLA breached”.

## 10. Do / Don't
**Do**
- Sort by SLA by default.

**Don't**
- Don’t truncate the title to a fixed width — use clamp.

## 11. HTML usage
```html
<div data-ds-bulk data-ds-master>
  <div class=" z-sticky-bar hidden border-b border-border bg-surface-inverse md:block" data-ds-bulk-bar hidden>
    <div class="on-inverse flex flex-wrap items-center gap-2 px-3 py-2 text-foreground-inverse">
      <p class="flex-1 text-label" aria-live="polite" data-ds-bulk-count></p>
      <button type="button" class="btn btn-inverse btn-sm"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg><span>Approve</span></button>
      <button type="button" class="btn btn-inverse btn-sm"><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg><span>Reject</span></button>
      <button type="button" class="btn btn-inverse btn-sm"><svg class="icon" aria-hidden="true"><use href="#i-eye-off"/></svg><span>Hide</span></button>
      <button type="button" class="btn btn-inverse btn-sm"><span>Assign to me</span></button>
    </div>
  </div>
  <ul class="divide-y divide-border" aria-label="Moderation queue">
    <li class="relative flex gap-3 bg-surface px-gutter py-3 hover:bg-surface-subtle aria-[current=true]:bg-primary-soft has-[:checked]:bg-primary-soft md:px-3" aria-current="true" data-ds-detail>
      <label class="relative z-10 -my-1 hidden size-11 shrink-0 place-items-center md:grid"><input type="checkbox" class="size-5 accent-primary" data-ds-bulk-item><span class="sr-only">Select MQ-10482</span></label>
      <span class="grid size-10 shrink-0 place-items-center rounded-tile bg-surface-muted text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-tag"/></svg></span>
      <div class="grid min-w-0 flex-1 gap-1">
        <p class="flex items-center gap-2 text-caption text-muted-foreground"><span>Listing</span><span aria-hidden="true">·</span><span class="tabular">MQ-10482</span><span class="ml-auto badge badge-danger"><span class="sr-only">Priority </span>P1</span></p>
        <p class="truncate text-label"><a href="#" class="after:absolute after:inset-0">Longganisa “100% halal”: ingredients mention pork fat</a></p>
        <p class="line-clamp-1 text-body-sm text-muted-foreground">Listed by Pantry Direct PH · 3 photos · no certificate</p>
        <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm"><span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-mod-flagged-bg px-2 py-0.5 text-caption font-bold text-mod-flagged"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-flag"/></svg>Flagged</span><span class="inline-flex items-center gap-1 text-warning font-bold"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-clock"/></svg><span><span class="sr-only">Age </span>3h 52m · SLA 4h</span></span><span class="inline-flex items-center gap-1 text-muted-foreground"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-flag"/></svg>12 reports</span></p>
      </div>
    </li>
    <li class="relative flex gap-3 bg-surface px-gutter py-3 hover:bg-surface-subtle aria-[current=true]:bg-primary-soft has-[:checked]:bg-primary-soft md:px-3" data-ds-detail>
      <label class="relative z-10 -my-1 hidden size-11 shrink-0 place-items-center md:grid"><input type="checkbox" class="size-5 accent-primary" data-ds-bulk-item><span class="sr-only">Select MQ-10493</span></label>
      <span class="grid size-10 shrink-0 place-items-center rounded-tile bg-surface-muted text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-file-badge"/></svg></span>
      <div class="grid min-w-0 flex-1 gap-1">
        <p class="flex items-center gap-2 text-caption text-muted-foreground"><span>Halal check</span><span aria-hidden="true">·</span><span class="tabular">MQ-10493</span><span class="ml-auto badge badge-danger"><span class="sr-only">Priority </span>P1</span></p>
        <p class="truncate text-label"><a href="#" class="after:absolute after:inset-0">Certificate expired · Davao Halal Meats</a></p>
        <p class="line-clamp-1 text-body-sm text-muted-foreground">14 listings will be hidden at midnight</p>
        <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm"><span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-mod-pending-bg px-2 py-0.5 text-caption font-bold text-mod-pending"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-clock"/></svg>Pending</span><span class="inline-flex items-center gap-1 text-muted-foreground"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-clock"/></svg><span><span class="sr-only">Age </span>1h 05m · SLA 4h</span></span></p>
      </div>
    </li>
    <li class="relative flex gap-3 bg-surface px-gutter py-3 hover:bg-surface-subtle aria-[current=true]:bg-primary-soft has-[:checked]:bg-primary-soft md:px-3" data-ds-detail>
      <label class="relative z-10 -my-1 hidden size-11 shrink-0 place-items-center md:grid"><input type="checkbox" class="size-5 accent-primary" data-ds-bulk-item><span class="sr-only">Select MQ-10477</span></label>
      <span class="grid size-10 shrink-0 place-items-center rounded-tile bg-surface-muted text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-message-square-warning"/></svg></span>
      <div class="grid min-w-0 flex-1 gap-1">
        <p class="flex items-center gap-2 text-caption text-muted-foreground"><span>Chat report</span><span aria-hidden="true">·</span><span class="tabular">MQ-10477</span><span class="ml-auto badge badge-danger"><span class="sr-only">Priority </span>P1</span></p>
        <p class="truncate text-label"><a href="#" class="after:absolute after:inset-0">Seller asked buyer to pay via bank transfer</a></p>
        <p class="line-clamp-1 text-body-sm text-muted-foreground">“Para mas mura, send na lang po sa account ko…”</p>
        <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm"><span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-mod-pending-bg px-2 py-0.5 text-caption font-bold text-mod-pending"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-clock"/></svg>Pending</span><span class="inline-flex items-center gap-1 text-danger font-bold"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-clock"/></svg><span><span class="sr-only">Age </span>5h 10m · SLA 4h breached</span></span><span class="inline-flex items-center gap-1 text-muted-foreground"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-flag"/></svg>1 report</span></p>
      </div>
    </li>
    <li class="relative flex gap-3 bg-surface px-gutter py-3 hover:bg-surface-subtle aria-[current=true]:bg-primary-soft has-[:checked]:bg-primary-soft md:px-3" data-ds-detail>
      <label class="relative z-10 -my-1 hidden size-11 shrink-0 place-items-center md:grid"><input type="checkbox" class="size-5 accent-primary" data-ds-bulk-item><span class="sr-only">Select MQ-10466</span></label>
      <span class="grid size-10 shrink-0 place-items-center rounded-tile bg-surface-muted text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-store"/></svg></span>
      <div class="grid min-w-0 flex-1 gap-1">
        <p class="flex items-center gap-2 text-caption text-muted-foreground"><span>Seller application</span><span aria-hidden="true">·</span><span class="tabular">MQ-10466</span><span class="ml-auto badge badge-warning"><span class="sr-only">Priority </span>P2</span></p>
        <p class="truncate text-label"><a href="#" class="after:absolute after:inset-0">Barakah Pantry · seller application</a></p>
        <p class="line-clamp-1 text-body-sm text-muted-foreground">DTI permit, valid ID, halal certificate (food)</p>
        <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm"><span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-mod-pending-bg px-2 py-0.5 text-caption font-bold text-mod-pending"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-clock"/></svg>Pending</span><span class="inline-flex items-center gap-1 text-muted-foreground"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-clock"/></svg><span><span class="sr-only">Age </span>1d 2h · SLA 2d</span></span></p>
      </div>
    </li>
    <li class="relative flex gap-3 bg-surface px-gutter py-3 hover:bg-surface-subtle aria-[current=true]:bg-primary-soft has-[:checked]:bg-primary-soft md:px-3" data-ds-detail>
      <label class="relative z-10 -my-1 hidden size-11 shrink-0 place-items-center md:grid"><input type="checkbox" class="size-5 accent-primary" data-ds-bulk-item><span class="sr-only">Select MQ-10490</span></label>
      <span class="grid size-10 shrink-0 place-items-center rounded-tile bg-surface-muted text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-star"/></svg></span>
      <div class="grid min-w-0 flex-1 gap-1">
        <p class="flex items-center gap-2 text-caption text-muted-foreground"><span>Review</span><span aria-hidden="true">·</span><span class="tabular">MQ-10490</span><span class="ml-auto badge badge-warning"><span class="sr-only">Priority </span>P2</span></p>
        <p class="truncate text-label"><a href="#" class="after:absolute after:inset-0">Review contains phone number</a></p>
        <p class="line-clamp-1 text-body-sm text-muted-foreground">“Text me 0917… for cheaper price”</p>
        <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm"><span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-mod-pending-bg px-2 py-0.5 text-caption font-bold text-mod-pending"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-clock"/></svg>Pending</span><span class="inline-flex items-center gap-1 text-muted-foreground"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-clock"/></svg><span><span class="sr-only">Age </span>40m · SLA 4h</span></span><span class="inline-flex items-center gap-1 text-muted-foreground"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-flag"/></svg>3 reports</span></p>
      </div>
    </li>
    <li class="relative flex gap-3 bg-surface px-gutter py-3 hover:bg-surface-subtle aria-[current=true]:bg-primary-soft has-[:checked]:bg-primary-soft md:px-3" data-ds-detail>
      <label class="relative z-10 -my-1 hidden size-11 shrink-0 place-items-center md:grid"><input type="checkbox" class="size-5 accent-primary" data-ds-bulk-item><span class="sr-only">Select MQ-10451</span></label>
      <span class="grid size-10 shrink-0 place-items-center rounded-tile bg-surface-muted text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-scale"/></svg></span>
      <div class="grid min-w-0 flex-1 gap-1">
        <p class="flex items-center gap-2 text-caption text-muted-foreground"><span>Dispute</span><span aria-hidden="true">·</span><span class="tabular">MQ-10451</span><span class="ml-auto badge badge-danger"><span class="sr-only">Priority </span>P1</span></p>
        <p class="truncate text-label"><a href="#" class="after:absolute after:inset-0">Item not received · ₱2,150</a></p>
        <p class="line-clamp-1 text-body-sm text-muted-foreground">Order #240311-0039 · buyer vs Mindanao Halal Meats</p>
        <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm"><span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-mod-pending-bg px-2 py-0.5 text-caption font-bold text-mod-pending"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-clock"/></svg>Pending</span><span class="inline-flex items-center gap-1 text-muted-foreground"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-clock"/></svg><span><span class="sr-only">Age </span>20h · SLA 48h</span></span></p>
      </div>
    </li>
    <li class="relative flex gap-3 bg-surface px-gutter py-3 hover:bg-surface-subtle aria-[current=true]:bg-primary-soft has-[:checked]:bg-primary-soft md:px-3" data-ds-detail>
      <label class="relative z-10 -my-1 hidden size-11 shrink-0 place-items-center md:grid"><input type="checkbox" class="size-5 accent-primary" data-ds-bulk-item><span class="sr-only">Select MQ-10440</span></label>
      <span class="grid size-10 shrink-0 place-items-center rounded-tile bg-surface-muted text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-shield-alert"/></svg></span>
      <div class="grid min-w-0 flex-1 gap-1">
        <p class="flex items-center gap-2 text-caption text-muted-foreground"><span>Shop report</span><span aria-hidden="true">·</span><span class="tabular">MQ-10440</span><span class="ml-auto badge badge-neutral"><span class="sr-only">Priority </span>P3</span></p>
        <p class="truncate text-label"><a href="#" class="after:absolute after:inset-0">Shop is using a certifier’s logo without a certificate</a></p>
        <p class="line-clamp-1 text-body-sm text-muted-foreground">8 user reports in 24h</p>
        <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm"><span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-mod-hidden-bg px-2 py-0.5 text-caption font-bold text-mod-hidden"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-eye-off"/></svg>Hidden</span><span class="inline-flex items-center gap-1 text-muted-foreground"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-clock"/></svg><span><span class="sr-only">Age </span>2d · SLA 3d</span></span><span class="inline-flex items-center gap-1 text-muted-foreground"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-flag"/></svg>8 reports</span></p>
      </div>
    </li>
  </ul>
</div>
```

## 12. Test notes
- Row ≥ 44px; checkbox is 44px target.
- SLA warn/breach legible in both brands.
