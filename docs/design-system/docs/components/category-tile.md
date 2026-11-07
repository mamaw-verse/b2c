# CategoryTile

Commerce · Phase 3 · Live sheet: `styleguide/components/category-tile.html`

## 1. Purpose
Icon + label shortcut to a category; grid of 10 on home.

**Use when**
- Home category strip, Categories tab.

**Don't use when**
- Filters.

## 2. Anatomy
1. 48px icon tile on a soft tone (56px md).
2. 2-line caption.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Tile | `categoryTile()` |  |
| Grid | `categoryGrid()` | 5 cols phone, 10 cols md+. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: Navigates. |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | n/a: Circle + line skeleton. |
| Error | n/a: n/a |
| Selected | n/a: n/a |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | 5 × 2 grid. |
| Tablet (md, 768px+) | 10 in one row. |
| Desktop (lg, 1024px+) | 10 in one row, 56px icons. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| name | string | — |  |
| icon | name \| image | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Link. |
| Accessible name | Caption. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | Tile ≥ 64px tall. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--brand-50`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-width`, `--foreground`, `--fs-caption`, `--info`, `--info-soft`, `--primary`, `--r-tile`, `--sale`, `--sale-soft`, `--success`, `--success-soft`, `--surface-muted`, `--warning`, `--warning-soft`, `currentColor (icons)`

## 9. Content rules
- ≤ 2 short words per line.

## 10. Do / Don't
**Do**
- Use the same icon set.

**Don't**
- Don’t truncate captions to 1 line.

## 11. HTML usage
```html
<ul class="grid grid-cols-5 gap-x-1 gap-y-3 md:grid-cols-10">
  <li><a href="#" class="flex flex-col items-center gap-1.5 rounded-tile p-1 text-center text-caption text-foreground hover:bg-surface-muted"><span class="grid size-12 place-items-center rounded-tile bg-brand-50 text-primary md:size-14"><svg class="icon size-6" aria-hidden="true"><use href="#i-utensils"/></svg></span><span class="line-clamp-2">Halal Food</span></a></li>
  <li><a href="#" class="flex flex-col items-center gap-1.5 rounded-tile p-1 text-center text-caption text-foreground hover:bg-surface-muted"><span class="grid size-12 place-items-center rounded-tile bg-info-soft text-info md:size-14"><svg class="icon size-6" aria-hidden="true"><use href="#i-beef"/></svg></span><span class="line-clamp-2">Meat & Seafood</span></a></li>
  <li><a href="#" class="flex flex-col items-center gap-1.5 rounded-tile p-1 text-center text-caption text-foreground hover:bg-surface-muted"><span class="grid size-12 place-items-center rounded-tile bg-sale-soft text-sale md:size-14"><svg class="icon size-6" aria-hidden="true"><use href="#i-candy"/></svg></span><span class="line-clamp-2">Dates & Sweets</span></a></li>
  <li><a href="#" class="flex flex-col items-center gap-1.5 rounded-tile p-1 text-center text-caption text-foreground hover:bg-surface-muted"><span class="grid size-12 place-items-center rounded-tile bg-warning-soft text-warning md:size-14"><svg class="icon size-6" aria-hidden="true"><use href="#i-shirt"/></svg></span><span class="line-clamp-2">Modest Fashion</span></a></li>
  <li><a href="#" class="flex flex-col items-center gap-1.5 rounded-tile p-1 text-center text-caption text-foreground hover:bg-surface-muted"><span class="grid size-12 place-items-center rounded-tile bg-success-soft text-success md:size-14"><svg class="icon size-6" aria-hidden="true"><use href="#i-moon-star"/></svg></span><span class="line-clamp-2">Prayer Essentials</span></a></li>
  <li><a href="#" class="flex flex-col items-center gap-1.5 rounded-tile p-1 text-center text-caption text-foreground hover:bg-surface-muted"><span class="grid size-12 place-items-center rounded-tile bg-brand-50 text-primary md:size-14"><svg class="icon size-6" aria-hidden="true"><use href="#i-book-open"/></svg></span><span class="line-clamp-2">Books & Quran</span></a></li>
  <li><a href="#" class="flex flex-col items-center gap-1.5 rounded-tile p-1 text-center text-caption text-foreground hover:bg-surface-muted"><span class="grid size-12 place-items-center rounded-tile bg-info-soft text-info md:size-14"><svg class="icon size-6" aria-hidden="true"><use href="#i-droplets"/></svg></span><span class="line-clamp-2">Health & Beauty</span></a></li>
  <li><a href="#" class="flex flex-col items-center gap-1.5 rounded-tile p-1 text-center text-caption text-foreground hover:bg-surface-muted"><span class="grid size-12 place-items-center rounded-tile bg-sale-soft text-sale md:size-14"><svg class="icon size-6" aria-hidden="true"><use href="#i-smile"/></svg></span><span class="line-clamp-2">Baby & Kids</span></a></li>
  <li><a href="#" class="flex flex-col items-center gap-1.5 rounded-tile p-1 text-center text-caption text-foreground hover:bg-surface-muted"><span class="grid size-12 place-items-center rounded-tile bg-warning-soft text-warning md:size-14"><svg class="icon size-6" aria-hidden="true"><use href="#i-house"/></svg></span><span class="line-clamp-2">Home & Living</span></a></li>
  <li><a href="#" class="flex flex-col items-center gap-1.5 rounded-tile p-1 text-center text-caption text-foreground hover:bg-surface-muted"><span class="grid size-12 place-items-center rounded-tile bg-success-soft text-success md:size-14"><svg class="icon size-6" aria-hidden="true"><use href="#i-ticket"/></svg></span><span class="line-clamp-2">Vouchers</span></a></li>
</ul>
```

## 12. Test notes
- Captions fit at 360px (Filipino strings).
