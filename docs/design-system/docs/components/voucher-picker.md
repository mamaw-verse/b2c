# VoucherPicker

Commerce · Phase 3 · Live sheet: `styleguide/components/voucher-picker.html`

## 1. Purpose
Modal → sheet to apply shop/platform/shipping vouchers and codes at checkout.

**Use when**
- Checkout and cart voucher rows.

**Don't use when**
- Browsing vouchers (wallet page).

## 2. Anatomy
1. Code input + Apply.
2. Radio groups per voucher kind (one per kind).
3. Unavailable vouchers disabled with reason.
4. Footer: savings + Done.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `voucherPicker()` |  |

## 4. States
| State | Status |
|---|---|
| Default | n/a: See variants (frozen open dialog). |
| Hover (pointer only) | n/a: Cards. |
| Pressed | n/a: n/a |
| Focus-visible | n/a: Cards. |
| Disabled | n/a: Unavailable vouchers. |
| Loading | n/a: Apply button loading. |
| Error | rendered |
| Selected | n/a: Checked card. |
| Empty | n/a: EmptyState “No vouchers for this order”. |
| Skeleton | n/a: Card skeletons. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Bottom sheet. |
| Tablet (md, 768px+) | Modal. |
| Desktop (lg, 1024px+) | Modal. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| vouchers | Voucher[] | — |  |
| selected | map kind → id | — |  |
| onApplyCode | fn | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Dialog with radio groups. |
| Accessible name | Title. |
| Keyboard | — |
| Focus management | Code input not autofocused on phone (keyboard would cover list). |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Savings update polite in ports. |

