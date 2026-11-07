# Drawer

Overlays · Phase 2 · Live sheet: `styleguide/components/drawer.html`

## 1. Purpose
Side panel for navigation on phone (seller/admin menu) and secondary panels.

**Use when**
- Seller/admin navigation below `lg`.

**Don't use when**
- Storefront navigation (BottomTabBar).

## 2. Anatomy
1. `` pinned left, full height, 20rem / 85vw.
2. Header with title + Close.
3. Nav content.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Left | default | Navigation. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Items. |
| Pressed | n/a: Items. |
| Focus-visible | n/a: Items. |
| Disabled | n/a: n/a |
| Loading | n/a: n/a |
| Error | n/a: n/a |
| Selected | n/a: Current item uses `aria-current`. |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Opened from the header menu button. |
| Tablet (md, 768px+) | Replaced by a collapsed rail (Sidebar) in seller/admin shells. |
| Desktop (lg, 1024px+) | Replaced by the fixed Sidebar. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| open | boolean | false |  |
| side | `left` | `left` |  |
| title | string | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Native modal dialog. |
| Accessible name | Title. |
| Keyboard | Escape closes. |
| Focus management | Into drawer; back to the menu button. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Title. |

## 8. Tokens used
`--border`, `--brand-100`, `--brand-950`, `--dur`, `--ease-out`, `--elevation-sheet`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--fs-caption`, `--fs-h3`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--r-panel`, `--sale`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--z-modal`, `currentColor (icons)`

## 9. Content rules
- Same labels as the desktop sidebar.

## 10. Do / Don't
**Do**
- Close on navigation.

**Don't**
- Don’t use for forms.

## 11. HTML usage
```html
<button type="button" class="btn btn-icon btn-ghost text-foreground" aria-label="Open menu" data-ds-open="dr1"><svg class="icon" aria-hidden="true"><use href="#i-menu"/></svg></button>
<dialog id="dr1" aria-labelledby="dr1-title" class="z-modal bg-surface p-0 shadow-sheet transition-[translate,opacity,scale,display,overlay] transition-discrete duration-token ml-0 mr-auto my-0 h-dvh max-h-dvh w-[min(20rem,85vw)] rounded-r-panel starting:open:-translate-x-full">
  <div class="flex max-h-[inherit] flex-col h-full">
    <div class="flex items-center gap-2 border-b border-border py-1 pl-4 pr-1 py-2">
      <h2 id="dr1-title" class="flex-1 text-h3">Seller Centre</h2>
      <button type="button" class="btn btn-icon btn-ghost text-foreground" aria-label="Close" data-ds-close><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg></button>
    </div>
    <div class="overflow-y-auto overscroll-contain flex-1 p-4">
      <nav aria-label="Seller" class="flex flex-col gap-1">
        <ul class="grid gap-0.5">
          <li><a href="#" class="relative flex min-h-touch items-center gap-3 rounded-button px-3 text-label text-muted-foreground hover:bg-surface-muted hover:text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-house"/></svg><span class="flex-1">Dashboard</span></a></li>
          <li><a href="#" class="relative flex min-h-touch items-center gap-3 rounded-button px-3 text-label bg-primary-soft text-primary-soft-foreground" aria-current="page"><svg class="icon" aria-hidden="true"><use href="#i-package"/></svg><span class="flex-1">Orders</span><span class="badge badge-sale-solid">4</span></a></li>
          <li><a href="#" class="relative flex min-h-touch items-center gap-3 rounded-button px-3 text-label text-muted-foreground hover:bg-surface-muted hover:text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-tag"/></svg><span class="flex-1">Products</span></a></li>
          <li><a href="#" class="relative flex min-h-touch items-center gap-3 rounded-button px-3 text-label text-muted-foreground hover:bg-surface-muted hover:text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-message-circle"/></svg><span class="flex-1">Chat</span><span class="badge badge-sale-solid">2</span></a></li>
          <li><a href="#" class="relative flex min-h-touch items-center gap-3 rounded-button px-3 text-label text-muted-foreground hover:bg-surface-muted hover:text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-chart-column"/></svg><span class="flex-1">Insights</span></a></li>
          <li><a href="#" class="relative flex min-h-touch items-center gap-3 rounded-button px-3 text-label text-muted-foreground hover:bg-surface-muted hover:text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-settings"/></svg><span class="flex-1">Shop settings</span></a></li>
        </ul>
      </nav>
    </div>
  </div>
</dialog>
```

## 12. Test notes
- Focus return to menu button.
