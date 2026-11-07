# QuantityStepper

Forms · Phase 2 · Live sheet: `styleguide/components/quantity-stepper.html`

## 1. Purpose
Change a quantity with − / + or by typing (cart item, variation sheet).

**Use when**
- Small integer quantities with min/max (stock).

**Don't use when**
- Large ranges or decimals (TextField).

## 2. Anatomy
1. Group with label.
2. − button (disabled at min).
3. Numeric input (`inputmode=numeric`).
4. + button (disabled at max/stock).
5. Polite live region “Quantity 3”.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default (44px) | `stepper()` | Variation sheet, cart rows. One size: the input itself is a touch target, so there is no 36px variant. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | rendered |
| Focus-visible | rendered |
| Disabled | rendered |
| Loading | n/a: Disable while the cart line updates. |
| Error | rendered |
| Selected | n/a: n/a |
| Empty | n/a: Minimum is 1; remove via the delete action. |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | 44px buttons and input. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| value | number | 1 |  |
| min / max | number | 1 / 99 | Max = stock. |
| label | string | “Quantity” |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `group` labelled “Quantity”; native buttons + text input. |
| Accessible name | “Decrease quantity” / “Increase quantity”. |
| Keyboard | Tab to buttons; type in the input. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | Disabled buttons at bounds. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | “Quantity 3” after each step (polite). |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--danger`, `--dur`, `--ease-out`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--fs-body-sm`, `--fs-input`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--r-button`, `--r-field`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `currentColor (icons)`

## 9. Content rules
- Show stock hint next to it: “Only 5 left”.

## 10. Do / Don't
**Do**
- Clamp typed values to min/max on change.

**Don't**
- Don’t remove the item when going below 1; use a delete action.

## 11. HTML usage
```html
<div class="focus-ring inline-flex items-stretch overflow-hidden rounded-field border border-border-control bg-surface" data-ds-stepper role="group" aria-label="Quantity">
  <button type="button" class="btn btn-ghost btn-icon rounded-none border-0 text-foreground hover:bg-surface-muted active:bg-border disabled:text-muted-foreground" data-ds-step="-1" aria-label="Decrease quantity"><svg class="icon size-4" aria-hidden="true"><use href="#i-minus"/></svg></button>
  <label for="qs1" class="sr-only">Quantity</label>
  <input id="qs1" type="text" inputmode="numeric" pattern="[0-9]*" value="2" min="1" max="5" class="w-12 border-x border-border-control bg-transparent text-center text-input font-bold tabular">
  <button type="button" class="btn btn-ghost btn-icon rounded-none border-0 text-foreground hover:bg-surface-muted active:bg-border disabled:text-muted-foreground" data-ds-step="1" aria-label="Increase quantity"><svg class="icon size-4" aria-hidden="true"><use href="#i-plus"/></svg></button>
  <p class="sr-only" aria-live="polite" data-ds-live></p>
</div>
```

## 12. Test notes
- Buttons disable at bounds.
- Announcement after step.
