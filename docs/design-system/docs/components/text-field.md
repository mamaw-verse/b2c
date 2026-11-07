# TextField

Forms · Phase 2 · Live sheet: `styleguide/components/text-field.html`

## 1. Purpose
Single-line text input with optional prefix/suffix (₱, unit, reveal password, clear).

**Use when**
- Short free text, numbers, email, password, money.

**Don't use when**
- Choosing from a known list (Select / Combobox).
- Multi-line text (TextArea).

## 2. Anatomy
1. `.field` input (44px, `--r-field`, `--border-control`).
2. Optional prefix (₱, icon) inside the left edge.
3. Optional suffix button (reveal password, clear).

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Text | `type=text` |  |
| Email / password | native types + `autocomplete` |  |
| Money | `prefix="₱"`, `inputmode=decimal` | Seller price fields. |
| With action | `suffix` icon button | Reveal password. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | rendered |
| Loading | rendered |
| Error | rendered |
| Selected | n/a: n/a |
| Empty | rendered |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Full width; 16px text (`--fs-input`) so iOS does not zoom. |
| Tablet (md, 768px+) | Same; 16px. |
| Desktop (lg, 1024px+) | 14px text only with `pointer:fine` (mouse); touch laptops keep 16px. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| type | string | `text` |  |
| value / placeholder | string |  |  |
| prefix / suffix | slot | — |  |
| inputmode / autocomplete | string | — | Always set for tel, email, numeric, address fields. |
| invalid | boolean | false | `aria-invalid`. |
| disabled / readonly | boolean | false |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Native form control. |
| Accessible name | ``; required marked with a visible * and the native `required` attribute. |
| Keyboard | Native. |
| Focus management | On submit with errors, focus moves to the first invalid field. |
| ARIA | `aria-invalid`, `aria-describedby`; reveal button uses `aria-pressed` and `aria-label="Show password"`. |
| Touch target | Controls are 44px tall; checkboxes/radios sit in a 44px label row. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Errors are announced when focus lands on the field (described-by), not via live regions while typing. |

## 8. Tokens used
`--border-control`, `--brand-100`, `--danger`, `--dur`, `--ease-out`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-input`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--r-badge`, `--r-button`, `--r-field`, `--ring`, `--subtle-foreground`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `currentColor (icons)`

## 9. Content rules
- Labels are nouns, sentence case, no colon: “Mobile number”.
- Help text says why or how (“For delivery updates only”), not what.
- Errors say how to fix: “Enter a 10-digit mobile number starting with 9”.
- Mark optional fields “(optional)” when most are required; mark required with * when most are optional.

## 10. Do / Don't
**Do**
- Set `inputmode` and `autocomplete` (phone keyboards).
- Use a prefix for ₱ instead of asking users to type it.

**Don't**
- Don’t use placeholder as the label.
- Don’t format numbers while the user is typing mid-value.

## 11. HTML usage
```html
<div class="grid gap-1.5">
  <div class="flex items-baseline justify-between gap-2">
    <label for="tf-price" class="text-label text-foreground">Price<span class="text-danger" aria-hidden="true"> *</span></label>
  </div>
  <div class="relative"><span class="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-muted-foreground">₱</span><input id="tf-price" type="text" class="field pl-12" value="1,250" inputmode="decimal" aria-describedby="tf-price-error"></div>
  <p id="tf-price-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
</div>
```

## 12. Test notes
- Font-size ≥ 16px at 360/768.
- Reveal toggles `type` and `aria-pressed`.
- Prefix does not overlap typed text.