## 8. Tokens used
`--border`, `--border-control`, `--border-outline`, `--brand-100`, `--brand-950`, `--danger`, `--dur`, `--ease-out`, `--elevation-sheet`, `--focus-ring-color`, `--focus-ring-error`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--fs-body-sm`, `--fs-caption`, `--fs-h3`, `--fs-input`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--r-button`, `--r-card`, `--r-field`, `--r-panel`, `--sale`, `--subtle-foreground`, `--success`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--z-modal`, `currentColor (icons)`

## 9. Content rules
- Error for codes: say why (expired, min spend).

## 10. Do / Don't
**Do**
- Pre-select the best voucher.

**Don't**
- Don’t hide unavailable vouchers.

## 11. HTML usage
```html
<button type="button" class="btn btn-outline" data-ds-open="vpk1"><svg class="icon" aria-hidden="true"><use href="#i-ticket"/></svg><span>Select vouchers</span></button>
<dialog id="vpk1" aria-labelledby="vpk1-title" class="z-modal bg-surface p-0 shadow-sheet transition-[translate,opacity,scale,display,overlay] transition-discrete duration-token mt-auto mb-0 w-full max-h-[90dvh] rounded-t-panel md:m-auto md:w-[min(32rem,calc(100vw-2rem))] md:rounded-panel md:max-h-[85dvh] starting:open:translate-y-full md:starting:open:translate-y-4 md:starting:open:opacity-0">
  <div class="flex max-h-[inherit] flex-col ">
    <div class="flex justify-center pt-2 md:hidden" data-ds-sheet-handle><span class="h-1.5 w-10 rounded-full bg-border-control" aria-hidden="true"></span></div>
    <div class="flex items-center gap-2 border-b border-border py-1 pl-4 pr-1 md:py-2">
      <h2 id="vpk1-title" class="flex-1 text-h3">Select vouchers</h2>
      <button type="button" class="btn btn-icon btn-ghost text-foreground" aria-label="Close" data-ds-close><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg></button>
    </div>
    <div class="overflow-y-auto overscroll-contain flex-1 p-4">
      <div class="grid gap-4">
        <div class="flex gap-2">
          <label for="vpk1-code" class="sr-only">Voucher code</label>
          <input id="vpk1-code" class="field" placeholder="Enter voucher code" autocomplete="off">
          <button type="button" class="btn btn-outline"><span>Apply</span></button>
        </div>
        <fieldset class="grid gap-2">
          <legend class="mb-1 text-label">Shop vouchers</legend>
          <label for="vpk1-v1" class="flex overflow-hidden rounded-card border bg-surface border-border-outline cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary-soft focus-ring">
            <div class="flex w-20 shrink-0 flex-col items-center justify-center gap-1 bg-primary text-primary-foreground p-2 text-center text-caption font-bold"><svg class="icon" aria-hidden="true"><use href="#i-store"/></svg><span class="line-clamp-2 break-words">Shop</span></div>
            <div class="relative grid min-w-0 flex-1 content-center gap-0.5 border-l-2 border-dashed border-border py-2 pl-3 pr-2">
              <p class="text-label">₱50 off</p>
              <p class="text-body-sm text-muted-foreground">Min. spend ₱500</p>
              <p class="flex items-center gap-1 text-caption text-muted-foreground"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-clock"/></svg>Valid till Nov 30</p>
            </div>
            <div class="flex shrink-0 items-center pr-3"><input type="radio" name="vpk1-v" id="vpk1-v1" class="size-5 accent-primary" checked></div>
          </label>
          <label for="vpk1-v2" class="flex overflow-hidden rounded-card border bg-surface border-border-outline cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary-soft focus-ring">
            <div class="flex w-20 shrink-0 flex-col items-center justify-center gap-1 bg-primary text-primary-foreground p-2 text-center text-caption font-bold"><svg class="icon" aria-hidden="true"><use href="#i-store"/></svg><span class="line-clamp-2 break-words">Shop</span></div>
            <div class="relative grid min-w-0 flex-1 content-center gap-0.5 border-l-2 border-dashed border-border py-2 pl-3 pr-2">
              <p class="text-label">10% off, up to ₱150</p>
              <p class="text-body-sm text-muted-foreground">Min. spend ₱800</p>
              <p class="flex items-center gap-1 text-caption text-muted-foreground"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-clock"/></svg>Valid till Nov 30</p>
            </div>
            <div class="flex shrink-0 items-center pr-3"><input type="radio" name="vpk1-v" id="vpk1-v2" class="size-5 accent-primary"></div>
          </label>
          <label for="vpk1-v3" class="flex overflow-hidden rounded-card border bg-surface border-border cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary-soft focus-ring">
            <div class="flex w-20 shrink-0 flex-col items-center justify-center gap-1 bg-surface-muted text-muted-foreground p-2 text-center text-caption font-bold"><svg class="icon" aria-hidden="true"><use href="#i-store"/></svg><span class="line-clamp-2 break-words">Shop</span></div>
            <div class="relative grid min-w-0 flex-1 content-center gap-0.5 border-l-2 border-dashed border-border py-2 pl-3 pr-2">
              <p class="text-label">₱200 off</p>
              <p class="text-body-sm text-muted-foreground">Min. spend ₱1,500</p>
              <p class="flex items-center gap-1 text-caption text-danger"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-circle-alert"/></svg>Spend ₱120 more to use</p>
            </div>
            <div class="flex shrink-0 items-center pr-3"><input type="radio" name="vpk1-v" id="vpk1-v3" class="size-5 accent-primary" disabled></div>
          </label>
        </fieldset>
        <fieldset class="grid gap-2">
          <legend class="mb-1 text-label">Free shipping</legend>
          <label for="vpk1-sv1" class="flex overflow-hidden rounded-card border bg-surface border-border-outline cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary-soft focus-ring">
            <div class="flex w-20 shrink-0 flex-col items-center justify-center gap-1 bg-success text-primary-foreground p-2 text-center text-caption font-bold"><svg class="icon" aria-hidden="true"><use href="#i-truck"/></svg><span class="line-clamp-2 break-words">Shipping</span></div>
            <div class="relative grid min-w-0 flex-1 content-center gap-0.5 border-l-2 border-dashed border-border py-2 pl-3 pr-2">
              <p class="text-label">Free shipping up to ₱80</p>
              <p class="text-body-sm text-muted-foreground">Min. spend ₱299</p>
              <p class="flex items-center gap-1 text-caption text-muted-foreground"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-clock"/></svg>Valid till Nov 30</p>
            </div>
            <div class="flex shrink-0 items-center pr-3"><input type="radio" name="vpk1-sv" id="vpk1-sv1" class="size-5 accent-primary" checked></div>
          </label>
        </fieldset>
      </div>
    </div>
    <div class="flex flex-col gap-2 sm:flex-row sm:justify-end border-t border-border px-4 pt-3 pb-[calc(.75rem+env(safe-area-inset-bottom,0px))]">
      <p class="flex-1 self-center text-body-sm text-muted-foreground">Saving <span class="font-bold text-sale">₱130</span></p>
      <button type="button" class="btn sm:min-w-32" data-ds-close><span>Done</span></button>
    </div>
  </div>
</dialog>
```

## 12. Test notes
- One selection per kind.
