# Radio

Forms · Phase 2 · Live sheet: `styleguide/components/radio.html`

## 1. Purpose
One choice from a small set, all options visible (payment method, shipping option, report reason).

**Use when**
- 2–6 mutually exclusive options.

**Don't use when**
- Many options (Select).
- Toggle views (SegmentedControl).

## 2. Anatomy
1. `fieldset` + `legend`.
2. Native radio 20px in a 44px label row.
3. Optional description.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| List | `check({type:"radio"})` |  |
| Card | radio inside a card label (`has-[:checked]`) | Payment / shipping pickers (Phase 3). |

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
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Stacked. |
| Tablet (md, 768px+) | Stacked or 2 columns. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| name | string | — | Group name. |
| value | string | — |  |
| options | array | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Native radio group in a fieldset. |
| Accessible name | ``; required marked with a visible * and the native `required` attribute. |
| Keyboard | Tab into group, arrows move and select. |
| Focus management | On submit with errors, focus moves to the first invalid field. |
| ARIA | `aria-describedby` links help and error text; `aria-invalid="true"` on error. |
| Touch target | Controls are 44px tall; checkboxes/radios sit in a 44px label row. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Errors are announced when focus lands on the field (described-by), not via live regions while typing. |

## 8. Tokens used
`--danger`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-width`, `--fs-body`, `--fs-body-sm`, `--fs-label`, `--muted-foreground`, `--primary`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Options parallel in grammar; order by frequency.

## 10. Do / Don't
**Do**
- Pre-select a sensible default when safe (Standard shipping).

**Don't**
- Don’t pre-select report reasons.

## 11. HTML usage
```html
<fieldset class="grid">
  <legend class="mb-1 text-label">Reason for cancelling</legend>
  <label for="rd0" class="flex min-h-touch items-start gap-3 py-2.5"><input id="rd0" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="rd" checked><span class="grid gap-0.5"><span class="text-body">Need to change address</span></span></label>
  <label for="rd1" class="flex min-h-touch items-start gap-3 py-2.5"><input id="rd1" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="rd"><span class="grid gap-0.5"><span class="text-body">Found a better price</span></span></label>
  <label for="rd2" class="flex min-h-touch items-start gap-3 py-2.5"><input id="rd2" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="rd"><span class="grid gap-0.5"><span class="text-body">Changed my mind</span></span></label>
</fieldset>
```

## 12. Test notes
- Arrow keys move selection.
- Legend announced on entering the group.
