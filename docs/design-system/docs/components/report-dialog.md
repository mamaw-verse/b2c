# ReportDialog

Chat & notifications · Phase 3 · Live sheet: `styleguide/components/report-dialog.html`

## 1. Purpose
Report a listing, review, chat, user or shop: reason (required), details, evidence. Feeds the admin moderation queue.

**Use when**
- “Report” in menus across storefront and chat.

**Don't use when**
- Order disputes (Return/Refund flow).

## 2. Anatomy
1. Responsive dialog (sheet on phone).
2. Reason radio group (required).
3. Details TextArea (optional, counter).
4. Evidence uploader.
5. Privacy note.
6. Footer: Cancel + Submit report (danger).

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Listing | default reasons |  |
| Chat / user / review | reason set per target | Same component. |

## 4. States
| State | Status |
|---|---|
| Default | n/a: See variants. |
| Hover (pointer only) | n/a: Controls. |
| Pressed | n/a: n/a |
| Focus-visible | n/a: Controls. |
| Disabled | n/a: n/a |
| Loading | n/a: Submit loading. |
| Error | rendered |
| Selected | n/a: n/a |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Bottom sheet. |
| Tablet (md, 768px+) | Modal. |
| Desktop (lg, 1024px+) | Modal. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| target | {type, id} | — |  |
| reasons | string[] | per type |  |
| onSubmit | fn | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Dialog with form. |
| Accessible name | — |
| Keyboard | — |
| Focus management | Submit with no reason focuses the group; after success, dialog closes and a Toast confirms (“Thanks, we’ll review this”). |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Toast. |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--brand-950`, `--danger`, `--danger-hover`, `--danger-pressed`, `--dur`, `--ease-out`, `--elevation-popover`, `--elevation-sheet`, `--focus-ring-color`, `--focus-ring-error`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-h3`, `--fs-input`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--r-button`, `--r-field`, `--r-panel`, `--r-tile`, `--subtle-foreground`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--z-modal`, `currentColor (icons)`

## 9. Content rules
- Reasons are concrete.
- Reassure about anonymity.

## 10. Do / Don't
**Do**
- Require a reason.

**Don't**
- Don’t ask for personal data.

