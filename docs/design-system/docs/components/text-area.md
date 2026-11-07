# TextArea

Forms · Phase 2 · Live sheet: `styleguide/components/text-area.html`

## 1. Purpose
Multi-line text with optional character counter (reviews, product descriptions, report details).

**Use when**
- More than one sentence expected.

**Don't use when**
- Chat messages (ChatComposer auto-grows).

## 2. Anatomy
1. `.field` textarea, min 6rem tall, resizable vertically.
2. Counter “n / max” on the right of the help row, polite live region.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `textarea()` |  |
| With counter | `counter` + `maxlength` | Reviews (500), reports (1000). |

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
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Full width, 4 rows. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same; may sit in a two-column form. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| rows | number | 4 |  |
| maxlength | number | — | Enables counter. |
| value / placeholder | string |  |  |

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
| Announcements | Counter is `aria-live="polite"`; announced as the user pauses. |

## 8. Tokens used
`--border-control`, `--danger`, `--dur`, `--ease-out`, `--foreground`, `--fs-body-sm`, `--fs-input`, `--fs-label`, `--muted-foreground`, `--primary`, `--r-badge`, `--r-field`, `--subtle-foreground`, `--surface`, `--surface-muted`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Labels are nouns, sentence case, no colon: “Mobile number”.
- Help text says why or how (“For delivery updates only”), not what.
- Errors say how to fix: “Enter a 10-digit mobile number starting with 9”.
- Mark optional fields “(optional)” when most are required; mark required with * when most are optional.
- Counter shows used / max, not remaining.

## 10. Do / Don't
**Do**
- Allow vertical resize.

**Don't**
- Don’t block paste.
- Don’t silently truncate; `maxlength` + counter.

## 11. HTML usage
```html
<div class="grid gap-1.5">
  <div class="flex items-baseline justify-between gap-2">
    <label for="ta1" class="text-label text-foreground">Your review</label>
  </div>
  <textarea id="ta1" rows="4" class="field" maxlength="500" aria-describedby="ta1-help ta1-error ta1-count" data-ds-counter="ta1-count">Masarap at malambot! Arrived well packed, will order again.</textarea>
  <div class="flex gap-2">
    <p id="ta1-help" class="text-body-sm text-muted-foreground">Tell other buyers about quality and fit.</p>
    <p id="ta1-count" class="ml-auto shrink-0 text-body-sm text-muted-foreground tabular">58 / 500</p>
  </div>
  <p id="ta1-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
</div>
```

## 12. Test notes
- Counter updates and is announced.
- No horizontal overflow with long unbroken strings.
