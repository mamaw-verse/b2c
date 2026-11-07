# Breadcrumb

Navigation · Phase 2 · Live sheet: `styleguide/components/breadcrumb.html`

## 1. Purpose
Shows the category path on listing and product pages (desktop/tablet); scrolls horizontally on phone.

**Use when**
- Category hierarchy ≥ 2 levels.

**Don't use when**
- Flows (ProgressSteps).

## 2. Anatomy
1. `nav` “Breadcrumb” + `ol`.
2. Links in `--muted-foreground`, separators chevron (decorative).
3. Current page bold, `aria-current`.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `breadcrumb()` |  |

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
| Selected | n/a: Last item is current. |
| Empty | n/a: Hidden at top level. |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Horizontally scrollable single line; often hidden on product detail (back button instead). |
| Tablet (md, 768px+) | Visible, one line. |
| Desktop (lg, 1024px+) | Visible above the title. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| items | {label, href}[] | — | Last = current. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `nav` “Breadcrumb”, ordered list. |
| Accessible name | — |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | `aria-current="page"`; chevrons `aria-hidden`. |
| Touch target | Links 44px tall. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-width`, `--foreground`, `--fs-body-sm`, `--muted-foreground`, `--primary`, `--subtle-foreground`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Use category names exactly.

## 10. Do / Don't
**Do**
- Use `--muted-foreground` for links (6.07:1 on canvas); the template breadcrumb grey failed contrast.

**Don't**
- Don’t truncate mid-word; scroll instead.

## 11. HTML usage
```html
<nav aria-label="Breadcrumb" class="overflow-x-auto">
  <ol class="flex items-center gap-1 whitespace-nowrap text-body-sm text-subtle-foreground">
    <li class="flex items-center gap-1"><a href="#" class="inline-flex min-h-touch min-w-touch items-center justify-center text-muted-foreground underline-offset-2 hover:text-primary hover:underline">Home</a><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-right"/></svg></li>
    <li class="flex items-center gap-1"><a href="#" class="inline-flex min-h-touch min-w-touch items-center justify-center text-muted-foreground underline-offset-2 hover:text-primary hover:underline">Halal Food</a><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-right"/></svg></li>
    <li class="flex items-center gap-1"><a href="#" class="inline-flex min-h-touch min-w-touch items-center justify-center text-muted-foreground underline-offset-2 hover:text-primary hover:underline">Dates & Sweets</a><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-right"/></svg></li>
    <li><span aria-current="page" class="font-bold text-foreground">Dates</span></li>
  </ol>
</nav>
```

## 12. Test notes
- Scrolls without page overflow at 360px.
