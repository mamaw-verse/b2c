# HalalVerificationChecklist

Halal · Phase 6 · Live sheet: `styleguide/components/halal-verification-checklist.html`

## 1. Purpose
Reviewer checklist for halal checks in the moderation console. Each line is pass, fail or “needs a manual check”, with a one-line reason that goes into the audit log.

**Use when**
- Moderation detail pane for listings, seller applications and certificate renewals.

**Don't use when**
- Buyer-facing UI.

## 2. Anatomy
1. Status icon (colour + shape).
2. Question the reviewer can defend.
3. Evidence line.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Pass | `pass` |  |
| Fail | `fail` |  |
| Unknown | `unknown` | Registry unavailable: check manually. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: n/a |
| Pressed | n/a: n/a |
| Focus-visible | n/a: n/a |
| Disabled | n/a: n/a |
| Loading | n/a: Skeleton rows. |
| Error | n/a: Fail lines. |
| Selected | n/a: n/a |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Stacked. |
| Tablet (md, 768px+) | Stacked. |
| Desktop (lg, 1024px+) | Stacked in the detail pane. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| items | `[question, pass\|fail\|unknown, note][]` | default set |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `ul` labelled “Halal verification checklist”. |
| Accessible name | Each line starts with a visually hidden result. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--danger`, `--fs-body`, `--fs-body-sm`, `--muted-foreground`, `--success`, `--warning`, `currentColor (icons)`

## 9. Content rules
- Questions are yes/no. Notes cite evidence, not opinion.

## 10. Do / Don't
**Do**
- Require a reason when rejecting on a failed line.

**Don't**
- Don’t auto-approve when a line is “needs a manual check”.

## 11. HTML usage
```html
<ul class="grid gap-3" aria-label="Halal verification checklist">
  <li class="grid grid-cols-[1.5rem_1fr] gap-x-3"><span class="text-danger mt-0.5"><svg class="icon" aria-hidden="true"><use href="#i-circle-alert"/></svg></span>
    <div class="grid gap-0.5">
      <p class="text-body"><span class="sr-only">Failed: </span>Certifier is on the current accredited list</p>
      <p class="text-body-sm text-muted-foreground">Certifier “Mindanao Halal Council” is not recognised.</p>
    </div>
  </li>
  <li class="grid grid-cols-[1.5rem_1fr] gap-x-3"><span class="text-warning mt-0.5"><svg class="icon" aria-hidden="true"><use href="#i-circle-help"/></svg></span>
    <div class="grid gap-0.5">
      <p class="text-body"><span class="sr-only">Needs a manual check: </span>Certificate number matches the certifier’s registry</p>
      <p class="text-body-sm text-muted-foreground">Registry lookup unavailable. Check manually.</p>
    </div>
  </li>
  <li class="grid grid-cols-[1.5rem_1fr] gap-x-3"><span class="text-success mt-0.5"><svg class="icon" aria-hidden="true"><use href="#i-circle-check"/></svg></span>
    <div class="grid gap-0.5">
      <p class="text-body"><span class="sr-only">Passed: </span>Certificate is valid today</p>
      <p class="text-body-sm text-muted-foreground">Valid until Mar 14, 2028.</p>
    </div>
  </li>
  <li class="grid grid-cols-[1.5rem_1fr] gap-x-3"><span class="text-danger mt-0.5"><svg class="icon" aria-hidden="true"><use href="#i-circle-alert"/></svg></span>
    <div class="grid gap-0.5">
      <p class="text-body"><span class="sr-only">Failed: </span>Certificate covers this product</p>
      <p class="text-body-sm text-muted-foreground">Scope lists “beef products”; the listing is chicken.</p>
    </div>
  </li>
  <li class="grid grid-cols-[1.5rem_1fr] gap-x-3"><span class="text-danger mt-0.5"><svg class="icon" aria-hidden="true"><use href="#i-circle-alert"/></svg></span>
    <div class="grid gap-0.5">
      <p class="text-body"><span class="sr-only">Failed: </span>Ingredients contain no pork, alcohol or their derivatives</p>
      <p class="text-body-sm text-muted-foreground">“Pork fat” found in the ingredient list.</p>
    </div>
  </li>
</ul>
```

## 12. Test notes
- Result is announced before the question.
- Icons differ by shape, not only colour.
