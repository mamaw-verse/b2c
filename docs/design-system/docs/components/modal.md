# Modal → BottomSheet

Overlays · Phase 2 · Live sheet: `styleguide/components/modal.html`

## 1. Purpose
One dialog component that is a bottom sheet on phone and a centered modal from `md:` up. Native `` + `showModal()`.

**Use when**
- Short focused tasks: filters, add address, voucher picker, report.

**Don't use when**
- Long multi-step flows (use a page).
- Confirmations (ConfirmDialog stays centered).

## 2. Anatomy
1. `` (top layer, backdrop `--brand-950` @55%).
2. Handle (phone only, drag to dismiss).
3. Header: title (`aria-labelledby`) + Close.
4. Scrollable body (`overscroll-contain`).
5. Footer with safe-area padding; primary last.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Responsive (default) | `dialog({kind:"responsive"})` | Sheet < 768px, modal ≥ 768px. |
| Modal only | `kind: "modal"` | Desktop-first admin tools. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Children. |
| Pressed | n/a: Children. |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | rendered |
| Error | n/a: Banner inside the body; dialog stays open. |
| Selected | n/a: n/a |
| Empty | n/a: EmptyState inside the body. |
| Skeleton | n/a: See Loading. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Bottom sheet: full width, rounded top, max 90dvh, handle; swipe down or tap backdrop to close. |
| Tablet (md, 768px+) | Centered modal 32rem wide, max 85dvh. |
| Desktop (lg, 1024px+) | Same as tablet. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| open | boolean | false |  |
| title | string | — | Required. |
| kind | `responsive` \| `modal` \| `sheet` | `responsive` |  |
| footer | slot | — |  |
| initialFocus | selector | first field or Close |  |
| onClose(reason) | fn | — | `backdrop` \| `swipe` \| `escape` \| button value |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Native modal `` (implicit `dialog` role). |
| Accessible name | `aria-labelledby` the title. |
| Keyboard | Escape closes; Tab is trapped (page inert). |
| Focus management | Moves into the dialog on open (autofocus or first control); returns to the opener on close. |
| ARIA | Handle is decorative; Close button is the accessible dismiss. |
| Touch target | Close 44px; footer buttons 44px. |
| Reduced motion | Slide/fade removed under reduced motion (durations 1ms). |
| Announcements | Title announced on open. |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--brand-950`, `--dur`, `--ease-out`, `--elevation-sheet`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-h3`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--r-button`, `--r-card`, `--r-panel`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--z-modal`, `currentColor (icons)`

## 9. Content rules
- Title = task (“Filters”, “Add address”).
- Primary button states the result (“Show 248 results”).

## 10. Do / Don't
**Do**
- Keep body scrollable, header/footer fixed.
- Lock page scroll while open (base.css `:has(dialog:modal)`).

**Don't**
- Don’t nest dialogs.
- Don’t open on page load.

## 11. HTML usage
```html
<button type="button" class="btn btn-neutral" data-ds-open="md1"><svg class="icon" aria-hidden="true"><use href="#i-sliders-horizontal"/></svg><span>Filters</span></button>
<dialog id="md1" aria-labelledby="md1-title" class="z-modal bg-surface p-0 shadow-sheet transition-[translate,opacity,scale,display,overlay] transition-discrete duration-token mt-auto mb-0 w-full max-h-[90dvh] rounded-t-panel md:m-auto md:w-[min(32rem,calc(100vw-2rem))] md:rounded-panel md:max-h-[85dvh] starting:open:translate-y-full md:starting:open:translate-y-4 md:starting:open:opacity-0">
  <div class="flex max-h-[inherit] flex-col ">
    <div class="flex justify-center pt-2 md:hidden" data-ds-sheet-handle><span class="h-1.5 w-10 rounded-full bg-border-control" aria-hidden="true"></span></div>
    <div class="flex items-center gap-2 border-b border-border py-1 pl-4 pr-1 md:py-2">
      <h2 id="md1-title" class="flex-1 text-h3">Filters</h2>
      <button type="button" class="btn btn-icon btn-ghost text-foreground" aria-label="Close" data-ds-close><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg></button>
    </div>
    <div class="overflow-y-auto overscroll-contain flex-1 p-4">
      <fieldset class="grid">
        <legend class="mb-1 text-label">Shipped from</legend>
        <label for="fl0" class="flex min-h-touch items-start gap-3 py-2.5"><input id="fl0" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary" checked><span class="grid gap-0.5"><span class="text-body">Metro Manila</span></span></label>
        <label for="fl1" class="flex min-h-touch items-start gap-3 py-2.5"><input id="fl1" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary"><span class="grid gap-0.5"><span class="text-body">Cebu</span></span></label>
        <label for="fl2" class="flex min-h-touch items-start gap-3 py-2.5"><input id="fl2" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary"><span class="grid gap-0.5"><span class="text-body">Davao</span></span></label>
        <label for="fl3" class="flex min-h-touch items-start gap-3 py-2.5"><input id="fl3" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary"><span class="grid gap-0.5"><span class="text-body">Overseas</span></span></label>
      </fieldset>
    </div>
    <div class="flex flex-col gap-2 sm:flex-row sm:justify-end border-t border-border px-4 pt-3 pb-[calc(.75rem+env(safe-area-inset-bottom,0px))]">
      <button type="button" class="btn btn-neutral sm:w-auto"><span>Reset</span></button>
      <button type="button" class="btn" data-ds-close><span>Show 248 results</span></button>
    </div>
  </div>
</dialog>
```

## 12. Test notes
- Focus moves in and returns (verify.mjs checks).
- Page does not scroll behind.
- Sheet respects bottom safe area.
