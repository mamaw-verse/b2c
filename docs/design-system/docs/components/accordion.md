# Accordion

Data display · Phase 2 · Live sheet: `styleguide/components/accordion.html`

## 1. Purpose
Progressive disclosure using native ``: FAQs, product specs, filter groups.

**Use when**
- Long secondary content.

**Don't use when**
- Primary info (price, CTA).

## 2. Anatomy
1. `details` + `summary` (48px row, chevron rotates).
2. Content area.
3. Optional exclusive group via `name`.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Multi | default |  |
| Exclusive | `name` | Only one open. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | n/a: n/a |
| Error | n/a: n/a |
| Selected | rendered |
| Empty | n/a: Hide empty sections. |
| Skeleton | n/a: Row skeletons. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Full width. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same; product specs may show expanded. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| items | [title, content, open][] | — |  |
| exclusive | boolean | false | Native `name`. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Native disclosure. |
| Accessible name | Summary text. |
| Keyboard | Enter/Space toggles. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 48px summary. |
| Reduced motion | Chevron rotation collapses under reduced motion. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--dur`, `--ease-out`, `--fs-body`, `--fs-label`, `--muted-foreground`, `--r-panel`, `--surface`, `--surface-subtle`, `--touch-primary`, `currentColor (icons)`

## 9. Content rules
- Summary is a noun phrase.

## 10. Do / Don't
**Do**
- Use native details.

**Don't**
- Don’t hide required info.

## 11. HTML usage
```html
<div class="divide-y divide-border rounded-panel border border-border bg-surface">
  <details class="group" open>
    <summary class="flex min-h-touch-primary items-center justify-between gap-3 px-4 text-label hover:bg-surface-subtle focus-inset [&::-webkit-details-marker]:hidden list-none">Shipping<svg class="icon shrink-0 text-muted-foreground transition-transform duration-token group-open:rotate-180" aria-hidden="true"><use href="#i-chevron-down"/></svg></summary>
    <div class="px-4 pb-4 text-body text-muted-foreground">Ships from Quezon City within 1–2 days. Standard delivery 2–5 days.</div>
  </details>
  <details class="group">
    <summary class="flex min-h-touch-primary items-center justify-between gap-3 px-4 text-label hover:bg-surface-subtle focus-inset [&::-webkit-details-marker]:hidden list-none">Returns<svg class="icon shrink-0 text-muted-foreground transition-transform duration-token group-open:rotate-180" aria-hidden="true"><use href="#i-chevron-down"/></svg></summary>
    <div class="px-4 pb-4 text-body text-muted-foreground">Return within 7 days if the item is damaged or not as described.</div>
  </details>
  <details class="group">
    <summary class="flex min-h-touch-primary items-center justify-between gap-3 px-4 text-label hover:bg-surface-subtle focus-inset [&::-webkit-details-marker]:hidden list-none">Payment options<svg class="icon shrink-0 text-muted-foreground transition-transform duration-token group-open:rotate-180" aria-hidden="true"><use href="#i-chevron-down"/></svg></summary>
    <div class="px-4 pb-4 text-body text-muted-foreground">GCash, Maya, credit/debit card, Cash on Delivery.</div>
  </details>
</div>
```

## 12. Test notes
- Works without JS.
