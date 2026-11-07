# Select

Forms · Phase 2 · Live sheet: `styleguide/components/select.html`

## 1. Purpose
Native single choice from a short list (region, province, sort order).

**Use when**
- 5–15 known options, no search needed.

**Don't use when**
- >15 options (use Combobox).
- 2–4 options (use Radio or SegmentedControl).

## 2. Anatomy
1. Native ``, `appearance-none`.
2. Chevron icon (decorative, pointer-events none).

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `select()` |  |
| With placeholder | `placeholder` | Forces an explicit choice. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: Native picker opens. |
| Focus-visible | rendered |
| Disabled | rendered |
| Loading | n/a: Disable with “Loading…” option while dependent options load. |
| Error | rendered |
| Selected | n/a: Native. |
| Empty | rendered |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Native picker (wheel on iOS, sheet on Android). |
| Tablet (md, 768px+) | Native. |
| Desktop (lg, 1024px+) | Native dropdown. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| options | string[] \| {value,label}[] | — |  |
| value | string |  |  |
| placeholder | string | — | Empty first option. |

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
`--border-control`, `--danger`, `--dur`, `--ease-out`, `--focus-ring-color`, `--focus-ring-error`, `--foreground`, `--fs-body-sm`, `--fs-input`, `--fs-label`, `--muted-foreground`, `--r-badge`, `--r-field`, `--subtle-foreground`, `--surface`, `--surface-muted`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Labels are nouns, sentence case, no colon: “Mobile number”.
- Help text says why or how (“For delivery updates only”), not what.
- Errors say how to fix: “Enter a 10-digit mobile number starting with 9”.
- Mark optional fields “(optional)” when most are required; mark required with * when most are optional.

## 10. Do / Don't
**Do**
- Prefer native select on phone; it is the most usable picker.

**Don't**
- Don’t build a custom listbox for short lists.

## 11. HTML usage
```html
<div class="grid gap-1.5">
  <div class="flex items-baseline justify-between gap-2">
    <label for="sel1" class="text-label text-foreground">Region<span class="text-danger" aria-hidden="true"> *</span></label>
  </div>
  <div class="relative">
    <select id="sel1" class="field" aria-describedby="sel1-error">
      <option value="">Select region</option>
      <option>NCR</option>
      <option>CALABARZON</option>
      <option>Central Luzon</option>
      <option>Central Visayas</option>
      <option>Davao Region</option>
    </select>
    <svg class="icon pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true"><use href="#i-chevron-down"/></svg>
  </div>
  <p id="sel1-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
</div>
```

## 12. Test notes
- Chevron does not intercept clicks.
- 16px text on phone.
