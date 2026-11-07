# ModerationDetailPane

Moderation · Phase 4 · Live sheet: `styleguide/components/moderation-detail-pane.html`

## 1. Purpose
The item being reviewed: reported content, report reasons, history, and the action bar.

**Use when**
- Full screen on phone; right side of master-detail on md+.

**Don't use when**
- Buyer order detail.

## 2. Anatomy
1. Header: back (phone), type + ID + priority, StatusPill.
2. Context strip: age/SLA, reports, assignee.
3. ContentPreview section.
4. Report-reason tally (bars + counts).
5. History (AuditLogList).
6. Sticky ModerationActionBar.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Full screen | phone |  |
| Split | md+ |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: n/a |
| Pressed | n/a: n/a |
| Focus-visible | n/a: Back button first on phone. |
| Disabled | n/a: n/a |
| Loading | rendered |
| Error | n/a: ErrorState in the pane. |
| Selected | n/a: n/a |
| Empty | rendered |
| Skeleton | n/a: not applicable |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Full-screen route with back; sticky action bar above safe area. |
| Tablet (md, 768px+) | Master-detail: list (≤24rem) + pane. |
| Desktop (lg, 1024px+) | Same; wider content column. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| item | QueueItem | — |  |
| preview | slot | — | ContentPreview variant. |
| onAction | fn | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `article` labelled by the title. |
| Accessible name | Type + ID + title. |
| Keyboard | — |
| Focus management | Route change → pane heading on phone; keep queue position on md+. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Decision submitted → assertive toast; queue advances. |

