# BottomTabBar

Navigation · Phase 2 · Live sheet: `styleguide/components/bottom-tab-bar.html`

## 1. Purpose
Primary storefront navigation on phone and tablet: Home, Categories, Chat, Notifications, Me.

**Use when**
- Top-level storefront and account screens.

**Don't use when**
- Pages with a StickyActionBar (product detail, checkout).
- Seller/admin (Drawer + rail).

## 2. Anatomy
1. Fixed bottom `nav` (`z-header`), `pb-safe`.
2. 5 items: icon + 12px caption, 56px tall.
3. Active item: `--primary`, bold, `aria-current="page"`.
4. Unread badge (`--sale`), count in sr-only text.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `bottomTabBar({active})` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: Navigates. |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | n/a: n/a |
| Error | n/a: n/a |
| Selected | rendered |
| Empty | n/a: Badges hide at 0. |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Fixed bottom; page content gets `pb-tabbar`. Items share width by content (“Notifications” fits at 360px). |
| Tablet (md, 768px+) | Same (PROPOSED: storefront keeps the tab bar on tablet). |
| Desktop (lg, 1024px+) | Hidden (`lg:hidden`); the full header takes over and `--tabbar-h` becomes 0. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| active | string | `Home` |  |
| badges | {chat, notifications} | — | Counts. |
| items | array | 5 defaults | White-label apps may rename. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `nav` landmark “Main”, list of links. |
| Accessible name | Visible captions. |
| Keyboard | Tab through links. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | `aria-current="page"`; badge `aria-hidden` + sr-only “, 3 unread”. |
| Touch target | 56px tall; items ≥ 44px wide. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-width`, `--foreground`, `--fs-caption`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--sale`, `--surface`, `--touch-min`, `currentColor (icons)`, `safe-area-inset-bottom`

## 9. Content rules
- One-word captions; Filipino strings must fit at 360px (test “Mga Abiso”).

## 10. Do / Don't
**Do**
- Keep exactly 5 items.

**Don't**
- Don’t show with StickyActionBar.

## 11. HTML usage
```html
<nav aria-label="Main" class="relative border-t border-border bg-surface pb-safe lg:hidden">
  <ul class="mx-auto flex max-w-xl">
    <li class="flex-auto"><a href="#" class="relative flex h-14 min-w-touch flex-col items-center justify-center gap-0.5 whitespace-nowrap px-1 text-caption font-bold text-primary" aria-current="page"><span class="relative"><svg class="icon stroke-[2.5]" aria-hidden="true"><use href="#i-house"/></svg></span><span>Home</span></a></li>
    <li class="flex-auto"><a href="#" class="relative flex h-14 min-w-touch flex-col items-center justify-center gap-0.5 whitespace-nowrap px-1 text-caption text-muted-foreground hover:text-foreground"><span class="relative"><svg class="icon" aria-hidden="true"><use href="#i-layout-grid"/></svg></span><span>Categories</span></a></li>
    <li class="flex-auto"><a href="#" class="relative flex h-14 min-w-touch flex-col items-center justify-center gap-0.5 whitespace-nowrap px-1 text-caption text-muted-foreground hover:text-foreground"><span class="relative"><svg class="icon" aria-hidden="true"><use href="#i-message-circle"/></svg><span class="absolute -right-2.5 -top-1.5 grid min-w-4.5 place-items-center rounded-full bg-sale px-1 text-caption leading-[1.125rem] text-primary-foreground" aria-hidden="true">3</span></span><span>Chat</span><span class="sr-only">, 3 unread</span></a></li>
    <li class="flex-auto"><a href="#" class="relative flex h-14 min-w-touch flex-col items-center justify-center gap-0.5 whitespace-nowrap px-1 text-caption text-muted-foreground hover:text-foreground"><span class="relative"><svg class="icon" aria-hidden="true"><use href="#i-bell"/></svg><span class="absolute -right-2.5 -top-1.5 grid min-w-4.5 place-items-center rounded-full bg-sale px-1 text-caption leading-[1.125rem] text-primary-foreground" aria-hidden="true">12</span></span><span>Notifications</span><span class="sr-only">, 12 unread</span></a></li>
    <li class="flex-auto"><a href="#" class="relative flex h-14 min-w-touch flex-col items-center justify-center gap-0.5 whitespace-nowrap px-1 text-caption text-muted-foreground hover:text-foreground"><span class="relative"><svg class="icon" aria-hidden="true"><use href="#i-user"/></svg></span><span>Me</span></a></li>
  </ul>
</nav>
```

## 12. Test notes
- Safe area padding on iOS.
- Hidden at 1024px.
- Labels don’t truncate at 360px.
