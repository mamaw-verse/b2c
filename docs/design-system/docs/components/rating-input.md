# RatingInput

Forms · Phase 2 · Live sheet: `styleguide/components/rating-input.html`

## 1. Purpose
1–5 star rating for reviews; native radios underneath.

**Use when**
- Review form, seller rating of buyer.

**Don't use when**
- Displaying a rating (Rating).

## 2. Anatomy
1. `fieldset` + legend.
2. 5 radio inputs (sr-only) with star labels (44px).
3. Painted stars up to the choice (`--rating`, decorative); sr-only “n stars”.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Large | default 36px stars | Review form. |
| Compact | `size: size-6` | Inline in order rows. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Pointer hover previews are optional in ports. |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | n/a: n/a |
| Error | rendered |
| Selected | rendered |
| Empty | n/a: Default is 0 (none selected). |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | 5 × 44px fits 360px. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| value | 0–5 | 0 |  |
| name | string | — |  |
| error | string | — | Required before submit. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Radio group. |
| Accessible name | Legend + “n stars”. |
| Keyboard | Arrow keys change the rating. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | Native. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Native radio announcements. |

## 8. Tokens used
`--border-control`, `--danger`, `--fs-body-sm`, `--fs-label`, `--r-button`, `--rating`, `--ring`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Optional hint under the stars: 1 “Very poor” … 5 “Excellent”.

## 10. Do / Don't
**Do**
- Keep stars 44px.

**Don't**
- Don’t use half-star input.

## 11. HTML usage
```html
<fieldset class="grid gap-1">
  <legend class="text-label">Rate this product</legend>
  <div class="flex" data-ds-rating><input type="radio" id="ri1-1" name="ri1" value="1" class="sr-only">
    <label for="ri1-1" class="grid min-h-touch min-w-touch place-items-center text-border-control data-[on]:text-rating [input:focus-visible+&]:outline-3 [input:focus-visible+&]:outline-ring [input:focus-visible+&]:rounded-button" data-on><svg class="icon size-9 fill-current" aria-hidden="true"><use href="#i-star"/></svg><span class="sr-only">1 star</span></label>
    <input type="radio" id="ri1-2" name="ri1" value="2" class="sr-only">
    <label for="ri1-2" class="grid min-h-touch min-w-touch place-items-center text-border-control data-[on]:text-rating [input:focus-visible+&]:outline-3 [input:focus-visible+&]:outline-ring [input:focus-visible+&]:rounded-button" data-on><svg class="icon size-9 fill-current" aria-hidden="true"><use href="#i-star"/></svg><span class="sr-only">2 stars</span></label>
    <input type="radio" id="ri1-3" name="ri1" value="3" class="sr-only">
    <label for="ri1-3" class="grid min-h-touch min-w-touch place-items-center text-border-control data-[on]:text-rating [input:focus-visible+&]:outline-3 [input:focus-visible+&]:outline-ring [input:focus-visible+&]:rounded-button" data-on><svg class="icon size-9 fill-current" aria-hidden="true"><use href="#i-star"/></svg><span class="sr-only">3 stars</span></label>
    <input type="radio" id="ri1-4" name="ri1" value="4" class="sr-only" checked>
    <label for="ri1-4" class="grid min-h-touch min-w-touch place-items-center text-border-control data-[on]:text-rating [input:focus-visible+&]:outline-3 [input:focus-visible+&]:outline-ring [input:focus-visible+&]:rounded-button" data-on><svg class="icon size-9 fill-current" aria-hidden="true"><use href="#i-star"/></svg><span class="sr-only">4 stars</span></label>
    <input type="radio" id="ri1-5" name="ri1" value="5" class="sr-only">
    <label for="ri1-5" class="grid min-h-touch min-w-touch place-items-center text-border-control data-[on]:text-rating [input:focus-visible+&]:outline-3 [input:focus-visible+&]:outline-ring [input:focus-visible+&]:rounded-button"><svg class="icon size-9 fill-current" aria-hidden="true"><use href="#i-star"/></svg><span class="sr-only">5 stars</span></label>
  </div>
</fieldset>
```

## 12. Test notes
- Arrow keys select; focus ring visible on the star.
