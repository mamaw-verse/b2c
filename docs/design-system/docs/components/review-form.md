# ReviewForm

Commerce · Phase 3 · Live sheet: `styleguide/components/review-form.html`

## 1. Purpose
Rate a completed order item: stars, text, photos, anonymous.

**Use when**
- After “Order received”.

**Don't use when**
- Shop rating (separate, PROPOSED).

## 2. Anatomy
1. Product summary.
2. RatingInput (required).
3. TextArea with counter.
4. ImageUploader (max 5).
5. Anonymous checkbox.
6. Submit (lg).

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `reviewForm()` |  |

## 4. States
| State | Status |
|---|---|
| Default | n/a: See example. |
| Hover (pointer only) | n/a: Controls. |
| Pressed | n/a: n/a |
| Focus-visible | n/a: Controls. |
| Disabled | n/a: n/a |
| Loading | n/a: Submit loading. |
| Error | rendered |
| Selected | n/a: n/a |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Full page or sheet; Submit full width. |
| Tablet (md, 768px+) | Modal. |
| Desktop (lg, 1024px+) | Modal or page column. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| item | OrderItem | — |  |
| onSubmit | fn | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | — |
| Accessible name | — |
| Keyboard | — |
| Focus management | Submit with errors focuses the rating group. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--brand-700`, `--danger`, `--dur`, `--ease-out`, `--elevation-popover`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-input`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--r-button`, `--r-field`, `--r-tile`, `--rating`, `--ring`, `--subtle-foreground`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `currentColor (icons)`

## 9. Content rules
- Encourage detail without pressure.

## 10. Do / Don't
**Do**
- Save draft locally.

**Don't**
- Don’t require text.

## 11. HTML usage
```html
<form class="grid gap-5" data-ds-validate novalidate>
  <div class="flex gap-3">
    <div class="w-16 shrink-0 overflow-hidden rounded-tile">
      <div class="grid w-full place-items-center overflow-hidden aspect-square bg-brand-100 text-brand-700" aria-hidden="true"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-package"/></svg></div>
    </div>
    <div>
      <p class="line-clamp-2 text-body">Ajwa dates 500g, premium grade</p>
      <p class="text-body-sm text-muted-foreground">Variation: Premium, 500g</p>
    </div>
  </div>
  <fieldset class="grid gap-1">
    <legend class="text-label">Product quality</legend>
    <div class="flex" data-ds-rating><input type="radio" id="rv1-stars-1" name="rv1-stars" value="1" class="sr-only">
      <label for="rv1-stars-1" class="grid min-h-touch min-w-touch place-items-center text-border-control data-[on]:text-rating [input:focus-visible+&]:outline-3 [input:focus-visible+&]:outline-ring [input:focus-visible+&]:rounded-button"><svg class="icon size-9 fill-current" aria-hidden="true"><use href="#i-star"/></svg><span class="sr-only">1 star</span></label>
      <input type="radio" id="rv1-stars-2" name="rv1-stars" value="2" class="sr-only">
      <label for="rv1-stars-2" class="grid min-h-touch min-w-touch place-items-center text-border-control data-[on]:text-rating [input:focus-visible+&]:outline-3 [input:focus-visible+&]:outline-ring [input:focus-visible+&]:rounded-button"><svg class="icon size-9 fill-current" aria-hidden="true"><use href="#i-star"/></svg><span class="sr-only">2 stars</span></label>
      <input type="radio" id="rv1-stars-3" name="rv1-stars" value="3" class="sr-only">
      <label for="rv1-stars-3" class="grid min-h-touch min-w-touch place-items-center text-border-control data-[on]:text-rating [input:focus-visible+&]:outline-3 [input:focus-visible+&]:outline-ring [input:focus-visible+&]:rounded-button"><svg class="icon size-9 fill-current" aria-hidden="true"><use href="#i-star"/></svg><span class="sr-only">3 stars</span></label>
      <input type="radio" id="rv1-stars-4" name="rv1-stars" value="4" class="sr-only">
      <label for="rv1-stars-4" class="grid min-h-touch min-w-touch place-items-center text-border-control data-[on]:text-rating [input:focus-visible+&]:outline-3 [input:focus-visible+&]:outline-ring [input:focus-visible+&]:rounded-button"><svg class="icon size-9 fill-current" aria-hidden="true"><use href="#i-star"/></svg><span class="sr-only">4 stars</span></label>
      <input type="radio" id="rv1-stars-5" name="rv1-stars" value="5" class="sr-only">
      <label for="rv1-stars-5" class="grid min-h-touch min-w-touch place-items-center text-border-control data-[on]:text-rating [input:focus-visible+&]:outline-3 [input:focus-visible+&]:outline-ring [input:focus-visible+&]:rounded-button"><svg class="icon size-9 fill-current" aria-hidden="true"><use href="#i-star"/></svg><span class="sr-only">5 stars</span></label>
    </div>
  </fieldset>
  <div class="grid gap-1.5">
    <div class="flex items-baseline justify-between gap-2">
      <label for="rv1-text" class="text-label text-foreground">Your review <span class="font-normal text-muted-foreground">(optional)</span></label>
    </div>
    <textarea id="rv1-text" rows="4" class="field" placeholder="What did you like? How was the fit, taste, quality?" maxlength="500" aria-describedby="rv1-text-help rv1-text-error rv1-text-count" data-ds-counter="rv1-text-count"></textarea>
    <div class="flex gap-2">
      <p id="rv1-text-help" class="text-body-sm text-muted-foreground">At least 20 characters earns coins.</p>
      <p id="rv1-text-count" class="ml-auto shrink-0 text-body-sm text-muted-foreground tabular">0 / 500</p>
    </div>
    <p id="rv1-text-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
  </div>
  <div class="grid gap-2" data-ds-uploader>
    <div class="flex items-baseline justify-between">
      <p id="rv1-photos-label" class="text-label">Add photos</p>
      <p class="text-body-sm text-muted-foreground tabular">0 / 5</p>
    </div>
    <ul class="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-2" data-ds-tiles aria-labelledby="rv1-photos-label">
      <li data-ds-add>
        <label for="rv1-photos" class="grid aspect-square cursor-pointer place-items-center rounded-tile border-2 border-dashed border-border-control bg-surface text-center text-body-sm font-bold text-primary hover:bg-primary-soft has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring"><span><svg class="icon mx-auto size-6" aria-hidden="true"><use href="#i-image-plus"/></svg>Add photo</span></label>
        <input id="rv1-photos" type="file" accept="image/*" multiple class="sr-only">
      </li>
    </ul>
    <template>
      <li class="relative" data-name="">
        <div class="relative aspect-square overflow-hidden rounded-tile border border-border bg-surface-muted"><img alt="" class="size-full object-cover"></div>
        <button type="button" class="btn btn-icon btn-neutral btn-sm absolute right-0 top-0 rounded-full border-transparent text-danger shadow-popover" data-ds-remove aria-label="Remove "><svg class="icon size-4" aria-hidden="true"><use href="#i-x"/></svg></button>
        <div class="mt-1 flex justify-between">
          <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="-1" aria-label="Move earlier"><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-left"/></svg></button>
          <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="1" aria-label="Move later"><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-right"/></svg></button>
        </div>
      </li>
    </template>
    <p class="sr-only" aria-live="polite" data-ds-live></p>
  </div>
  <label for="rv1-anon" class="flex min-h-touch items-start gap-3 py-2.5"><input id="rv1-anon" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary" aria-describedby="rv1-anon-desc"><span class="grid gap-0.5"><span class="text-body">Post anonymously</span><span id="rv1-anon-desc" class="text-body-sm text-muted-foreground">Your name shows as a*****z.</span></span></label>
  <button type="submit" class="btn btn-lg btn-block md:w-auto"><span>Submit review</span></button>
</form>
```

## 12. Test notes
- Upload + submit by keyboard.
