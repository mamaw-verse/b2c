# Pagination & infinite scroll

Navigation · Phase 2 · Live sheet: `styleguide/components/pagination.html`

## 1. Purpose
Pagination for tables and desktop search; infinite scroll with a “Load more” fallback for phone feeds.

**Use when**
- Pagination: admin/seller tables, desktop results.
- Infinite: product feeds on phone.

**Don't use when**
- Short lists.

## 2. Anatomy
1. Pagination: prev, pages (md+), “Page x of y” (phone), next.
2. Sentinel: IntersectionObserver triggers load; visible “Load more” button; end message; polite announcement.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Pagination | `pagination()` |  |
| Infinite | `infiniteSentinel()` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | rendered |
| Loading | rendered |
| Error | n/a: Show “Couldn’t load more. Retry” with the button. |
| Selected | rendered |
| Empty | n/a: Hide when 1 page. |
| Skeleton | n/a: Append card skeletons while loading. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Prev / “Page 3 of 12” / next while the **container** is < 28rem (`@md`); feeds use infinite scroll. |
| Tablet (md, 768px+) | Page numbers appear once the container is ≥ 28rem. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| page / total | number | — |  |
| onPage | fn | — |  |
| infinite.pages | number | — |  |
| infinite.auto | boolean | true | Observer on; button always present. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `nav` “Pagination”; links. |
| Accessible name | “Page 2”, “Previous page”. |
| Keyboard | Links; “Load more” is a button so keyboard users never depend on scrolling. |
| Focus management | After Load more, focus stays on the button. |
| ARIA | `aria-current="page"`; first/last use `aria-disabled`. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | “4 more items loaded” / end message (polite). |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--brand-700`, `--dur`, `--ease-out`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-label`, `--info`, `--info-soft`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--r-button`, `--r-card`, `--sale`, `--sale-soft`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--warning`, `--warning-soft`, `currentColor (icons)`

## 9. Content rules
- “Load more”, not “See more”.

## 10. Do / Don't
**Do**
- Keep footer reachable (button fallback).

**Don't**
- Don’t infinite-scroll tables.

## 11. HTML usage
```html
<nav aria-label="Pagination" class="@container">
  <ul class="flex items-center justify-between gap-1 @md:justify-center">
    <li><a href="#" class="btn btn-neutral btn-icon" aria-label="Previous page"><svg class="icon" aria-hidden="true"><use href="#i-chevron-left"/></svg></a></li>
    <li class="text-body text-muted-foreground @md:hidden">Page <span class="font-bold text-foreground">3</span> of 12</li>
    <li class="hidden @md:block"><a href="#" class="grid min-h-touch min-w-touch place-items-center rounded-button text-label text-foreground hover:bg-surface-muted" aria-label="Page 1">1</a></li>
    <li aria-hidden="true" class="hidden px-1 text-muted-foreground @md:block">…</li>
    <li class="hidden @md:block"><a href="#" class="grid min-h-touch min-w-touch place-items-center rounded-button text-label text-foreground hover:bg-surface-muted" aria-label="Page 2">2</a></li>
    <li class="hidden @md:block"><a href="#" class="grid min-h-touch min-w-touch place-items-center rounded-button text-label bg-primary text-primary-foreground" aria-current="page" aria-label="Page 3">3</a></li>
    <li class="hidden @md:block"><a href="#" class="grid min-h-touch min-w-touch place-items-center rounded-button text-label text-foreground hover:bg-surface-muted" aria-label="Page 4">4</a></li>
    <li aria-hidden="true" class="hidden px-1 text-muted-foreground @md:block">…</li>
    <li class="hidden @md:block"><a href="#" class="grid min-h-touch min-w-touch place-items-center rounded-button text-label text-foreground hover:bg-surface-muted" aria-label="Page 12">12</a></li>
    <li><a href="#" class="btn btn-neutral btn-icon" aria-label="Next page"><svg class="icon" aria-hidden="true"><use href="#i-chevron-right"/></svg></a></li>
  </ul>
</nav>
```

## 12. Test notes
- Load more works by keyboard.
- Announcement after load.
