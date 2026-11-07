# QueueFilterBar

Moderation · Phase 4 · Live sheet: `styleguide/components/queue-filter-bar.html`

## 1. Purpose
Search + quick-type chips inline on tablet/desktop; phone gets a “Filters” bottom sheet.

**Use when**
- Top of the moderation queue.

**Don't use when**
- Storefront filters (SheetFilters pattern).

## 2. Anatomy
1. Queue search (ID, shop, keyword).
2. Quick chips (toggle, with counts).
3. Phone: “Filters” button → BottomSheet with type/status checkboxes + sort.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Inline | md+ |  |
| Sheet | phone |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Chips. |
| Pressed | n/a: Chips. |
| Focus-visible | n/a: Search + chips. |
| Disabled | n/a: n/a |
| Loading | rendered |
| Error | n/a: n/a |
| Selected | rendered |
| Empty | n/a: Applied filters produce the empty queue state. |
| Skeleton | n/a: not applicable |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Chips scroll horizontally; Filters sheet for full options. |
| Tablet (md, 768px+) | Chips wrap; search stays. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| filters | Query | — |  |
| onChange | fn | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Chips in a labelled group (`aria-pressed`). |
| Accessible name | “Filters” button. |
| Keyboard | — |
| Focus management | Sheet focus-traps; returns to Filters button. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Result count update polite. |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--danger`, `--dur`, `--ease-out`, `--elevation-popover`, `--elevation-sheet`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-h3`, `--fs-input`, `--fs-label`, `--gutter`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--r-field`, `--r-panel`, `--r-search`, `--ring`, `--subtle-foreground`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--z-modal`, `--z-sheet`, `currentColor (icons)`

## 9. Content rules
- Counts next to types.

## 10. Do / Don't
**Do**
- Persist filters in the URL.

**Don't**
- Don’t hide active filters.