## 8. Tokens used
`--background`, `--border`, `--border-control`, `--border-strong`, `--brand-100`, `--brand-700`, `--brand-800`, `--danger`, `--danger-hover`, `--danger-pressed`, `--danger-soft`, `--dur`, `--ease-out`, `--elevation-popover`, `--elevation-sheet`, `--elevation-sticky`, `--focus-ring-color`, `--focus-ring-error`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-h3`, `--fs-h4`, `--fs-input`, `--fs-label`, `--fs-price`, `--gutter`, `--info`, `--info-soft`, `--mod-flagged`, `--mod-flagged-bg`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--r-field`, `--r-panel`, `--r-tile`, `--sale`, `--sale-soft`, `--subtle-foreground`, `--success`, `--success-soft`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--warning`, `--z-modal`, `currentColor (icons)`, `safe-area-inset-bottom`

## 9. Content rules
- SLA copy: “3h 52m · SLA 4h (8 min left)”.

## 10. Do / Don't
**Do**
- Keep queue position after a decision.

**Don't**
- Don’t auto-advance to a different priority.

## 11. HTML usage
```html
<div class="h-[36rem] overflow-hidden rounded-panel border border-border">
  <article class="flex h-full min-h-0 flex-col bg-background" aria-labelledby="mdp-ex-h">
    <header class="flex items-center gap-2 border-b border-border bg-surface px-2 py-1 md:px-4">
      <button type="button" class="btn btn-icon btn-ghost text-foreground md:hidden" aria-label="Back to queue"><svg class="icon" aria-hidden="true"><use href="#i-arrow-left"/></svg></button>
      <div class="min-w-0 flex-1 overflow-hidden py-1">
        <p class="text-caption text-muted-foreground">Listing · <span class="tabular">MQ-10482</span> · P1</p>
        <h2 id="mdp-ex-h" class="truncate text-h4">Longganisa “100% halal”: ingredients mention pork fat</h2>
      </div>
      <span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-mod-flagged-bg px-2 py-0.5 text-caption font-bold text-mod-flagged"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-flag"/></svg>Flagged</span>
    </header>
    <div class="grid flex-1 content-start gap-4 overflow-y-auto p-gutter md:p-4">
      <div class="flex flex-wrap gap-x-4 gap-y-1 text-body-sm"><span class="inline-flex items-center gap-1 font-bold text-warning"><svg class="icon size-4" aria-hidden="true"><use href="#i-clock"/></svg>3h 52m · SLA 4h (8 min left)</span><span class="inline-flex items-center gap-1 text-muted-foreground"><svg class="icon size-4" aria-hidden="true"><use href="#i-flag"/></svg>12 reports</span><span class="text-muted-foreground">Assigned to you</span></div>
      <section class="panel p-4" aria-labelledby="mdp-ex-c">
        <h3 id="mdp-ex-c" class="mb-3 text-label">Reported content</h3>
        <div class="grid gap-3">
          <ul class="flex gap-2" aria-label="Listing photos">
            <li class="w-16 shrink-0 overflow-hidden rounded-tile">
              <div class="grid w-full place-items-center overflow-hidden aspect-square bg-brand-100 text-brand-700" role="img" aria-label="Listing photo 1"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-beef"/></svg></div>
            </li>
            <li class="w-16 shrink-0 overflow-hidden rounded-tile">
              <div class="grid w-full place-items-center overflow-hidden aspect-square bg-info-soft text-info" role="img" aria-label="Listing photo 2"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-beef"/></svg></div>
            </li>
            <li class="w-16 shrink-0 overflow-hidden rounded-tile">
              <div class="grid w-full place-items-center overflow-hidden aspect-square bg-sale-soft text-sale" role="img" aria-label="Listing photo 3"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-beef"/></svg></div>
            </li>
          </ul>
          <div class="grid content-start gap-2">
            <p class="text-h4">Longganisa 500g “100% halal”, no certificate attached</p>
            <p class="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5"><span data-price class="text-price text-foreground">₱189</span></p>
            <p class="text-body-sm text-muted-foreground">Seller: <a href="#" class="font-bold text-primary underline">Pantry Direct PH</a> · joined 12 days ago · 3 prior warnings</p>
            <p class="rounded-tile bg-mod-flagged-bg p-2 text-body-sm text-mod-flagged"><mark class="bg-transparent font-bold text-mod-flagged">“100% halal”</mark> claimed in the title. <mark class="bg-transparent font-bold text-mod-flagged">“pork fat”</mark> found in the ingredient list.</p>
            <dl class="grid gap-1 text-body-sm">
              <div class="grid grid-cols-[7rem_1fr] gap-3">
                <dt class="text-muted-foreground">Halal status</dt>
                <dd><span class="badge badge-danger"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-file-badge"/></svg>No certificate</span></dd>
              </div>
              <div class="grid grid-cols-[7rem_1fr] gap-3">
                <dt class="text-muted-foreground">Ingredients</dt>
                <dd class="text-foreground">Chicken, <mark class="rounded-badge bg-mod-flagged-bg px-1 font-bold text-mod-flagged">pork fat</mark>, salt, garlic, vinegar</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
      <section class="panel p-4" aria-labelledby="mdp-ex-hv">
        <div class="mb-3 flex items-center justify-between gap-2">
          <h3 id="mdp-ex-hv" class="text-label">Halal verification</h3>
          <span class="badge badge-danger"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-file-badge"/></svg>No certificate</span>
        </div>
        <ul class="grid gap-3" aria-label="Halal verification checklist">
          <li class="grid grid-cols-[1.5rem_1fr] gap-x-3"><span class="text-danger mt-0.5"><svg class="icon" aria-hidden="true"><use href="#i-circle-alert"/></svg></span>
            <div class="grid gap-0.5">
              <p class="text-body"><span class="sr-only">Failed: </span>Halal certificate attached</p>
              <p class="text-body-sm text-muted-foreground">No file uploaded for this listing.</p>
            </div>
          </li>
          <li class="grid grid-cols-[1.5rem_1fr] gap-x-3"><span class="text-warning mt-0.5"><svg class="icon" aria-hidden="true"><use href="#i-circle-help"/></svg></span>
            <div class="grid gap-0.5">
              <p class="text-body"><span class="sr-only">Needs a manual check: </span>Certifier is on the current accredited list</p>
              <p class="text-body-sm text-muted-foreground">Nothing to check without a certificate.</p>
            </div>
          </li>
          <li class="grid grid-cols-[1.5rem_1fr] gap-x-3"><span class="text-danger mt-0.5"><svg class="icon" aria-hidden="true"><use href="#i-circle-alert"/></svg></span>
            <div class="grid gap-0.5">
              <p class="text-body"><span class="sr-only">Failed: </span>Ingredients contain no pork, alcohol or their derivatives</p>
              <p class="text-body-sm text-muted-foreground">“Pork fat” found in the ingredient list.</p>
            </div>
          </li>
          <li class="grid grid-cols-[1.5rem_1fr] gap-x-3"><span class="text-success mt-0.5"><svg class="icon" aria-hidden="true"><use href="#i-circle-check"/></svg></span>
            <div class="grid gap-0.5">
              <p class="text-body"><span class="sr-only">Passed: </span>Seller has a valid certificate on file for other listings</p>
              <p class="text-body-sm text-muted-foreground">Certificate valid to Mar 2028 (covers beef products only).</p>
            </div>
          </li>
        </ul>
      </section>
      <section class="panel p-4" aria-labelledby="mdp-ex-r">
        <h3 id="mdp-ex-r" class="mb-3 text-label">Report reasons</h3>
        <ul class="grid gap-2 text-body">
          <li class="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1"><span>Halal claim conflicts with ingredients</span><span class="tabular text-muted-foreground">7</span><span class="col-span-2 h-1.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true"><span class="block h-full rounded-full bg-mod-flagged" style="width:58.333333333333336%"></span></span></li>
          <li class="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1"><span>No certificate shown</span><span class="tabular text-muted-foreground">4</span><span class="col-span-2 h-1.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true"><span class="block h-full rounded-full bg-mod-flagged" style="width:33.33333333333333%"></span></span></li>
          <li class="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1"><span>Other</span><span class="tabular text-muted-foreground">1</span><span class="col-span-2 h-1.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true"><span class="block h-full rounded-full bg-mod-flagged" style="width:8.333333333333332%"></span></span></li>
        </ul>
      </section>
      <section class="panel p-4" aria-labelledby="mdp-ex-a">
        <h3 id="mdp-ex-a" class="mb-3 text-label">History</h3>
        <ol class="grid gap-4" aria-label="Audit log">
          <li class="flex gap-3"><span class="relative inline-grid shrink-0 place-items-center font-bold rounded-full size-8 text-caption bg-success-soft text-success" aria-hidden="true"><span aria-hidden="true">JD</span></span>
            <div class="grid min-w-0 flex-1 gap-0.5">
              <p class="text-body"><span class="font-bold">Jun Dela Cruz</span> · Requested changes</p>
              <p class="text-body-sm text-muted-foreground">Reason: Misleading photos. “Remove brand logo from photo 2.”</p>
              <p class="text-caption text-muted-foreground"><time>Oct 30, 4:12 PM</time></p>
            </div>
          </li>
          <li class="flex gap-3"><span class="relative inline-grid shrink-0 place-items-center font-bold rounded-full size-8 text-caption bg-brand-100 text-brand-800" aria-hidden="true"><span aria-hidden="true">S</span></span>
            <div class="grid min-w-0 flex-1 gap-0.5">
              <p class="text-body"><span class="font-bold">System</span> · Auto-flagged</p>
              <p class="text-body-sm text-muted-foreground">12 reports in 3h · keyword “pork fat” + “halal” without a certificate</p>
              <p class="text-caption text-muted-foreground"><time>Oct 30, 1:05 PM</time></p>
            </div>
          </li>
          <li class="flex gap-3"><span class="relative inline-grid shrink-0 place-items-center font-bold rounded-full size-8 text-caption bg-success-soft text-success" aria-hidden="true"><span aria-hidden="true">S·</span></span>
            <div class="grid min-w-0 flex-1 gap-0.5">
              <p class="text-body"><span class="font-bold">Seller · Pantry Direct PH</span> · Edited listing</p>
              <p class="text-body-sm text-muted-foreground">Title and 2 photos changed</p>
              <p class="text-caption text-muted-foreground"><time>Oct 29, 9:40 AM</time></p>
            </div>
          </li>
        </ol>
      </section>
    </div>
    <div class="@container relative border-t border-border bg-surface shadow-sticky pb-safe">
      <div class="flex items-center gap-2 px-gutter py-2 md:px-4">
        <div class="hidden flex-1 flex-wrap gap-2 @3xl:flex">
          <button type="button" class="btn btn-neutral"><svg class="icon" aria-hidden="true"><use href="#i-square-pen"/></svg><span>Request changes</span></button>
          <button type="button" class="btn btn-neutral"><svg class="icon" aria-hidden="true"><use href="#i-file-badge"/></svg><span>Request certificate</span></button>
          <button type="button" class="btn btn-neutral"><svg class="icon" aria-hidden="true"><use href="#i-eye-off"/></svg><span>Hide</span></button>
          <button type="button" class="btn btn-neutral"><svg class="icon" aria-hidden="true"><use href="#i-triangle-alert"/></svg><span>Warn</span></button>
          <button type="button" class="btn btn-neutral text-danger"><svg class="icon" aria-hidden="true"><use href="#i-ban"/></svg><span>Suspend</span></button>
        </div>
        <span class="@3xl:hidden">
        <button type="button" class="btn btn-icon btn-neutral" aria-label="More actions" popovertarget="mdp-ex-ab-more" aria-haspopup="menu"><svg class="icon" aria-hidden="true"><use href="#i-ellipsis"/></svg></button>
        <div id="mdp-ex-ab-more" popover role="menu" aria-label="More actions" class="fixed m-0 min-w-48 rounded-panel border border-border bg-surface p-1 shadow-popover">
          <button type="button" role="menuitem" class="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body text-foreground hover:bg-surface-muted"><svg class="icon size-4" aria-hidden="true"><use href="#i-square-pen"/></svg>Request changes</button>
          <button type="button" role="menuitem" class="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body text-foreground hover:bg-surface-muted"><svg class="icon size-4" aria-hidden="true"><use href="#i-file-badge"/></svg>Request certificate</button>
          <button type="button" role="menuitem" class="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body text-foreground hover:bg-surface-muted"><svg class="icon size-4" aria-hidden="true"><use href="#i-eye-off"/></svg>Hide</button>
          <button type="button" role="menuitem" class="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body text-foreground hover:bg-surface-muted"><svg class="icon size-4" aria-hidden="true"><use href="#i-triangle-alert"/></svg>Warn seller</button>
          <div role="separator" class="my-1 border-t border-border"></div>
          <button type="button" role="menuitem" class="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body text-danger hover:bg-danger-soft"><svg class="icon size-4" aria-hidden="true"><use href="#i-ban"/></svg>Suspend shop</button>
          <button type="button" role="menuitem" class="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body text-foreground hover:bg-surface-muted"><svg class="icon size-4" aria-hidden="true"><use href="#i-arrow-up"/></svg>Escalate</button>
        </div>
        </span>
        <button type="button" class="btn btn-danger btn-lg flex-1 @3xl:flex-none" data-ds-open="mdp-ex-ab-reject"><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg><span>Reject</span></button>
        <button type="button" class="btn btn-lg flex-1 @3xl:flex-none"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg><span>Approve</span></button>
      </div>
    </div>
    <dialog id="mdp-ex-ab-reject" aria-labelledby="mdp-ex-ab-reject-title" class="z-modal bg-surface p-0 shadow-sheet transition-[translate,opacity,scale,display,overlay] transition-discrete duration-token mt-auto mb-0 w-full max-h-[90dvh] rounded-t-panel md:m-auto md:w-[min(32rem,calc(100vw-2rem))] md:rounded-panel md:max-h-[85dvh] starting:open:translate-y-full md:starting:open:translate-y-4 md:starting:open:opacity-0">
      <div class="flex max-h-[inherit] flex-col ">
        <div class="flex justify-center pt-2 md:hidden" data-ds-sheet-handle><span class="h-1.5 w-10 rounded-full bg-border-control" aria-hidden="true"></span></div>
        <div class="flex items-center gap-2 border-b border-border py-1 pl-4 pr-1 md:py-2">
          <h2 id="mdp-ex-ab-reject-title" class="flex-1 text-h3">Reject listing</h2>
          <button type="button" class="btn btn-icon btn-ghost text-foreground" aria-label="Close" data-ds-close><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg></button>
        </div>
        <div class="overflow-y-auto overscroll-contain flex-1 p-4">
          <div class="grid gap-4">
            <fieldset class="grid">
              <legend class="mb-1 text-label">Reason (required)</legend>
              <label for="mdp-ex-ab-rp-0" class="flex min-h-touch items-start gap-3 py-2.5"><input id="mdp-ex-ab-rp-0" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="mdp-ex-ab-rp-reason" required><span class="grid gap-0.5"><span class="text-body">Halal claim not supported by a valid certificate</span></span></label>
              <label for="mdp-ex-ab-rp-1" class="flex min-h-touch items-start gap-3 py-2.5"><input id="mdp-ex-ab-rp-1" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="mdp-ex-ab-rp-reason"><span class="grid gap-0.5"><span class="text-body">Certifier is not recognised or certificate is expired</span></span></label>
              <label for="mdp-ex-ab-rp-2" class="flex min-h-touch items-start gap-3 py-2.5"><input id="mdp-ex-ab-rp-2" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="mdp-ex-ab-rp-reason"><span class="grid gap-0.5"><span class="text-body">Ingredients conflict with the halal claim</span></span></label>
              <label for="mdp-ex-ab-rp-3" class="flex min-h-touch items-start gap-3 py-2.5"><input id="mdp-ex-ab-rp-3" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="mdp-ex-ab-rp-reason"><span class="grid gap-0.5"><span class="text-body">Prohibited or restricted item</span></span></label>
              <label for="mdp-ex-ab-rp-4" class="flex min-h-touch items-start gap-3 py-2.5"><input id="mdp-ex-ab-rp-4" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="mdp-ex-ab-rp-reason"><span class="grid gap-0.5"><span class="text-body">Misleading title, photos or price</span></span></label>
              <label for="mdp-ex-ab-rp-5" class="flex min-h-touch items-start gap-3 py-2.5"><input id="mdp-ex-ab-rp-5" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="mdp-ex-ab-rp-reason"><span class="grid gap-0.5"><span class="text-body">Contact details or off-platform payment</span></span></label>
              <label for="mdp-ex-ab-rp-6" class="flex min-h-touch items-start gap-3 py-2.5"><input id="mdp-ex-ab-rp-6" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="mdp-ex-ab-rp-reason"><span class="grid gap-0.5"><span class="text-body">Incomplete documents</span></span></label>
            </fieldset>
            <div class="grid gap-1.5">
              <div class="flex items-baseline justify-between gap-2">
                <label for="mdp-ex-ab-rp-note" class="text-label text-foreground">Message to seller</label>
              </div>
              <textarea id="mdp-ex-ab-rp-note" rows="3" class="field" placeholder="e.g. Remove the logo from photos 2 and 3." maxlength="1000" aria-describedby="mdp-ex-ab-rp-note-help mdp-ex-ab-rp-note-error mdp-ex-ab-rp-note-count" data-ds-counter="mdp-ex-ab-rp-note-count"></textarea>
              <div class="flex gap-2">
                <p id="mdp-ex-ab-rp-note-help" class="text-body-sm text-muted-foreground">Sent with the decision. Be specific about what to change.</p>
                <p id="mdp-ex-ab-rp-note-count" class="ml-auto shrink-0 text-body-sm text-muted-foreground tabular">0 / 1000</p>
              </div>
              <p id="mdp-ex-ab-rp-note-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
            </div>
            <label for="mdp-ex-ab-rp-int" class="flex min-h-touch items-start gap-3 py-2.5"><input id="mdp-ex-ab-rp-int" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary"><span class="grid gap-0.5"><span class="text-body">Add internal note only (not sent)</span></span></label>
          </div>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row sm:justify-end border-t border-border px-4 pt-3 pb-[calc(.75rem+env(safe-area-inset-bottom,0px))]">
          <button type="button" class="btn btn-neutral" data-ds-close><span>Cancel</span></button>
          <button type="button" class="btn btn-danger"><span>Reject listing</span></button>
        </div>
      </div>
    </dialog>
  </article>
</div>
```

## 12. Test notes
- Action bar above iOS home indicator.
- Split renders at 768px.
