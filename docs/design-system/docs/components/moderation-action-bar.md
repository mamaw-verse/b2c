# ModerationActionBar

Moderation · Phase 4 · Live sheet: `styleguide/components/moderation-action-bar.html`

## 1. Purpose
Decisions on the open item: Approve, Reject always visible; secondary actions behind More on phone.

**Use when**
- Bottom of ModerationDetailPane.

**Don't use when**
- Bulk decisions (BulkActionBar).

## 2. Anatomy
1. Approve (primary) + Reject (danger) — split width on phone.
2. More menu: request changes, hide, warn, suspend, escalate.
3. Reject opens the ReasonPicker sheet/dialog.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Compact | phone (<lg) | 2 buttons + More. |
| Full | lg+ | All actions inline. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Buttons. |
| Pressed | n/a: Buttons. |
| Focus-visible | rendered |
| Disabled | n/a: Item already decided → bar replaced by the decision summary. |
| Loading | rendered |
| Error | n/a: Failed decision → retry toast. |
| Selected | n/a: n/a |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Sticky above safe area; secondary actions in a popover menu. |
| Tablet (md, 768px+) | Sticky within the detail pane. |
| Desktop (lg, 1024px+) | All 7 actions inline. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| actions | allowed set | all | Per queue type. |
| onDecide | fn | — | {action, reason, note} |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | — |
| Accessible name | Every item labelled; destructive items use danger text. |
| Keyboard | — |
| Focus management | Reject opens sheet → focus the reason group; close → back to Reject. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | “Listing rejected — message sent.” |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--danger`, `--danger-hover`, `--danger-pressed`, `--danger-soft`, `--dur`, `--ease-out`, `--elevation-popover`, `--elevation-sheet`, `--elevation-sticky`, `--focus-ring-color`, `--focus-ring-error`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-h3`, `--fs-input`, `--fs-label`, `--gutter`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--r-button`, `--r-field`, `--r-panel`, `--subtle-foreground`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--z-modal`, `currentColor (icons)`, `safe-area-inset-bottom`

## 9. Content rules
- Verbs only: Approve, Reject, Hide, Warn, Suspend, Escalate.

## 10. Do / Don't
**Do**
- Confirm suspend/escalate.

**Don't**
- Don’t put Suspend next to Approve.