## 11. HTML usage
```html
<div class="grid gap-2 border-b border-border bg-surface px-gutter py-2 md:px-3">
  <div class="flex gap-2">
    <form role="search" class="relative min-w-0 flex-1" data-ds-combobox action="#" onsubmit="return false">
      <label for="qf-demo-q" class="sr-only">Search queue</label>
      <svg class="icon pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true"><use href="#i-search"/></svg><input id="qf-demo-q" type="search" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="qf-demo-q-list" autocomplete="off" enterkeyhint="search" value="" placeholder="Search ID, shop, keyword" class="field rounded-search pl-10 pr-3" data-ds-open-on-focus>
      <ul id="qf-demo-q-list" role="listbox" aria-label="Suggestions" class="absolute inset-x-0 top-full z-sheet mt-1 max-h-80 overflow-auto rounded-panel border border-border bg-surface py-1 shadow-popover" hidden></ul>
      <p data-ds-empty hidden class="absolute inset-x-0 top-full z-sheet mt-1 rounded-panel border border-border bg-surface px-3 py-3 text-body text-muted-foreground shadow-popover">No matches. Press Enter to search anyway.</p>
      <p class="sr-only" aria-live="polite" data-ds-live></p>
    </form>
    <button type="button" class="btn btn-neutral md:hidden" data-ds-open="qf-demo-sheet"><svg class="icon" aria-hidden="true"><use href="#i-sliders-horizontal"/></svg><span>Filters</span></button>
  </div>
  <div class="-mx-gutter flex gap-2 overflow-x-auto px-gutter pb-1 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Quick filters">
    <button type="button" aria-pressed="false" class="inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border-control bg-surface px-3 text-label text-foreground transition-colors duration-token hover:bg-surface-muted active:bg-border aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:text-primary-soft-foreground disabled:cursor-not-allowed disabled:opacity-60 relative after:absolute after:-inset-x-px after:-inset-y-[5px]">All types</button>
    <button type="button" aria-pressed="true" class="inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border-control bg-surface px-3 text-label text-foreground transition-colors duration-token hover:bg-surface-muted active:bg-border aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:text-primary-soft-foreground disabled:cursor-not-allowed disabled:opacity-60 relative after:absolute after:-inset-x-px after:-inset-y-[5px]"><svg class="icon size-4" aria-hidden="true"><use href="#i-check"/></svg>Listings<span class="text-muted-foreground">24</span></button>
    <button type="button" aria-pressed="true" class="inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border-control bg-surface px-3 text-label text-foreground transition-colors duration-token hover:bg-surface-muted active:bg-border aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:text-primary-soft-foreground disabled:cursor-not-allowed disabled:opacity-60 relative after:absolute after:-inset-x-px after:-inset-y-[5px]"><svg class="icon size-4" aria-hidden="true"><use href="#i-check"/></svg>Halal checks<span class="text-muted-foreground">9</span></button>
    <button type="button" aria-pressed="false" class="inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border-control bg-surface px-3 text-label text-foreground transition-colors duration-token hover:bg-surface-muted active:bg-border aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:text-primary-soft-foreground disabled:cursor-not-allowed disabled:opacity-60 relative after:absolute after:-inset-x-px after:-inset-y-[5px]">Chat reports<span class="text-muted-foreground">7</span></button>
    <button type="button" aria-pressed="false" class="inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border-control bg-surface px-3 text-label text-foreground transition-colors duration-token hover:bg-surface-muted active:bg-border aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:text-primary-soft-foreground disabled:cursor-not-allowed disabled:opacity-60 relative after:absolute after:-inset-x-px after:-inset-y-[5px]">Reviews<span class="text-muted-foreground">11</span></button>
    <button type="button" aria-pressed="false" class="inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border-control bg-surface px-3 text-label text-foreground transition-colors duration-token hover:bg-surface-muted active:bg-border aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:text-primary-soft-foreground disabled:cursor-not-allowed disabled:opacity-60 relative after:absolute after:-inset-x-px after:-inset-y-[5px]">Disputes<span class="text-muted-foreground">4</span></button>
    <button type="button" aria-pressed="false" class="inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border-control bg-surface px-3 text-label text-foreground transition-colors duration-token hover:bg-surface-muted active:bg-border aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:text-primary-soft-foreground disabled:cursor-not-allowed disabled:opacity-60 relative after:absolute after:-inset-x-px after:-inset-y-[5px]"><svg class="icon size-4" aria-hidden="true"><use href="#i-alarm-clock"/></svg>SLA breached<span class="text-muted-foreground">2</span></button>
  </div>
</div>
<dialog id="qf-demo-sheet" aria-labelledby="qf-demo-sheet-title" class="z-modal bg-surface p-0 shadow-sheet transition-[translate,opacity,scale,display,overlay] transition-discrete duration-token mt-auto mb-0 w-full max-h-[90dvh] rounded-t-panel md:m-auto md:w-[min(32rem,calc(100vw-2rem))] md:rounded-panel md:max-h-[85dvh] starting:open:translate-y-full md:starting:open:translate-y-4 md:starting:open:opacity-0">
  <div class="flex max-h-[inherit] flex-col ">
    <div class="flex justify-center pt-2 md:hidden" data-ds-sheet-handle><span class="h-1.5 w-10 rounded-full bg-border-control" aria-hidden="true"></span></div>
    <div class="flex items-center gap-2 border-b border-border py-1 pl-4 pr-1 md:py-2">
      <h2 id="qf-demo-sheet-title" class="flex-1 text-h3">Filter queue</h2>
      <button type="button" class="btn btn-icon btn-ghost text-foreground" aria-label="Close" data-ds-close><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg></button>
    </div>
    <div class="overflow-y-auto overscroll-contain flex-1 p-4">
      <div class="grid gap-4">
        <fieldset class="grid">
          <legend class="mb-1 text-label">Type</legend>
          <label for="qf-demo-t0" class="flex min-h-touch items-start gap-3 py-2.5"><input id="qf-demo-t0" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary" checked><span class="grid gap-0.5"><span class="text-body">Listing</span></span></label>
          <label for="qf-demo-t1" class="flex min-h-touch items-start gap-3 py-2.5"><input id="qf-demo-t1" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary" checked><span class="grid gap-0.5"><span class="text-body">Halal check</span></span></label>
          <label for="qf-demo-t2" class="flex min-h-touch items-start gap-3 py-2.5"><input id="qf-demo-t2" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary"><span class="grid gap-0.5"><span class="text-body">Review</span></span></label>
          <label for="qf-demo-t3" class="flex min-h-touch items-start gap-3 py-2.5"><input id="qf-demo-t3" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary"><span class="grid gap-0.5"><span class="text-body">Chat report</span></span></label>
          <label for="qf-demo-t4" class="flex min-h-touch items-start gap-3 py-2.5"><input id="qf-demo-t4" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary"><span class="grid gap-0.5"><span class="text-body">Seller application</span></span></label>
          <label for="qf-demo-t5" class="flex min-h-touch items-start gap-3 py-2.5"><input id="qf-demo-t5" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary"><span class="grid gap-0.5"><span class="text-body">User report</span></span></label>
          <label for="qf-demo-t6" class="flex min-h-touch items-start gap-3 py-2.5"><input id="qf-demo-t6" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary"><span class="grid gap-0.5"><span class="text-body">Shop report</span></span></label>
          <label for="qf-demo-t7" class="flex min-h-touch items-start gap-3 py-2.5"><input id="qf-demo-t7" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary"><span class="grid gap-0.5"><span class="text-body">Dispute</span></span></label>
        </fieldset>
        <fieldset class="grid">
          <legend class="mb-1 text-label">Status</legend>
          <label for="qf-demo-s0" class="flex min-h-touch items-start gap-3 py-2.5"><input id="qf-demo-s0" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary" checked><span class="grid gap-0.5"><span class="text-body">Pending</span></span></label>
          <label for="qf-demo-s1" class="flex min-h-touch items-start gap-3 py-2.5"><input id="qf-demo-s1" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary" checked><span class="grid gap-0.5"><span class="text-body">Flagged</span></span></label>
          <label for="qf-demo-s2" class="flex min-h-touch items-start gap-3 py-2.5"><input id="qf-demo-s2" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary"><span class="grid gap-0.5"><span class="text-body">Hidden</span></span></label>
        </fieldset>
        <div class="grid gap-1.5">
          <div class="flex items-baseline justify-between gap-2">
            <label for="qf-demo-sort" class="text-label text-foreground">Sort by</label>
          </div>
          <div class="relative">
            <select id="qf-demo-sort" class="field" aria-describedby="qf-demo-sort-error">
              <option>SLA (soonest first)</option>
              <option>Priority</option>
              <option>Most reported</option>
              <option>Newest</option>
            </select>
            <svg class="icon pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true"><use href="#i-chevron-down"/></svg>
          </div>
          <p id="qf-demo-sort-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
        </div>
      </div>
    </div>
    <div class="flex flex-col gap-2 sm:flex-row sm:justify-end border-t border-border px-4 pt-3 pb-[calc(.75rem+env(safe-area-inset-bottom,0px))]">
      <button type="button" class="btn btn-neutral"><span>Reset</span></button>
      <button type="button" class="btn" data-ds-close><span>Show 31 items</span></button>
    </div>
  </div>
</dialog>
```

## 12. Test notes
- Sheet opens/closes with focus return at 360px.
