# StickyActionBar

Actions · Phase 2 · Live sheet: `styleguide/components/sticky-action-bar.html`

## 1. Purpose
Keeps the main actions within thumb reach on phone: product detail (Shop | Chat | Add to cart | Buy now), checkout (total + Place order), seller forms (Save).

**Use when**
- A page has one decisive action the user must reach without scrolling.

**Don't use when**
- Pages that already show the bottom tab bar (never stack both).
- More than two buttons plus two shortcuts.

## 2. Anatomy
1. Fixed bottom container `z-sticky-bar`, `--shadow-sticky`, `pb-safe` for the home indicator.
2. Optional shortcut links (Shop, Chat): icon over caption.
3. Secondary button (flex-1).
4. Primary `btn-lg` (flex-1).
5. Page content gets bottom padding equal to the bar height.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Product detail | shortcuts + secondary + primary | Shopee-familiar Chat \| Add to cart \| Buy now. |
| Checkout | total + primary | “Total ₱1,438 · Place order”. |
| Form | neutral + primary | Seller product form: Save draft / Publish. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Child buttons carry hover. |
| Pressed | n/a: Child buttons carry pressed. |
| Focus-visible | rendered |
| Disabled | rendered |
| Loading | rendered |
| Error | rendered |
| Selected | n/a: n/a |
| Empty | n/a: n/a |
| Skeleton | n/a: Render the bar immediately with disabled buttons. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Fixed to the bottom, full width, safe-area padding; the tab bar is hidden on this page. |
| Tablet (md, 768px+) | Still fixed; buttons max out at content width via the container. |
| Desktop (lg, 1024px+) | Becomes static (`lg:static`) and sits inline in the buy box; shortcuts hide (header has chat). |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| variant | `product` \| `checkout` \| `form` | `product` |  |
| total | money | — | Checkout variant. |
| primary / secondary | Button props | — |  |
| static | breakpoint | `lg` | Breakpoint at which it becomes inline. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Plain container (no landmark; it is part of the page content order). |
| Accessible name | n/a; buttons carry names. |
| Keyboard | Buttons in DOM order after the content they act on. |
| Focus management | Page sets `scroll-padding-bottom` so focused fields are not hidden behind the bar. |
| ARIA | — |
| Touch target | Buttons 48px; shortcuts 48px × 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Totals that change use `aria-live="polite"` on the total. |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--container-max`, `--danger`, `--dur`, `--ease-out`, `--elevation-sticky`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-label`, `--fs-price`, `--gutter`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-button`, `--sale`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--z-sticky-bar`, `currentColor (icons)`, `safe-area-inset-bottom`

## 9. Content rules
- Primary label is the outcome: “Buy now”, “Place order”.
- Show the total with ₱ and tabular numerals.

## 10. Do / Don't
**Do**
- Add bottom padding to the page so the last content is reachable.
- Hide the BottomTabBar on pages with this bar.

**Don't**
- Don’t put more than two buttons.
- Don’t cover form errors; scroll them into view above the bar.

## 11. HTML usage
```html
<div class="fixed inset-x-0 bottom-0 z-sticky-bar border-t border-border bg-surface shadow-sticky pb-safe lg:static lg:border-0 lg:bg-transparent lg:shadow-none lg:pb-0">
  <div class="mx-auto flex max-w-container items-stretch gap-2 px-gutter py-2 lg:px-0 lg:py-0"><a href="#" class="flex min-h-touch-primary w-12 shrink-0 flex-col items-center justify-center rounded-button text-caption text-muted-foreground hover:bg-surface-muted lg:hidden"><svg class="icon" aria-hidden="true"><use href="#i-store"/></svg><span>Shop</span></a><a href="#" class="flex min-h-touch-primary w-12 shrink-0 flex-col items-center justify-center rounded-button text-caption text-muted-foreground hover:bg-surface-muted lg:hidden"><svg class="icon" aria-hidden="true"><use href="#i-message-circle"/></svg><span>Chat</span></a>
    <button type="button" class="btn btn-secondary btn-lg min-w-0 flex-1 px-2.5 min-[400px]:px-4 max-[399px]:[&>.icon]:hidden lg:flex-none lg:px-8"><svg class="icon" aria-hidden="true"><use href="#i-shopping-cart"/></svg><span>Add to cart</span></button>
    <button type="button" class="btn btn-lg min-w-0 flex-1 px-2.5 min-[400px]:px-4 lg:flex-none lg:px-10"><span>Buy now</span></button>
  </div>
</div>
```

## 12. Test notes
- No overlap with the tab bar; safe-area inset respected (iOS).
- Last content row visible above the bar at 360px.
- Becomes static at 1024px.
