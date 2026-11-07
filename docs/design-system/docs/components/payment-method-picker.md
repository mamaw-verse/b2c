# PaymentMethodPicker

Commerce · Phase 3 · Live sheet: `styleguide/components/payment-method-picker.html`

## 1. Purpose
Choose e-wallet, card, online banking or Cash on Delivery.

**Use when**
- Checkout.

**Don't use when**
- Saved card management.

## 2. Anatomy
1. Fieldset + legend.
2. Radio cards: icon, method, providers/fee.
3. Error under group.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `paymentMethodPicker()` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: n/a |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: COD disabled above limit with reason. |
| Loading | n/a: n/a |
| Error | rendered |
| Selected | rendered |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Stacked. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| methods | {id, label, desc, icon, disabledReason}[] | — | Provider names come from config. |
| value | id | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Radio group. |
| Accessible name | — |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Error linked to fieldset. |

## 8. Tokens used
`--border`, `--danger`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-width`, `--foreground`, `--fs-body-sm`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-soft`, `--r-card`, `--r-tile`, `--surface`, `--surface-muted`, `--surface-subtle`, `--touch-primary`, `currentColor (icons)`

## 9. Content rules
- Fees shown up front (COD fee).

## 10. Do / Don't
**Do**
- Remember last method.

**Don't**
- Don’t pre-select COD when the user paid by wallet before.

## 11. HTML usage
```html
<fieldset class="grid gap-2">
  <legend class="mb-1 text-label">Payment method</legend>
  <div class="grid gap-2">
    <label for="pm1-0" class="flex min-h-touch-primary cursor-pointer items-center gap-3 rounded-card border border-border bg-surface p-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-surface-subtle focus-ring"><input type="radio" id="pm1-0" name="pm1" class="size-5 shrink-0 accent-primary" checked><span class="grid size-10 shrink-0 place-items-center rounded-tile bg-surface-muted text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-smartphone"/></svg></span><span class="grid min-w-0 flex-1 grid-cols-1 gap-0.5"><span class="text-label ">E-wallet</span><span class="text-body-sm text-muted-foreground">GCash, Maya</span></span></label>
    <label for="pm1-1" class="flex min-h-touch-primary cursor-pointer items-center gap-3 rounded-card border border-border bg-surface p-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-surface-subtle focus-ring"><input type="radio" id="pm1-1" name="pm1" class="size-5 shrink-0 accent-primary"><span class="grid size-10 shrink-0 place-items-center rounded-tile bg-surface-muted text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-credit-card"/></svg></span><span class="grid min-w-0 flex-1 grid-cols-1 gap-0.5"><span class="text-label ">Debit / credit card</span><span class="text-body-sm text-muted-foreground">Visa, Mastercard. Pay in full, no instalment plans.</span></span></label>
    <label for="pm1-2" class="flex min-h-touch-primary cursor-pointer items-center gap-3 rounded-card border border-border bg-surface p-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-surface-subtle focus-ring"><input type="radio" id="pm1-2" name="pm1" class="size-5 shrink-0 accent-primary"><span class="grid size-10 shrink-0 place-items-center rounded-tile bg-surface-muted text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-building-2"/></svg></span><span class="grid min-w-0 flex-1 grid-cols-1 gap-0.5"><span class="text-label ">Online banking</span><span class="text-body-sm text-muted-foreground">Instapay / PESONet partner banks</span></span></label>
    <label for="pm1-3" class="flex min-h-touch-primary cursor-pointer items-center gap-3 rounded-card border border-border bg-surface p-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-surface-subtle focus-ring"><input type="radio" id="pm1-3" name="pm1" class="size-5 shrink-0 accent-primary"><span class="grid size-10 shrink-0 place-items-center rounded-tile bg-surface-muted text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-banknote"/></svg></span><span class="grid min-w-0 flex-1 grid-cols-1 gap-0.5"><span class="text-label ">Cash on Delivery</span><span class="text-body-sm text-muted-foreground">Pay the rider in cash. ₱20 COD fee.</span></span></label>
  </div>
</fieldset>
```

## 12. Test notes
- Error focus on submit.
