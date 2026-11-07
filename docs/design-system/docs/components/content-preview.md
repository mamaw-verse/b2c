# ContentPreview (slots)

Moderation · Phase 4 · Live sheet: `styleguide/components/content-preview.html`

## 1. Purpose
The reported content rendered read-only: product listing, review, or chat excerpt with context only.

**Use when**
- ModerationDetailPane.

**Don't use when**
- Editable previews.

## 2. Anatomy
1. Product: photos, title, price, seller + flags highlighted.
2. Review: rating, text, masked PII, order ref.
3. Chat: excerpt around the flagged message (outlined), earlier/later hidden, PII masked.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Product | `previewProduct()` |  |
| Review | `previewReview()` |  |
| Chat excerpt | `previewChat()` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: n/a |
| Pressed | n/a: n/a |
| Focus-visible | n/a: Links inside (seller profile). |
| Disabled | n/a: n/a |
| Loading | n/a: Panel skeleton. |
| Error | n/a: “Content no longer available” (deleted items still show the snapshot). |
| Selected | n/a: n/a |
| Empty | n/a: Snapshot fallback. |
| Skeleton | n/a: Panel skeleton. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Stacked; photos in a 3-up row. |
| Tablet (md, 768px+) | Product: media column + details. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| kind | product\|review\|chat | — |  |
| snapshot | object | — | Immutable snapshot. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Read-only content; flagged parts use ``. |
| Accessible name | Section heading “Reported content”. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--background`, `--border`, `--border-strong`, `--brand-100`, `--brand-700`, `--danger`, `--danger-soft`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-h4`, `--fs-price`, `--info`, `--info-soft`, `--mod-flagged`, `--mod-flagged-bg`, `--muted-foreground`, `--primary`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-panel`, `--r-tile`, `--rating`, `--sale`, `--sale-soft`, `--surface`, `currentColor (icons)`

## 9. Content rules
- Mask PII (phone, account numbers) — show that it was removed.
- Context only: never expose full conversations.

## 10. Do / Don't
**Do**
- Highlight the flagged terms.

**Don't**
- Don’t deep-link to a live listing that may have changed.

## 11. HTML usage
```html
<div class="grid gap-4">
  <div class="grid gap-3">
    <ul class="flex gap-2" aria-label="Listing photos">
      <li class="w-16 shrink-0 overflow-hidden rounded-tile">
        <div class="grid w-full place-items-center overflow-hidden aspect-square bg-brand-100 text-brand-700" role="img" aria-label="Listing photo 1"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-beef"/></svg></div>
      </li>
      <li class="w-16 shrink-0 overflow-hidden rounded-tile">
        <div class="grid w-full place-items-center overflow-hidden aspect-square bg-info-soft text-info" role="img" aria-label="Listing photo 2"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-beef"/></svg></div>
      </li>
      <li class="w-16 shrink-0 overflow-hidden rounded-tile">
        <div class="grid w-full place-items-center overflow-hidden aspect-square bg-sale-soft text-sale" role="img" aria-label="Listing photo 3"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-beef"/></svg></div>
      </li>
    </ul>
    <div class="grid content-start gap-2">
      <p class="text-h4">Longganisa 500g “100% halal”, no certificate attached</p>
      <p class="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5"><span data-price class="text-price text-foreground">₱189</span></p>
      <p class="text-body-sm text-muted-foreground">Seller: <a href="#" class="font-bold text-primary underline">Pantry Direct PH</a> · joined 12 days ago · 3 prior warnings</p>
      <p class="rounded-tile bg-mod-flagged-bg p-2 text-body-sm text-mod-flagged"><mark class="bg-transparent font-bold text-mod-flagged">“100% halal”</mark> claimed in the title. <mark class="bg-transparent font-bold text-mod-flagged">“pork fat”</mark> found in the ingredient list.</p>
      <dl class="grid gap-1 text-body-sm">
        <div class="grid grid-cols-[7rem_1fr] gap-3">
          <dt class="text-muted-foreground">Halal status</dt>
          <dd><span class="badge badge-danger"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-file-badge"/></svg>No certificate</span></dd>
        </div>
        <div class="grid grid-cols-[7rem_1fr] gap-3">
          <dt class="text-muted-foreground">Ingredients</dt>
          <dd class="text-foreground">Chicken, <mark class="rounded-badge bg-mod-flagged-bg px-1 font-bold text-mod-flagged">pork fat</mark>, salt, garlic, vinegar</dd>
        </div>
      </dl>
    </div>
  </div>
  <div class="grid gap-2"><span class="inline-flex items-center gap-1" role="img" aria-label="Rated 1 out of 5"><span class="inline-flex" aria-hidden="true"><svg class="icon size-4 text-rating fill-current stroke-0" aria-hidden="true"><use href="#i-star"/></svg><svg class="icon size-4 text-border-strong fill-current stroke-0" aria-hidden="true"><use href="#i-star"/></svg><svg class="icon size-4 text-border-strong fill-current stroke-0" aria-hidden="true"><use href="#i-star"/></svg><svg class="icon size-4 text-border-strong fill-current stroke-0" aria-hidden="true"><use href="#i-star"/></svg><svg class="icon size-4 text-border-strong fill-current stroke-0" aria-hidden="true"><use href="#i-star"/></svg></span><span class="text-body-sm font-bold text-foreground tabular" aria-hidden="true">1.0</span></span>
    <p class="text-body">Fake seller!! <mark class="rounded-badge bg-mod-flagged-bg px-1 text-mod-flagged">[phone number removed]</mark> text me for cheaper price.</p>
    <p class="text-body-sm text-muted-foreground">by a*****n · Order #240311-0021 · Oct 30</p>
  </div>
  <div class="grid gap-2 rounded-panel bg-background p-3">
    <p class="text-center text-caption text-muted-foreground">2 earlier messages hidden · context only</p>
    <ol class="grid gap-2" aria-label="Chat excerpt">
      <li class="max-w-[85%] rounded-panel border border-border bg-surface px-3 py-2 text-body"><span class="sr-only">Buyer: </span>Magkano po shipping to Davao?</li>
      <li class="ml-auto max-w-[85%] rounded-panel border-2 border-mod-flagged bg-mod-flagged-bg px-3 py-2 text-body text-foreground"><span class="mb-1 flex items-center gap-1 text-caption font-bold text-mod-flagged"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-flag"/></svg>Reported message</span><span class="sr-only">Seller: </span>Para mas mura, send na lang po sa account ko <mark class="rounded-badge bg-surface px-1 text-foreground">[account no. masked]</mark>, then cancel the order.</li>
      <li class="max-w-[85%] rounded-panel border border-border bg-surface px-3 py-2 text-body"><span class="sr-only">Buyer: </span>Safe po ba yun?</li>
    </ol>
    <p class="text-center text-caption text-muted-foreground">Later messages hidden</p>
  </div>
</div>
```

## 12. Test notes
- `--mod-flagged` text on `--mod-flagged-bg` ≥ 4.5:1 both brands.
