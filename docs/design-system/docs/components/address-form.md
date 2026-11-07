# AddressForm (PH)

Forms · Phase 2 · Live sheet: `styleguide/components/address-form.html`

## 1. Purpose
Philippine address group: name, mobile, Region → Province → City/Municipality → Barangay, street, postal code, landmark, label, default.

**Use when**
- Checkout, address book, shop pickup address.

**Don't use when**
- International addresses.

## 2. Anatomy
1. Contact: full name, PhoneInput.
2. Cascade: Region (Select) → Province (Select) → City (Combobox) → Barangay (Combobox).
3. Street/building, 4-digit postal code, landmark (optional).
4. Label as Home/Work (chips), default checkbox.
5. Save (lg, full width on phone).

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Full | `addressForm()` | Checkout / address book. |
| With errors | `errors` | After submit. |

## 4. States
| State | Status |
|---|---|
| Default | n/a: See the live example above. |
| Hover (pointer only) | n/a: Per control. |
| Pressed | n/a: n/a |
| Focus-visible | n/a: Per control. |
| Disabled | n/a: Province/City/Barangay disabled until the parent is chosen. |
| Loading | n/a: Dependent lists show “Loading…”. |
| Error | rendered |
| Selected | n/a: n/a |
| Empty | n/a: New address: all empty except region default. |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Single column; Save full width. |
| Tablet (md, 768px+) | Two columns; street spans both. |
| Desktop (lg, 1024px+) | Same; inside a dialog or a 40rem panel. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| value | Address | — | {name, phone, region, province, city, barangay, street, postal, landmark, label, isDefault} |
| errors | object | {} | Field → message. |
| regions | loader | — | PSGC data source. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Native form control. |
| Accessible name | ``; required marked with a visible * and the native `required` attribute. |
| Keyboard | Native. |
| Focus management | On submit, focus the first invalid field; errors listed per field. |
| ARIA | `aria-describedby` links help and error text; `aria-invalid="true"` on error. |
| Touch target | Controls are 44px tall; checkboxes/radios sit in a 44px label row. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Errors are announced when focus lands on the field (described-by), not via live regions while typing. |

