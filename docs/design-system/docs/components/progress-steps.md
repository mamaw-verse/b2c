# ProgressSteps

Feedback · Phase 2 · Live sheet: `styleguide/components/progress-steps.html`

## 1. Purpose
Shows position in a multi-step flow (seller onboarding, return request).

**Use when**
- 3–5 sequential steps.

**Don't use when**
- One-page checkout (DECIDED: checkout is one page).
- Order tracking (Timeline).

## 2. Anatomy
1. Phone: “Step n of N: Name” + progress bar.
2. md+: numbered circles with labels and connectors; completed = check; current `aria-current=step`.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `progressSteps()` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Steps are not links. |
| Pressed | n/a: n/a |
| Focus-visible | n/a: Not focusable. |
| Disabled | n/a: n/a |
| Loading | n/a: n/a |
| Error | n/a: Mark the step label with an error icon and text (port). |
| Selected | rendered |
| Empty | n/a: Always has a current step. |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Compact text + bar. Switches by **container** width (`@xl`, 36rem), not viewport, so it also works in narrow panels. |
| Tablet (md, 768px+) | Full stepper when its container is ≥ 36rem. |
| Desktop (lg, 1024px+) | Full stepper. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| steps | string[] | — |  |
| current | number | 0 |  |
| label | string | — | Nav label. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `nav` with ordered list. |
| Accessible name | `aria-label`. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | `aria-current="step"`; completed steps have sr-only “Completed:”. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--border-control`, `--foreground`, `--fs-body-sm`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--surface`, `--surface-muted`, `currentColor (icons)`

## 9. Content rules
- Step names are nouns, 1–2 words.

## 10. Do / Don't
**Do**
- Keep ≤ 5 steps.

**Don't**
- Don’t make steps clickable unless revisiting is allowed.

## 11. HTML usage
```html
<nav aria-label="Seller application progress" class="@container">
  <p class="text-body-sm text-muted-foreground @xl:hidden">Step 2 of 4: <span class="font-bold text-foreground">Business details</span></p>
  <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted @xl:hidden" aria-hidden="true">
    <div class="h-full rounded-full bg-primary" style="width:50%"></div>
  </div>
  <ol class="hidden items-center gap-2 @xl:flex">
    <li class="flex flex-1 items-center gap-2 last:flex-none"><span class="grid size-8 shrink-0 place-items-center rounded-full text-label bg-primary text-primary-foreground"><svg class="icon size-4" aria-hidden="true"><use href="#i-check"/></svg><span class="sr-only">Completed:</span></span><span class="text-label text-foreground">Shop info</span><span class="h-0.5 flex-1 rounded-full bg-primary" aria-hidden="true"></span></li>
    <li class="flex flex-1 items-center gap-2 last:flex-none" aria-current="step"><span class="grid size-8 shrink-0 place-items-center rounded-full text-label border-2 border-primary bg-surface text-primary">2</span><span class="text-label text-foreground">Business details</span><span class="h-0.5 flex-1 rounded-full bg-border" aria-hidden="true"></span></li>
    <li class="flex flex-1 items-center gap-2 last:flex-none"><span class="grid size-8 shrink-0 place-items-center rounded-full text-label border border-border-control bg-surface text-muted-foreground">3</span><span class="text-label text-muted-foreground">Bank account</span><span class="h-0.5 flex-1 rounded-full bg-border" aria-hidden="true"></span></li>
    <li class="flex flex-1 items-center gap-2 last:flex-none"><span class="grid size-8 shrink-0 place-items-center rounded-full text-label border border-border-control bg-surface text-muted-foreground">4</span><span class="text-label text-muted-foreground">Review</span></li>
  </ol>
</nav>
```

## 12. Test notes
- Phone variant visible < 768px, list ≥ 768px.