## 11. HTML usage
```html
<button type="button" class="btn btn-ghost" data-ds-open="rd1"><svg class="icon" aria-hidden="true"><use href="#i-flag"/></svg><span>Report listing</span></button>
<dialog id="rd1" aria-labelledby="rd1-title" class="z-modal bg-surface p-0 shadow-sheet transition-[translate,opacity,scale,display,overlay] transition-discrete duration-token mt-auto mb-0 w-full max-h-[90dvh] rounded-t-panel md:m-auto md:w-[min(32rem,calc(100vw-2rem))] md:rounded-panel md:max-h-[85dvh] starting:open:translate-y-full md:starting:open:translate-y-4 md:starting:open:opacity-0">
  <div class="flex max-h-[inherit] flex-col ">
    <div class="flex justify-center pt-2 md:hidden" data-ds-sheet-handle><span class="h-1.5 w-10 rounded-full bg-border-control" aria-hidden="true"></span></div>
    <div class="flex items-center gap-2 border-b border-border py-1 pl-4 pr-1 md:py-2">
      <h2 id="rd1-title" class="flex-1 text-h3">Report listing</h2>
      <button type="button" class="btn btn-icon btn-ghost text-foreground" aria-label="Close" data-ds-close><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg></button>
    </div>
    <div class="overflow-y-auto overscroll-contain flex-1 p-4">
      <form class="grid gap-4" id="rd1-form" data-ds-validate novalidate>
        <fieldset class="grid">
          <legend class="mb-1 text-label">Why are you reporting this listing?</legend>
          <label for="rd1-r0" class="flex min-h-touch items-start gap-3 py-2.5"><input id="rd1-r0" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="rd1-reason" required><span class="grid gap-0.5"><span class="text-body">Halal claim conflicts with ingredients</span></span></label>
          <label for="rd1-r1" class="flex min-h-touch items-start gap-3 py-2.5"><input id="rd1-r1" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="rd1-reason"><span class="grid gap-0.5"><span class="text-body">Prohibited item</span></span></label>
          <label for="rd1-r2" class="flex min-h-touch items-start gap-3 py-2.5"><input id="rd1-r2" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="rd1-reason"><span class="grid gap-0.5"><span class="text-body">Misleading description or price</span></span></label>
          <label for="rd1-r3" class="flex min-h-touch items-start gap-3 py-2.5"><input id="rd1-r3" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="rd1-reason"><span class="grid gap-0.5"><span class="text-body">Offensive content</span></span></label>
          <label for="rd1-r4" class="flex min-h-touch items-start gap-3 py-2.5"><input id="rd1-r4" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="rd1-reason"><span class="grid gap-0.5"><span class="text-body">Scam or asks to pay outside the app</span></span></label>
          <label for="rd1-r5" class="flex min-h-touch items-start gap-3 py-2.5"><input id="rd1-r5" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="rd1-reason"><span class="grid gap-0.5"><span class="text-body">Other</span></span></label>
        </fieldset>
        <div class="grid gap-1.5">
          <div class="flex items-baseline justify-between gap-2">
            <label for="rd1-d" class="text-label text-foreground">Details <span class="font-normal text-muted-foreground">(optional)</span></label>
          </div>
          <textarea id="rd1-d" rows="3" class="field" maxlength="1000" aria-describedby="rd1-d-help rd1-d-error rd1-d-count" data-ds-counter="rd1-d-count"></textarea>
          <div class="flex gap-2">
            <p id="rd1-d-help" class="text-body-sm text-muted-foreground">What should our team look at?</p>
            <p id="rd1-d-count" class="ml-auto shrink-0 text-body-sm text-muted-foreground tabular">0 / 1000</p>
          </div>
          <p id="rd1-d-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
        </div>
        <div class="grid gap-2" data-ds-uploader>
          <div class="flex items-baseline justify-between">
            <p id="rd1-ev-label" class="text-label">Evidence</p>
            <p class="text-body-sm text-muted-foreground tabular">0 / 5</p>
          </div>
          <p class="text-body-sm text-muted-foreground">Screenshots help us act faster.</p>
          <ul class="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-2" data-ds-tiles aria-labelledby="rd1-ev-label">
            <li data-ds-add>
              <label for="rd1-ev" class="grid aspect-square cursor-pointer place-items-center rounded-tile border-2 border-dashed border-border-control bg-surface text-center text-body-sm font-bold text-primary hover:bg-primary-soft focus-ring"><span><svg class="icon mx-auto size-6" aria-hidden="true"><use href="#i-image-plus"/></svg>Add photo</span></label>
              <input id="rd1-ev" type="file" accept="image/*" multiple class="sr-only">
            </li>
          </ul>
          <template>
            <li class="relative" data-name="">
              <div class="relative aspect-square overflow-hidden rounded-tile border border-border bg-surface-muted"><img alt="" class="size-full object-cover"></div>
              <button type="button" class="btn btn-icon btn-neutral btn-sm absolute right-0 top-0 rounded-full border-transparent text-danger shadow-popover" data-ds-remove aria-label="Remove "><svg class="icon size-4" aria-hidden="true"><use href="#i-x"/></svg></button>
              <div class="mt-1 flex justify-between">
                <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="-1" aria-label="Move earlier"><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-left"/></svg></button>
                <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="1" aria-label="Move later"><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-right"/></svg></button>
              </div>
            </li>
          </template>
          <p class="sr-only" aria-live="polite" data-ds-live></p>
        </div>
        <p class="text-body-sm text-muted-foreground">The seller won’t know who reported. False reports may limit your account.</p>
      </form>
    </div>
    <div class="flex flex-col gap-2 sm:flex-row sm:justify-end border-t border-border px-4 pt-3 pb-[calc(.75rem+env(safe-area-inset-bottom,0px))]">
      <button type="button" class="btn btn-neutral" data-ds-close><span>Cancel</span></button>
      <button type="submit" class="btn btn-danger" form="rd1-form"><span>Submit report</span></button>
    </div>
  </div>
</dialog>
```

## 12. Test notes
- Required reason enforced; focus moves to the group.