## 11. HTML usage
```html
<div class="overflow-hidden rounded-panel border border-border">
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
      <button type="button" class="btn btn-icon btn-neutral" aria-label="More actions" popovertarget="mab-ex-more" aria-haspopup="menu"><svg class="icon" aria-hidden="true"><use href="#i-ellipsis"/></svg></button>
      <div id="mab-ex-more" popover role="menu" aria-label="More actions" class="fixed m-0 min-w-48 rounded-panel border border-border bg-surface p-1 shadow-popover">
        <button type="button" role="menuitem" class="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body text-foreground hover:bg-surface-muted"><svg class="icon size-4" aria-hidden="true"><use href="#i-square-pen"/></svg>Request changes</button>
        <button type="button" role="menuitem" class="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body text-foreground hover:bg-surface-muted"><svg class="icon size-4" aria-hidden="true"><use href="#i-file-badge"/></svg>Request certificate</button>
        <button type="button" role="menuitem" class="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body text-foreground hover:bg-surface-muted"><svg class="icon size-4" aria-hidden="true"><use href="#i-eye-off"/></svg>Hide</button>
        <button type="button" role="menuitem" class="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body text-foreground hover:bg-surface-muted"><svg class="icon size-4" aria-hidden="true"><use href="#i-triangle-alert"/></svg>Warn seller</button>
        <div role="separator" class="my-1 border-t border-border"></div>
        <button type="button" role="menuitem" class="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body text-danger hover:bg-danger-soft"><svg class="icon size-4" aria-hidden="true"><use href="#i-ban"/></svg>Suspend shop</button>
        <button type="button" role="menuitem" class="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body text-foreground hover:bg-surface-muted"><svg class="icon size-4" aria-hidden="true"><use href="#i-arrow-up"/></svg>Escalate</button>
      </div>
      </span>
      <button type="button" class="btn btn-danger btn-lg flex-1 @3xl:flex-none" data-ds-open="mab-ex-reject"><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg><span>Reject</span></button>
      <button type="button" class="btn btn-lg flex-1 @3xl:flex-none"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg><span>Approve</span></button>
    </div>
  </div>
  <dialog id="mab-ex-reject" aria-labelledby="mab-ex-reject-title" class="z-modal bg-surface p-0 shadow-sheet transition-[translate,opacity,scale,display,overlay] transition-discrete duration-token mt-auto mb-0 w-full max-h-[90dvh] rounded-t-panel md:m-auto md:w-[min(32rem,calc(100vw-2rem))] md:rounded-panel md:max-h-[85dvh] starting:open:translate-y-full md:starting:open:translate-y-4 md:starting:open:opacity-0">
    <div class="flex max-h-[inherit] flex-col ">
      <div class="flex justify-center pt-2 md:hidden" data-ds-sheet-handle><span class="h-1.5 w-10 rounded-full bg-border-control" aria-hidden="true"></span></div>
      <div class="flex items-center gap-2 border-b border-border py-1 pl-4 pr-1 md:py-2">
        <h2 id="mab-ex-reject-title" class="flex-1 text-h3">Reject listing</h2>
        <button type="button" class="btn btn-icon btn-ghost text-foreground" aria-label="Close" data-ds-close><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg></button>
      </div>
      <div class="overflow-y-auto overscroll-contain flex-1 p-4">
        <div class="grid gap-4">
          <fieldset class="grid">
            <legend class="mb-1 text-label">Reason (required)</legend>
            <label for="mab-ex-rp-0" class="flex min-h-touch items-start gap-3 py-2.5"><input id="mab-ex-rp-0" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="mab-ex-rp-reason" required><span class="grid gap-0.5"><span class="text-body">Halal claim not supported by a valid certificate</span></span></label>
            <label for="mab-ex-rp-1" class="flex min-h-touch items-start gap-3 py-2.5"><input id="mab-ex-rp-1" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="mab-ex-rp-reason"><span class="grid gap-0.5"><span class="text-body">Certifier is not recognised or certificate is expired</span></span></label>
            <label for="mab-ex-rp-2" class="flex min-h-touch items-start gap-3 py-2.5"><input id="mab-ex-rp-2" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="mab-ex-rp-reason"><span class="grid gap-0.5"><span class="text-body">Ingredients conflict with the halal claim</span></span></label>
            <label for="mab-ex-rp-3" class="flex min-h-touch items-start gap-3 py-2.5"><input id="mab-ex-rp-3" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="mab-ex-rp-reason"><span class="grid gap-0.5"><span class="text-body">Prohibited or restricted item</span></span></label>
            <label for="mab-ex-rp-4" class="flex min-h-touch items-start gap-3 py-2.5"><input id="mab-ex-rp-4" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="mab-ex-rp-reason"><span class="grid gap-0.5"><span class="text-body">Misleading title, photos or price</span></span></label>
            <label for="mab-ex-rp-5" class="flex min-h-touch items-start gap-3 py-2.5"><input id="mab-ex-rp-5" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="mab-ex-rp-reason"><span class="grid gap-0.5"><span class="text-body">Contact details or off-platform payment</span></span></label>
            <label for="mab-ex-rp-6" class="flex min-h-touch items-start gap-3 py-2.5"><input id="mab-ex-rp-6" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="mab-ex-rp-reason"><span class="grid gap-0.5"><span class="text-body">Incomplete documents</span></span></label>
          </fieldset>
          <div class="grid gap-1.5">
            <div class="flex items-baseline justify-between gap-2">
              <label for="mab-ex-rp-note" class="text-label text-foreground">Message to seller</label>
            </div>
            <textarea id="mab-ex-rp-note" rows="3" class="field" placeholder="e.g. Remove the logo from photos 2 and 3." maxlength="1000" aria-describedby="mab-ex-rp-note-help mab-ex-rp-note-error mab-ex-rp-note-count" data-ds-counter="mab-ex-rp-note-count"></textarea>
            <div class="flex gap-2">
              <p id="mab-ex-rp-note-help" class="text-body-sm text-muted-foreground">Sent with the decision. Be specific about what to change.</p>
              <p id="mab-ex-rp-note-count" class="ml-auto shrink-0 text-body-sm text-muted-foreground tabular">0 / 1000</p>
            </div>
            <p id="mab-ex-rp-note-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
          </div>
          <label for="mab-ex-rp-int" class="flex min-h-touch items-start gap-3 py-2.5"><input id="mab-ex-rp-int" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary"><span class="grid gap-0.5"><span class="text-body">Add internal note only (not sent)</span></span></label>
        </div>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row sm:justify-end border-t border-border px-4 pt-3 pb-[calc(.75rem+env(safe-area-inset-bottom,0px))]">
        <button type="button" class="btn btn-neutral" data-ds-close><span>Cancel</span></button>
        <button type="button" class="btn btn-danger"><span>Reject listing</span></button>
      </div>
    </div>
  </dialog>
</div>
```

## 12. Test notes
- Menu items are 44px rows.
- Popover positions above the bar (fixed).
