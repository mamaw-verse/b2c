# FormField

Forms · Phase 2 · Live sheet: `styleguide/components/form-field.html`

## 1. Purpose
Wrapper that gives every control a label, optional help, an error slot and a required/optional marker, wired with `aria-describedby`.

**Use when**
- Every text-like control (TextField, TextArea, Select, Combobox, PhoneInput).

**Don't use when**
- Checkbox/Radio groups: use `fieldset` + `legend`.
- Search in the header (label is visually hidden instead).

## 2. Anatomy
1. Label (`text-label`), with * or “(optional)”.
2. Optional label action (e.g. “Forgot password?”).
3. Control.
4. Help text (`text-body-sm`, muted) and optional counter.
5. Error text (`--danger`, icon + message), `hidden` until invalid.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `formField({...})` | Most fields. |
| Required | `required` | Visible * (aria-hidden) + native required. |
| Optional | `optional` | “(optional)” in muted text. |
| With counter | `counter` | Text with a max length (reviews, listing titles). |
| Hidden label | `hideLabel` | Only when an icon/placeholder makes the purpose obvious (search). |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: Fields have no pressed state. |
| Focus-visible | rendered |
| Disabled | rendered |
| Loading | n/a: Async validation shows a spinner suffix in TextField. |
| Error | rendered |
| Selected | n/a: n/a |
| Empty | rendered |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Single column; label above control. |
| Tablet (md, 768px+) | Two-column grids allowed for short fields (postal code + city). |
| Desktop (lg, 1024px+) | Same as tablet; max form width ~40rem for long forms. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| id | string | — | Required; derives `-help`, `-error`, `-count` ids. |
| label | string | — | Required. |
| required / optional | boolean | false |  |
| help | string | — |  |
| error | string | — | Shows error, sets `aria-invalid` on the control. |
| counter | string | — | e.g. “0 / 120”. |
| hideLabel | boolean | false | Label stays for AT. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Native form control. |
| Accessible name | ``; required marked with a visible * and the native `required` attribute. |
| Keyboard | Native. |
| Focus management | On submit with errors, focus moves to the first invalid field. |
| ARIA | `aria-describedby` links help and error text; `aria-invalid="true"` on error. |
| Touch target | Controls are 44px tall; checkboxes/radios sit in a 44px label row. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Errors are announced when focus lands on the field (described-by), not via live regions while typing. |

## 8. Tokens used
`--border-control`, `--danger`, `--dur`, `--ease-out`, `--focus-ring-color`, `--focus-ring-error`, `--focus-ring-offset`, `--focus-ring-width`, `--foreground`, `--fs-body-sm`, `--fs-input`, `--fs-label`, `--muted-foreground`, `--primary`, `--r-badge`, `--r-field`, `--subtle-foreground`, `--surface`, `--surface-muted`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Labels are nouns, sentence case, no colon: “Mobile number”.
- Help text says why or how (“For delivery updates only”), not what.
- Errors say how to fix: “Enter a 10-digit mobile number starting with 9”.
- Mark optional fields “(optional)” when most are required; mark required with * when most are optional.

## 10. Do / Don't
**Do**
- Keep the label visible; placeholders are examples, not labels.
- Show errors after blur or submit, not on every keystroke.

**Don't**
- Don’t use red text alone; the icon + message carry the error.
- Don’t disable submit to signal errors.

## 11. HTML usage
```html
<div class="grid gap-1.5">
  <div class="flex items-baseline justify-between gap-2">
    <label for="ff-email" class="text-label text-foreground">Email<span class="text-danger" aria-hidden="true"> *</span></label>
  </div>
  <input id="ff-email" type="email" class="field" value="maria@example.com" autocomplete="email" aria-describedby="ff-email-help ff-email-error">
  <div class="flex gap-2">
    <p id="ff-email-help" class="text-body-sm text-muted-foreground">We send the receipt here.</p>
  </div>
  <p id="ff-email-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
</div>
```

## 12. Test notes
- `label` rule passes; describedby ids exist.
- Error text is announced when the field is focused (NVDA/VoiceOver).
- 16px input text at 360 and 768.
