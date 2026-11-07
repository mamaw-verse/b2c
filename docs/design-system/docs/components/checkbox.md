# Checkbox

Forms · Phase 2 · Live sheet: `styleguide/components/checkbox.html`

## 1. Purpose
Independent on/off choices and multi-select (cart items, filters, bulk select).

**Use when**
- Multiple selections; consent.

**Don't use when**
- Single exclusive choice (Radio).
- Instant settings (Switch).

## 2. Anatomy
1. Native checkbox 20px, `accent-color: var(--primary)`.
2. Label text (+ optional description) inside a 44px tall ``.
3. Group: `fieldset` + `legend`.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Single | `check()` |  |
| With description | `desc` |  |
| Indeterminate | `indeterminate` | “Select all” in cart / tables. |
| Group | `fieldset()` | Filters. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: Native. |
| Focus-visible | rendered |
| Disabled | rendered |
| Loading | n/a: n/a |
| Error | rendered |
| Selected | rendered |
| Empty | n/a: n/a |
| Skeleton | n/a: Skeleton line. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | 44px rows. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| checked / indeterminate | boolean | false |  |
| label / desc | string | — |  |
| disabled / invalid | boolean | false |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Native checkbox. |
| Accessible name | Wrapping ``. |
| Keyboard | Space toggles. |
| Focus management | On submit with errors, focus moves to the first invalid field. |
| ARIA | `aria-describedby` links help and error text; `aria-invalid="true"` on error. |
| Touch target | Controls are 44px tall; checkboxes/radios sit in a 44px label row. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Errors are announced when focus lands on the field (described-by), not via live regions while typing. |

## 8. Tokens used
`--danger`, `--fs-body`, `--fs-body-sm`, `--fs-label`, `--muted-foreground`, `--primary`, `--ring`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Positive phrasing: “Send me order updates”, not “Don’t send…”.

## 10. Do / Don't
**Do**
- Make the whole row clickable.

**Don't**
- Don’t pre-check marketing consent.

## 11. HTML usage
```html
<fieldset class="grid">
  <legend class="mb-1 text-label">Shipping options</legend>
  <label for="cb-a" class="flex min-h-touch items-start gap-3 py-2.5"><input id="cb-a" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary" checked><span class="grid gap-0.5"><span class="text-body">Standard Delivery</span></span></label>
  <label for="cb-b" class="flex min-h-touch items-start gap-3 py-2.5"><input id="cb-b" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary" aria-describedby="cb-b-desc"><span class="grid gap-0.5"><span class="text-body">Same-day (Metro Manila)</span><span id="cb-b-desc" class="text-body-sm text-muted-foreground">Order before 12 nn.</span></span></label>
  <label for="cb-c" class="flex min-h-touch items-start gap-3 py-2.5"><input id="cb-c" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary"><span class="grid gap-0.5"><span class="text-body">Cash on Delivery available</span></span></label>
</fieldset>
```

## 12. Test notes
- Indeterminate state exposed as “mixed”.
- Row height ≥ 44px.
