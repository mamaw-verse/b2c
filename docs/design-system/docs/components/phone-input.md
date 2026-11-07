# PhoneInput

Forms · Phase 2 · Live sheet: `styleguide/components/phone-input.html`

## 1. Purpose
Philippine mobile number with fixed +63 prefix, formatted as 9XX XXX XXXX.

**Use when**
- Sign-up, address, delivery contact.

**Don't use when**
- International numbers (out of scope; PROPOSED later).

## 2. Anatomy
1. Static “+63” prefix (aria-hidden; help text says the format).
2. Input `type=tel`, `inputmode=numeric`, `autocomplete=tel-national`.
3. Help text with format; error text.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `phoneInput()` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | rendered |
| Loading | n/a: n/a |
| Error | rendered |
| Selected | n/a: n/a |
| Empty | rendered |
| Skeleton | n/a: Use field skeleton. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Numeric keypad; 16px. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| value | string |  | Store as E.164 `+639171234567`. |
| error | string | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Native form control. |
| Accessible name | ``; required marked with a visible * and the native `required` attribute. |
| Keyboard | Native. |
| Focus management | On submit with errors, focus moves to the first invalid field. |
| ARIA | Prefix is decorative; the help text states “+63”. Input describedby help + error. |
| Touch target | Controls are 44px tall; checkboxes/radios sit in a 44px label row. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Errors are announced when focus lands on the field (described-by), not via live regions while typing. |

## 8. Tokens used
`--border-control`, `--danger`, `--dur`, `--ease-out`, `--focus-ring-color`, `--focus-ring-error`, `--focus-ring-offset`, `--focus-ring-width`, `--foreground`, `--fs-body-sm`, `--fs-input`, `--fs-label`, `--muted-foreground`, `--r-field`, `--subtle-foreground`, `--surface`, `--surface-muted`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Accept 09…, 9…, +639… pastes and normalise.

## 10. Do / Don't
**Do**
- Normalise on input; store E.164.

**Don't**
- Don’t split into three inputs.

## 11. HTML usage
```html
<div class="grid gap-1.5">
  <div class="flex items-baseline justify-between gap-2">
    <label for="ph1" class="text-label text-foreground">Mobile number<span class="text-danger" aria-hidden="true"> *</span></label>
  </div>
  <label for="ph1" class="field focus-ring flex items-stretch p-0 cursor-text overflow-hidden"><span class="inline-flex items-center gap-1 border-r border-border-control bg-surface-muted px-3 text-input text-foreground select-none" aria-hidden="true">+63</span><input id="ph1" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="9XX XXX XXXX" maxlength="12" class="min-w-0 flex-1 bg-transparent px-3 text-input text-foreground placeholder:text-subtle-foreground disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground" data-ds-phone value="917 123 4567" aria-describedby="ph1-help ph1-error"></label>
  <div class="flex gap-2">
    <p id="ph1-help" class="text-body-sm text-muted-foreground">10 digits after +63, e.g. 917 123 4567.</p>
  </div>
  <p id="ph1-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
</div>
```

## 12. Test notes
- Paste “0917-123-4567” formats to “917 123 4567”.
