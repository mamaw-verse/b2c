# AddressCard & picker

Commerce · Phase 3 · Live sheet: `styleguide/components/address-card.html`

## 1. Purpose
Delivery address display at checkout and radio-card picker in the address book.

**Use when**
- Checkout top, address book, picker sheet.

**Don't use when**
- Editing (AddressForm).

## 2. Anatomy
1. Pin icon or radio.
2. Name + phone.
3. Address line.
4. Default + label badges.
5. Change link (display mode).

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Display | `addressCard()` | Checkout. |
| Selectable | `select` | Picker. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: n/a |
| Pressed | n/a: n/a |
| Focus-visible | n/a: Link / radio. |
| Disabled | n/a: n/a |
| Loading | n/a: n/a |
| Error | rendered |
| Selected | rendered |
| Empty | rendered |
| Skeleton | n/a: Card skeleton. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Edge-to-edge strip at the top of checkout. |
| Tablet (md, 768px+) | Panel. |
| Desktop (lg, 1024px+) | Panel. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| address | Address | — |  |
| select | boolean | false |  |
| onChange | fn | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Text / radio group. |
| Accessible name | Radio label = full card. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | Whole card. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--brand-100`, `--danger`, `--danger-soft`, `--dur`, `--ease-out`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--r-card`, `--r-panel`, `--sale`, `--surface`, `--surface-muted`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Phone formatted +63 917 123 4567.

## 10. Do / Don't
**Do**
- Mark default.

**Don't**
- Don’t truncate the address.

## 11. HTML usage
```html
<div class="flex gap-3 bg-surface p-gutter md:rounded-panel md:border md:border-border md:p-4"><svg class="icon mt-0.5 text-sale" aria-hidden="true"><use href="#i-map-pin"/></svg>
  <div class="grid min-w-0 flex-1 grid-cols-1 gap-0.5">
    <p class="flex flex-wrap items-center gap-x-2 gap-y-1"><span class="text-label">Maria Santos</span><span class="text-body-sm text-muted-foreground tabular">+63 917 123 4567</span></p>
    <p class="text-body text-muted-foreground">Unit 4B, 12 Bagong Silang St., Maharlika Village, Taguig, Metro Manila 1630</p>
    <p class="mt-1 flex gap-1.5"><span class="badge">Default</span><span class="badge badge-neutral">Home</span></p>
  </div>
  <a href="#" class="inline-flex min-h-touch items-center self-center text-label text-primary">Change<svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-right"/></svg></a>
</div>
```

## 12. Test notes
- Long Visayas/Mindanao addresses wrap.
