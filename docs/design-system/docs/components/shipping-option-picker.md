# ShippingOptionPicker

Commerce · Phase 3 · Live sheet: `styleguide/components/shipping-option-picker.html`

## 1. Purpose
Choose delivery speed per shop: name, ETA, fee; unavailable options disabled with reason.

**Use when**
- Checkout per shop group.

**Don't use when**
- Seller shipping settings.

## 2. Anatomy
1. Fieldset + legend.
2. Radio cards: icon, title, ETA, fee.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `shippingOptionPicker()` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: n/a |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: Shown in default (“Same-day: not available for this address”). |
| Loading | n/a: Skeleton cards while rates load. |
| Error | n/a: Banner “Couldn’t get shipping rates. Retry.” |
| Selected | rendered |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Stacked cards. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| options | {id, name, eta, fee, disabledReason}[] | — |  |
| value | id | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Radio group. |
| Accessible name | — |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 48px cards. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-width`, `--foreground`, `--fs-body-sm`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-soft`, `--r-card`, `--r-tile`, `--surface`, `--surface-muted`, `--surface-subtle`, `--touch-primary`, `currentColor (icons)`

## 9. Content rules
- ETA as a date range “Nov 4 – Nov 6”.

## 10. Do / Don't
**Do**
- Show fee per option.

**Don't**
- Don’t hide unavailable options.

## 11. HTML usage
```html
<fieldset class="grid gap-2">
  <legend class="mb-1 text-label">Shipping option</legend>
  <div class="grid gap-2">
    <label for="sp1-0" class="flex min-h-touch-primary cursor-pointer items-center gap-3 rounded-card border border-border bg-surface p-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-surface-subtle focus-ring"><input type="radio" id="sp1-0" name="sp1" class="size-5 shrink-0 accent-primary" checked><span class="grid size-10 shrink-0 place-items-center rounded-tile bg-surface-muted text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-truck"/></svg></span><span class="grid min-w-0 flex-1 grid-cols-1 gap-0.5"><span class="text-label ">Standard Delivery</span><span class="text-body-sm text-muted-foreground">Receive by Nov 4 – Nov 6</span></span><span class="shrink-0 text-label tabular">₱80</span></label>
    <label for="sp1-1" class="flex min-h-touch-primary cursor-pointer items-center gap-3 rounded-card border border-border bg-surface p-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-surface-subtle focus-ring"><input type="radio" id="sp1-1" name="sp1" class="size-5 shrink-0 accent-primary"><span class="grid size-10 shrink-0 place-items-center rounded-tile bg-surface-muted text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-clock"/></svg></span><span class="grid min-w-0 flex-1 grid-cols-1 gap-0.5"><span class="text-label ">Express (Metro Manila)</span><span class="text-body-sm text-muted-foreground">Receive tomorrow if ordered before 2 PM</span></span><span class="shrink-0 text-label tabular">₱150</span></label>
    <label for="sp1-2" class="flex min-h-touch-primary cursor-pointer items-center gap-3 rounded-card border border-border bg-surface p-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-surface-subtle focus-ring"><input type="radio" id="sp1-2" name="sp1" class="size-5 shrink-0 accent-primary" disabled><span class="grid size-10 shrink-0 place-items-center rounded-tile bg-surface-muted text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-package"/></svg></span><span class="grid min-w-0 flex-1 grid-cols-1 gap-0.5"><span class="text-label text-muted-foreground">Same-day</span><span class="text-body-sm text-muted-foreground">Not available for this address</span></span><span class="shrink-0 text-label tabular">₱220</span></label>
  </div>
</fieldset>
```

## 12. Test notes
- Disabled option skipped by arrows.
