# ReasonPicker

Moderation · Phase 4 · Live sheet: `styleguide/components/reason-picker.html`

## 1. Purpose
Decision reason: template radios + free text to the seller. Required when rejecting.

**Use when**
- Reject / request-changes / warn dialogs.

**Don't use when**
- Approve (no reason needed).

## 2. Anatomy
1. Template radios (single choice).
2. “Message to seller” textarea (counter, sent verbatim).
3. “Internal note only” checkbox.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Reject | required |  |
| Request changes | optional note |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Fields. |
| Pressed | n/a: n/a |
| Focus-visible | n/a: Radio group. |
| Disabled | n/a: n/a |
| Loading | n/a: n/a |
| Error | rendered |
| Selected | rendered |
| Empty | n/a: At least one template is always shown. |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Same at all sizes. |
| Tablet (md, 768px+) |  |
| Desktop (lg, 1024px+) |  |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| templates | string[] | — |  |
| required | boolean | action-dependent |  |
| noteLabel | string | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Radiogroup (fieldset/legend). |
| Accessible name | Group label states the requirement. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | Required radio + error summary on the group. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Error asserted on submit. |

## 8. Tokens used
`--border-control`, `--danger`, `--dur`, `--ease-out`, `--focus-ring-color`, `--focus-ring-error`, `--focus-ring-offset`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-input`, `--fs-label`, `--muted-foreground`, `--primary`, `--r-field`, `--subtle-foreground`, `--surface`, `--surface-muted`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Templates are configurable per queue type; message ≥ 20 chars when required.

## 10. Do / Don't
**Do**
- Send the message to the seller verbatim.

**Don't**
- Don’t auto-pick a template.

## 11. HTML usage
```html
<div class="grid gap-4">
  <fieldset class="grid">
    <legend class="mb-1 text-label">Reason (required)</legend>
    <label for="rp-ex-0" class="flex min-h-touch items-start gap-3 py-2.5"><input id="rp-ex-0" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="rp-ex-reason" required><span class="grid gap-0.5"><span class="text-body">Halal claim not supported by a valid certificate</span></span></label>
    <label for="rp-ex-1" class="flex min-h-touch items-start gap-3 py-2.5"><input id="rp-ex-1" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="rp-ex-reason"><span class="grid gap-0.5"><span class="text-body">Certifier is not recognised or certificate is expired</span></span></label>
    <label for="rp-ex-2" class="flex min-h-touch items-start gap-3 py-2.5"><input id="rp-ex-2" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="rp-ex-reason"><span class="grid gap-0.5"><span class="text-body">Ingredients conflict with the halal claim</span></span></label>
    <label for="rp-ex-3" class="flex min-h-touch items-start gap-3 py-2.5"><input id="rp-ex-3" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="rp-ex-reason"><span class="grid gap-0.5"><span class="text-body">Prohibited or restricted item</span></span></label>
    <label for="rp-ex-4" class="flex min-h-touch items-start gap-3 py-2.5"><input id="rp-ex-4" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="rp-ex-reason"><span class="grid gap-0.5"><span class="text-body">Misleading title, photos or price</span></span></label>
    <label for="rp-ex-5" class="flex min-h-touch items-start gap-3 py-2.5"><input id="rp-ex-5" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="rp-ex-reason"><span class="grid gap-0.5"><span class="text-body">Contact details or off-platform payment</span></span></label>
    <label for="rp-ex-6" class="flex min-h-touch items-start gap-3 py-2.5"><input id="rp-ex-6" type="radio" class="mt-0.5 size-5 shrink-0 accent-primary" name="rp-ex-reason"><span class="grid gap-0.5"><span class="text-body">Incomplete documents</span></span></label>
  </fieldset>
  <div class="grid gap-1.5">
    <div class="flex items-baseline justify-between gap-2">
      <label for="rp-ex-note" class="text-label text-foreground">Message to seller</label>
    </div>
    <textarea id="rp-ex-note" rows="3" class="field" placeholder="e.g. Remove the logo from photos 2 and 3." maxlength="1000" aria-describedby="rp-ex-note-help rp-ex-note-error rp-ex-note-count" data-ds-counter="rp-ex-note-count"></textarea>
    <div class="flex gap-2">
      <p id="rp-ex-note-help" class="text-body-sm text-muted-foreground">Sent with the decision. Be specific about what to change.</p>
      <p id="rp-ex-note-count" class="ml-auto shrink-0 text-body-sm text-muted-foreground tabular">0 / 1000</p>
    </div>
    <p id="rp-ex-note-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
  </div>
  <label for="rp-ex-int" class="flex min-h-touch items-start gap-3 py-2.5"><input id="rp-ex-int" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary"><span class="grid gap-0.5"><span class="text-body">Add internal note only (not sent)</span></span></label>
</div>
```

## 12. Test notes
- Submit without a reason → group error + focus.
