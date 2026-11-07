# BulkActionBar

Moderation · Phase 4 · Live sheet: `styleguide/components/bulk-action-bar.html`

## 1. Purpose
Actions on selected queue items; appears when checkboxes are ticked.

**Use when**
- Moderation queue, tablet/desktop.

**Don't use when**
- Phone (single-item flow instead).

## 2. Anatomy
1. Inverse bar: “N selected” (live), Approve / Reject / Hide / Assign to me.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `bulkBar()` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Inverse buttons. |
| Pressed | n/a: Inverse buttons. |
| Focus-visible | n/a: Inverse focus ring on `--surface-inverse`. |
| Disabled | n/a: n/a |
| Loading | n/a: Buttons busy per action. |
| Error | n/a: Partial failures listed in a banner. |
| Selected | n/a: n/a |
| Empty | rendered |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Not used (`.md:hidden` single-item flow). |
| Tablet (md, 768px+) | Sticky at the top of the list. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| count | number | — |  |
| actions | set | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Toolbar region. |
| Accessible name | “N selected” is `aria-live`. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | `.on-inverse` focus rings. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--border-strong`, `--brand-800`, `--brand-950`, `--danger`, `--danger-soft`, `--dur`, `--ease-out`, `--foreground`, `--foreground-inverse`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-label`, `--gutter`, `--mod-pending`, `--mod-pending-bg`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--r-panel`, `--r-tile`, `--ring`, `--surface`, `--surface-inverse`, `--surface-muted`, `--surface-subtle`, `--touch-min`, `--warning`, `--warning-soft`, `--z-sticky-bar`, `currentColor (icons)`

## 9. Content rules
- “Assign to me” for workload.

## 10. Do / Don't
**Do**
- Confirm before applying to all.

**Don't**
- Don’t allow bulk Suspend.

## 11. HTML usage
```html
<div data-ds-bulk class="overflow-hidden rounded-panel border border-border">
  <div class=" z-sticky-bar hidden border-b border-border bg-surface-inverse md:block" data-ds-bulk-bar>
    <div class="on-inverse flex flex-wrap items-center gap-2 px-3 py-2 text-foreground-inverse">
      <p class="flex-1 text-label" aria-live="polite" data-ds-bulk-count>3 selected</p>
      <button type="button" class="btn btn-inverse btn-sm"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg><span>Approve</span></button>
      <button type="button" class="btn btn-inverse btn-sm"><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg><span>Reject</span></button>
      <button type="button" class="btn btn-inverse btn-sm"><svg class="icon" aria-hidden="true"><use href="#i-eye-off"/></svg><span>Hide</span></button>
      <button type="button" class="btn btn-inverse btn-sm"><span>Assign to me</span></button>
    </div>
  </div>
  <ul>
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
      <label class="relative z-10 -my-1 hidden size-11 shrink-0 place-items-center md:grid"><input type="checkbox" class="size-5 accent-primary" data-ds-bulk-item><span class="sr-only">Select MQ-10466</span></label>
      <span class="grid size-10 shrink-0 place-items-center rounded-tile bg-surface-muted text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-store"/></svg></span>
      <div class="grid min-w-0 flex-1 gap-1">
        <p class="flex items-center gap-2 text-caption text-muted-foreground"><span>Seller application</span><span aria-hidden="true">·</span><span class="tabular">MQ-10466</span><span class="ml-auto badge badge-warning"><span class="sr-only">Priority </span>P2</span></p>
        <p class="truncate text-label"><a href="#" class="after:absolute after:inset-0">Barakah Pantry · seller application</a></p>
        <p class="line-clamp-1 text-body-sm text-muted-foreground">DTI permit, valid ID, halal certificate (food)</p>
        <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm"><span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-mod-pending-bg px-2 py-0.5 text-caption font-bold text-mod-pending"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-clock"/></svg>Pending</span><span class="inline-flex items-center gap-1 text-muted-foreground"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-clock"/></svg><span><span class="sr-only">Age </span>1d 2h · SLA 2d</span></span></p>
      </div>
    </li>
  </ul>
</div>
```

## 12. Test notes
- Appears/disappears with selection at 768px.
