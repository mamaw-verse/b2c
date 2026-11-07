# HalalCertificateCard

Halal · Phase 6 · Live sheet: `styleguide/components/halal-certificate-card.html`

## 1. Purpose
What the platform verified about a halal claim: who certified it, which number, until when, and what it covers. Buyer view on product detail; seller view in shop settings with a renewal action.

**Use when**
- Product detail, under the buy box or in its own section.
- Seller centre: shop and listing certificates.

**Don't use when**
- Listing text. This is verified data, not seller copy.

## 2. Anatomy
1. Header: icon tile, title, “checked by {brand} on {date}”, status badge.
2. Facts: certifying body, certificate no., valid until, coverage.
3. Inline banner when expiring or expired.
4. Actions: View certificate + Report a concern (buyer) or Upload renewal (seller).

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Certified | `status: certified` |  |
| Expiring | `status: expiring` | Seller sees a warning banner. |
| Expired | `status: expired` | Listings hidden. |
| Seller | `seller` | Renewal action replaces Report. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Buttons carry hover. |
| Pressed | n/a: Buttons carry pressed. |
| Focus-visible | n/a: Buttons carry focus. |
| Disabled | n/a: n/a |
| Loading | n/a: Skeleton of the four rows. |
| Error | rendered |
| Selected | n/a: n/a |
| Empty | n/a: Non-food products render no card. |
| Skeleton | n/a: Four label/value skeleton rows. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Full width, buttons share a row. |
| Tablet (md, 768px+) | Side by side with the seller declaration. |
| Desktop (lg, 1024px+) | Same; 2 columns beside the declaration. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| status | `certified\|expiring\|expired` | `certified` |  |
| body | string | — | Full certifier name. |
| no | string | — | Certificate number. |
| valid | date | — | Expiry. |
| scope | string | — | What the certificate covers. |
| seller | boolean | false | Seller-facing actions. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `section` named by its heading; facts in a `dl`. |
| Accessible name | “Halal certificate”. |
| Keyboard | Buttons only. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Expiry banners are static text, not live regions. |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--danger`, `--danger-soft`, `--dur`, `--ease-out`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-h4`, `--fs-label`, `--halal`, `--halal-soft`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--r-panel`, `--r-tile`, `--surface`, `--surface-muted`, `--touch-min`, `--warning`, `--warning-soft`, `currentColor (icons)`

## 9. Content rules
- Always show the certifier and the expiry date.
- Explain what a failed state means for the buyer or seller in one sentence.

## 10. Do / Don't
**Do**
- Link “View certificate” to the stored file, not the seller’s website.

**Don't**
- Don’t show certificate numbers to guests if your certifier’s terms forbid it.

## 11. HTML usage
```html
<section class="panel p-4" aria-labelledby="hc1-h">
  <div class="flex items-start gap-3"><span class="grid size-10 shrink-0 place-items-center rounded-tile bg-halal-soft text-halal"><svg class="icon" aria-hidden="true"><use href="#i-file-badge"/></svg></span>
    <div class="min-w-0 flex-1">
      <h2 id="hc1-h" class="text-h4">Halal certificate</h2>
      <p class="text-body-sm text-muted-foreground">Checked by {{BRAND_NAME}} on <time>Oct 28, 2026</time></p>
    </div>
    <span class="badge badge-halal"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-moon-star"/></svg>Halal<span class="sr-only"> certified</span></span>
  </div>
  <dl class="mt-3 grid gap-2 text-body-sm">
    <div class="grid grid-cols-[minmax(6.5rem,35%)_1fr] gap-3">
      <dt class="text-muted-foreground">Certifying body</dt>
      <dd class="text-foreground">Islamic Da’wah Council of the Philippines (IDCP)</dd>
    </div>
    <div class="grid grid-cols-[minmax(6.5rem,35%)_1fr] gap-3">
      <dt class="text-muted-foreground">Certificate no.</dt>
      <dd class="text-foreground"><span class="tabular">HC-2026-00481</span></dd>
    </div>
    <div class="grid grid-cols-[minmax(6.5rem,35%)_1fr] gap-3">
      <dt class="text-muted-foreground">Valid until</dt>
      <dd class="text-foreground"><span class="tabular">Mar 14, 2028</span></dd>
    </div>
    <div class="grid grid-cols-[minmax(6.5rem,35%)_1fr] gap-3">
      <dt class="text-muted-foreground">Covers</dt>
      <dd class="text-foreground">Product and packing facility, Taguig</dd>
    </div>
  </dl>
  <div class="mt-4 flex flex-wrap gap-2">
    <button type="button" class="btn btn-neutral flex-1 sm:flex-none"><span>View certificate</span><svg class="icon" aria-hidden="true"><use href="#i-external-link"/></svg></button>
    <button type="button" class="btn btn-ghost flex-1 sm:flex-none"><svg class="icon" aria-hidden="true"><use href="#i-flag"/></svg><span>Report a concern</span></button>
  </div>
</section>
```

## 12. Test notes
- Expired state shows the danger banner and the date in bold.
- Dates use ``.
- No horizontal scroll at 360px.