## 8. Tokens used
`--border`, `--border-control`, `--danger`, `--dur`, `--ease-out`, `--elevation-popover`, `--focus-ring-color`, `--focus-ring-error`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-input`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--r-field`, `--r-panel`, `--subtle-foreground`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--z-sheet`, `currentColor (icons)`

## 9. Content rules
- Use official PSGC names.
- Landmark helps riders; keep it optional.

## 10. Do / Don't
**Do**
- Reset children when a parent changes.

**Don't**
- Don’t free-type province/city/barangay.

## 11. HTML usage
```html
<form class="grid gap-4 md:grid-cols-2" data-ds-validate novalidate>
  <div class="grid gap-1.5">
    <div class="flex items-baseline justify-between gap-2">
      <label for="af-name" class="text-label text-foreground">Full name<span class="text-danger" aria-hidden="true"> *</span></label>
    </div>
    <input id="af-name" type="text" class="field" value="Maria Santos" required autocomplete="name" aria-describedby="af-name-error">
    <p id="af-name-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
  </div>
  <div class="grid gap-1.5">
    <div class="flex items-baseline justify-between gap-2">
      <label for="af-phone" class="text-label text-foreground">Mobile number<span class="text-danger" aria-hidden="true"> *</span></label>
    </div>
    <label for="af-phone" class="field focus-ring flex items-stretch p-0 cursor-text overflow-hidden"><span class="inline-flex items-center gap-1 border-r border-border-control bg-surface-muted px-3 text-input text-foreground select-none" aria-hidden="true">+63</span><input id="af-phone" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="9XX XXX XXXX" maxlength="12" class="min-w-0 flex-1 bg-transparent px-3 text-input text-foreground placeholder:text-subtle-foreground disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground" data-ds-phone value="917 123 4567" aria-describedby="af-phone-help af-phone-error"></label>
    <div class="flex gap-2">
      <p id="af-phone-help" class="text-body-sm text-muted-foreground">For delivery updates only.</p>
    </div>
    <p id="af-phone-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
  </div>
  <div class="grid gap-1.5">
    <div class="flex items-baseline justify-between gap-2">
      <label for="af-region" class="text-label text-foreground">Region<span class="text-danger" aria-hidden="true"> *</span></label>
    </div>
    <div class="relative">
      <select id="af-region" class="field" aria-describedby="af-region-error">
        <option selected>NCR (National Capital Region)</option>
        <option>Region III (Central Luzon)</option>
        <option>Region IV-A (CALABARZON)</option>
        <option>Region VII (Central Visayas)</option>
        <option>Region XI (Davao Region)</option>
      </select>
      <svg class="icon pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true"><use href="#i-chevron-down"/></svg>
    </div>
    <p id="af-region-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
  </div>
  <div class="grid gap-1.5">
    <div class="flex items-baseline justify-between gap-2">
      <label for="af-province" class="text-label text-foreground">Province<span class="text-danger" aria-hidden="true"> *</span></label>
    </div>
    <div class="relative">
      <select id="af-province" class="field" aria-describedby="af-province-error">
        <option selected>Metro Manila</option>
      </select>
      <svg class="icon pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true"><use href="#i-chevron-down"/></svg>
    </div>
    <p id="af-province-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
  </div>
  <div class="grid gap-1.5">
    <div class="flex items-baseline justify-between gap-2">
      <label for="af-city" class="text-label text-foreground">City / Municipality<span class="text-danger" aria-hidden="true"> *</span></label>
    </div>
    <div class="relative" data-ds-combobox><input id="af-city" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="af-city-list" autocomplete="off" value="Quezon City" class="field pr-10" required aria-describedby="af-city-error" data-ds-open-on-focus><svg class="icon pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true"><use href="#i-chevron-down"/></svg>
      <ul id="af-city-list" role="listbox" aria-label="City / Municipality" class="absolute inset-x-0 top-full z-sheet mt-1 max-h-64 overflow-auto rounded-panel border border-border bg-surface py-1 shadow-popover" hidden>
        <li id="af-city-opt-0" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Caloocan</li>
        <li id="af-city-opt-1" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Makati</li>
        <li id="af-city-opt-2" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Manila</li>
        <li id="af-city-opt-3" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Marikina</li>
        <li id="af-city-opt-4" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Pasig</li>
        <li id="af-city-opt-5" role="option" aria-selected="true" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Quezon City</li>
        <li id="af-city-opt-6" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Taguig</li>
      </ul>
      <p data-ds-empty hidden class="absolute inset-x-0 top-full z-sheet mt-1 rounded-panel border border-border bg-surface px-3 py-3 text-body text-muted-foreground shadow-popover">No matches</p>
      <p class="sr-only" aria-live="polite" data-ds-live></p>
    </div>
    <p id="af-city-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
  </div>
  <div class="grid gap-1.5">
    <div class="flex items-baseline justify-between gap-2">
      <label for="af-brgy" class="text-label text-foreground">Barangay<span class="text-danger" aria-hidden="true"> *</span></label>
    </div>
    <div class="relative" data-ds-combobox><input id="af-brgy" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="af-brgy-list" autocomplete="off" value="" class="field pr-10" required aria-describedby="af-brgy-error" data-ds-open-on-focus><svg class="icon pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true"><use href="#i-chevron-down"/></svg>
      <ul id="af-brgy-list" role="listbox" aria-label="Barangay" class="absolute inset-x-0 top-full z-sheet mt-1 max-h-64 overflow-auto rounded-panel border border-border bg-surface py-1 shadow-popover" hidden>
        <li id="af-brgy-opt-0" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Bagumbayan</li>
        <li id="af-brgy-opt-1" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Commonwealth</li>
        <li id="af-brgy-opt-2" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Diliman</li>
        <li id="af-brgy-opt-3" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Loyola Heights</li>
        <li id="af-brgy-opt-4" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Teachers Village East</li>
      </ul>
      <p data-ds-empty hidden class="absolute inset-x-0 top-full z-sheet mt-1 rounded-panel border border-border bg-surface px-3 py-3 text-body text-muted-foreground shadow-popover">No matches</p>
      <p class="sr-only" aria-live="polite" data-ds-live></p>
    </div>
    <p id="af-brgy-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
  </div>
  <div class="grid gap-1.5 md:col-span-2">
    <div class="flex items-baseline justify-between gap-2">
      <label for="af-street" class="text-label text-foreground">Street, building, house no.<span class="text-danger" aria-hidden="true"> *</span></label>
    </div>
    <input id="af-street" type="text" class="field" value="Unit 4B, 12 Maginhawa St." required autocomplete="address-line1" aria-describedby="af-street-error">
    <p id="af-street-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
  </div>
  <div class="grid gap-1.5">
    <div class="flex items-baseline justify-between gap-2">
      <label for="af-postal" class="text-label text-foreground">Postal code<span class="text-danger" aria-hidden="true"> *</span></label>
    </div>
    <input id="af-postal" type="text" class="field" value="1101" required inputmode="numeric" autocomplete="postal-code" maxlength="4" aria-describedby="af-postal-error">
    <p id="af-postal-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
  </div>
  <div class="grid gap-1.5">
    <div class="flex items-baseline justify-between gap-2">
      <label for="af-landmark" class="text-label text-foreground">Landmark <span class="font-normal text-muted-foreground">(optional)</span></label>
    </div>
    <input id="af-landmark" type="text" class="field" placeholder="e.g. beside the sari-sari store" aria-describedby="af-landmark-error">
    <p id="af-landmark-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
  </div>
  <fieldset class="md:col-span-2">
    <legend class="mb-1 text-label">Label as</legend>
    <div class="flex gap-2">
      <label class="flex min-h-touch cursor-pointer items-center gap-2 rounded-button border border-border-control px-4 text-label has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary-soft-foreground focus-ring"><input type="radio" name="af-label" class="sr-only" checked><svg class="icon size-4" aria-hidden="true"><use href="#i-house"/></svg>Home</label>
      <label class="flex min-h-touch cursor-pointer items-center gap-2 rounded-button border border-border-control px-4 text-label has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary-soft-foreground focus-ring"><input type="radio" name="af-label" class="sr-only"><svg class="icon size-4" aria-hidden="true"><use href="#i-building-2"/></svg>Work</label>
    </div>
  </fieldset>
  <label for="af-default" class="flex min-h-touch items-start gap-3 py-2.5 md:col-span-2"><input id="af-default" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary" checked><span class="grid gap-0.5"><span class="text-body">Set as default address</span></span></label>
  <div class="md:col-span-2">
    <button type="submit" class="btn btn-lg btn-block md:w-auto"><span>Save address</span></button>
  </div>
</form>
```

## 12. Test notes
- Submit with errors focuses mobile number first.
- Two columns at 768px, one at 360px.
