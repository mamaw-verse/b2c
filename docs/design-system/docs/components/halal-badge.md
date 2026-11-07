# HalalBadge

Halal · Phase 6 · Live sheet: `styleguide/components/halal-badge.html`

## 1. Purpose
One vocabulary for halal status across storefront, seller centre and moderation: certified, under review, expiring, expired, missing and Muslim-friendly (non-food, no certificate needed). Brand-independent colours (`--halal`).

**Use when**
- Product cards and lists (`short`, solid over photos).
- Product detail, cart and order lines (soft, with certifier in the facts strip).
- Seller listing status and moderation queue.

**Don't use when**
- Marketing claims. It only renders a status the platform has verified.
- Shop trust (use VerifiedBadge); the two never share an icon.
- Recolouring per brand. A certification mark must look the same everywhere.

## 2. Anatomy
1. Status icon (`moon-star` for certified).
2. Label: full (“Halal certified”) or `short` (“Halal”).
3. Screen-reader suffix names the certifier when `short`.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Certified | `status: certified` | Verified certificate, valid today. |
| Solid | `solid` | Over product photos (white on `--halal`). |
| Under review | `status: review` | Seller lists only; hidden from buyers. |
| Expiring / expired | `status: expiring \| expired` | Seller and admin; expired hides listings. |
| Muslim-friendly | `status: na` | Non-food: hijab, prayer mats, books. |
| Missing | `status: missing` | Moderation only. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Non-interactive. |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | n/a: n/a |
| Error | n/a: Use `status: expired` or `missing`. |
| Selected | n/a: n/a |
| Empty | n/a: Not rendered when a product is non-food and not Muslim-friendly tagged. |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | `short` label on cards; full label on detail pages. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same; certifier shown beside it in HalalFacts. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| status | `certified\|review\|expiring\|expired\|missing\|na` | `certified` | Drives icon, label and tone. |
| short | boolean | false | One-word label for dense cards. |
| solid | boolean | false | Over photos. |
| body | string | — | Certifier acronym. Read by screen readers when `short`. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Text with a decorative icon. |
| Accessible name | Label text; `short` adds a visually hidden “certified by X”. |
| Keyboard | Not focusable. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--brand-100`, `--brand-700`, `--danger`, `--danger-soft`, `--dur`, `--ease-out`, `--elevation-card-hover`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-price`, `--halal`, `--halal-soft`, `--muted-foreground`, `--primary-foreground`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-card`, `--r-tile`, `--rating`, `--ring`, `--sale`, `--success`, `--success-soft`, `--surface`, `--surface-muted`, `--warning`, `--warning-soft`, `currentColor (icons)`

## 9. Content rules
- “Halal certified” only after the platform has verified the certificate. Never “halal” from a seller claim alone.
- Say “Muslim-friendly”, not “halal”, for non-food items.

## 10. Do / Don't
**Do**
- Show the same status everywhere the product appears.
- Hide halal listings the day after the certificate expires.

**Don't**
- Don’t show a halal badge on seller-declared products awaiting review.
- Don’t use green alone: the icon and label carry the meaning.

## 11. HTML usage
```html
<div class="flex flex-wrap gap-2"><span class="badge badge-halal"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-moon-star"/></svg>Halal certified</span><span class="badge badge-warning"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-clock"/></svg>Certificate under review</span><span class="badge badge-warning"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-calendar-clock"/></svg>Certificate expires soon</span><span class="badge badge-danger"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-circle-alert"/></svg>Certificate expired</span><span class="badge badge-danger"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-file-badge"/></svg>No certificate</span><span class="badge badge-neutral"><svg class="icon size-3.5" aria-hidden="true"><use href="#i-hand-heart"/></svg>Muslim-friendly (no certificate needed)</span></div>
```

## 12. Test notes
- Contrast of `--halal` on `--halal-soft` and white on `--halal` in docs/contrast.md.
- Same colours in the default and demo brands.
- `short` badge still readable at 2 columns on 360px.
