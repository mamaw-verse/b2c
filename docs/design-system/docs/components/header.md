# Header

Navigation · Phase 2 · Live sheet: `styleguide/components/header.html`

## 1. Purpose
Storefront header: compact search row on phone/tablet; announcement bar + logo + wide search + account + category nav on desktop.

**Use when**
- All storefront screens.

**Don't use when**
- Seller/admin (shell headers).

## 2. Anatomy
1. Announcement strip (desktop only, `--announce-h`).
2. Logo slot (neutral mark + `{{BRAND_NAME}}`).
3. SearchInput.
4. Cart (+ chat on phone, notifications + account on desktop) IconButtons with counts.
5. Category nav (`--nav-h` on desktop; horizontal scroller with a right-edge fade on mobile). Four states from tokens: default `--text-muted` 500, hover `--brand-50`/`--brand-700` pill, current item `--brand-700` + 2px `--brand-600` bottom bar (`aria-current="page"`), shared focus ring. Weight never changes between states.
6. Variant: back arrow + page title (detail pages on phone).

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Search (default) | `header()` | Home, listing. |
| Back + title | `header({back:true,title})` | Cart, order detail on phone. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Children. |
| Pressed | n/a: Children. |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | n/a: n/a |
| Error | n/a: n/a |
| Selected | rendered |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | 56px sticky row: logo mark, search, cart, chat + category scroller (right-edge fade; current item scrolls into view). |
| Tablet (md, 768px+) | 64px row, same items. |
| Desktop (lg, 1024px+) | Announcement 34px + 78px row (logo text, search, cart, notifications, account) + 48px category nav; current item shows the 2px indicator aligned to the row's bottom border. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| variant | `search` \| `back` | `search` |  |
| title | string | — | Back variant. |
| cartCount / chatCount | number | — |  |
| logo | slot | neutral mark | White-label. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `banner` landmark; `search`; `nav` “Categories”. |
| Accessible name | Logo link “{{BRAND_NAME}} home”. |
| Keyboard | Skip link precedes it on real pages. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | Icon buttons 44px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--container-max`, `--danger`, `--dur`, `--ease-out`, `--elevation-popover`, `--focus-ring-color`, `--focus-ring-error`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--foreground-inverse`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-eyebrow`, `--fs-h4`, `--fs-input`, `--fs-label`, `--gutter`, `--header-h`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--r-button`, `--r-field`, `--r-panel`, `--r-search`, `--r-tile`, `--sale`, `--subtle-foreground`, `--success`, `--success-soft`, `--surface`, `--surface-inverse`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--z-header`, `--z-sheet`, `currentColor (icons)`, `safe-area-inset-top`

## 9. Content rules
- Announcement ≤ 60 chars.

## 10. Do / Don't
**Do**
- Keep search visible at every tier.

**Don't**
- Don’t hardcode a logo; use the slot.

## 11. HTML usage
```html
<header class="z-header border-b border-border bg-surface pt-safe">
  <div class="hidden min-h-[var(--announce-h)] items-center bg-surface-inverse text-caption text-foreground-inverse lg:flex">
    <p class="mx-auto w-full max-w-container px-gutter">Free shipping over ₱499 · Every halal claim is checked by {{BRAND_NAME}}</p>
  </div>
  <div class="mx-auto flex h-header max-w-container items-center gap-2 px-gutter md:gap-3 lg:gap-6"><a href="#" class="flex min-h-touch min-w-touch shrink-0 items-center gap-2 text-h4 text-primary max-md:hidden" aria-label="{{BRAND_NAME}} home"><span class="grid size-8 place-items-center rounded-tile bg-primary text-primary-foreground" aria-hidden="true"><svg class="icon size-5" aria-hidden="true"><use href="#i-store"/></svg></span><span class="hidden lg:inline">{{BRAND_NAME}}</span></a>
    <div class="min-w-0 flex-1">
      <form role="search" class="relative max-w-2xl" data-ds-combobox action="#" onsubmit="return false">
        <label for="hdr-q" class="sr-only">Search</label>
        <svg class="icon pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true"><use href="#i-search"/></svg><input id="hdr-q" type="search" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="hdr-q-list" autocomplete="off" enterkeyhint="search" value="" placeholder="Search halal products" class="field rounded-search pl-10 pr-3" data-ds-open-on-focus>
        <ul id="hdr-q-list" role="listbox" aria-label="Suggestions" class="absolute inset-x-0 top-full z-sheet mt-1 max-h-80 overflow-auto rounded-panel border border-border bg-surface py-1 shadow-popover" hidden>
          <li role="presentation" class="px-3 pb-1 pt-2 text-eyebrow uppercase text-muted-foreground">Recent searches</li>
          <li id="hdr-q-opt-0" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center gap-3 px-3 text-body aria-selected:bg-primary-soft hover:bg-surface-muted"><svg class="icon size-4 text-muted-foreground" aria-hidden="true"><use href="#i-search"/></svg><span>ajwa dates</span></li>
          <li id="hdr-q-opt-1" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center gap-3 px-3 text-body aria-selected:bg-primary-soft hover:bg-surface-muted"><svg class="icon size-4 text-muted-foreground" aria-hidden="true"><use href="#i-search"/></svg><span>halal longganisa</span></li>
          <li id="hdr-q-opt-2" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center gap-3 px-3 text-body aria-selected:bg-primary-soft hover:bg-surface-muted"><svg class="icon size-4 text-muted-foreground" aria-hidden="true"><use href="#i-search"/></svg><span>prayer mat</span></li>
          <li id="hdr-q-opt-3" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center gap-3 px-3 text-body aria-selected:bg-primary-soft hover:bg-surface-muted"><svg class="icon size-4 text-muted-foreground" aria-hidden="true"><use href="#i-search"/></svg><span>hijab</span></li>
        </ul>
        <p data-ds-empty hidden class="absolute inset-x-0 top-full z-sheet mt-1 rounded-panel border border-border bg-surface px-3 py-3 text-body text-muted-foreground shadow-popover">No matches. Press Enter to search anyway.</p>
        <p class="sr-only" aria-live="polite" data-ds-live></p>
      </form>
    </div>
    <div class="flex shrink-0 items-center"><a href="#" class="btn btn-icon btn-ghost text-foreground" aria-label="Cart, 2"><svg class="icon" aria-hidden="true"><use href="#i-shopping-cart"/></svg><span class="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-sale px-1 text-caption leading-5 text-primary-foreground" aria-hidden="true">2</span></a><span class="lg:hidden"><a href="#" class="btn btn-icon btn-ghost text-foreground" aria-label="Chat, 3"><svg class="icon" aria-hidden="true"><use href="#i-message-circle"/></svg><span class="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-sale px-1 text-caption leading-5 text-primary-foreground" aria-hidden="true">3</span></a></span><span class="hidden items-center gap-1 lg:flex"><a href="#" class="btn btn-icon btn-ghost text-foreground" aria-label="Notifications, 12"><svg class="icon" aria-hidden="true"><use href="#i-bell"/></svg><span class="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-sale px-1 text-caption leading-5 text-primary-foreground" aria-hidden="true">12</span></a><a href="#" class="flex min-h-touch items-center gap-2 rounded-button px-2 text-label hover:bg-surface-muted"><span class="relative inline-grid shrink-0 place-items-center font-bold rounded-full size-8 text-caption bg-success-soft text-success" aria-hidden="true"><span aria-hidden="true">MS</span></span><span>Maria</span></a></span></div>
  </div>
  <nav aria-label="Categories" class="border-t border-border lg:h-[var(--nav-h)]">
    <ul class="mx-auto flex h-full max-w-container items-stretch gap-1 overflow-x-auto px-gutter [scrollbar-width:none] max-lg:[-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)] max-lg:[mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)]">
      <li class="flex"><a href="#" class="relative my-1 flex items-center whitespace-nowrap rounded-button px-3 text-body-sm font-medium text-muted-foreground before:absolute before:-inset-y-0.5 before:content-[""] hover:bg-brand-50 hover:text-brand-700">Halal Food</a></li>
      <li class="flex"><a href="#" class="relative my-1 flex items-center whitespace-nowrap rounded-button px-3 text-body-sm font-medium text-muted-foreground before:absolute before:-inset-y-0.5 before:content-[""] hover:bg-brand-50 hover:text-brand-700">Meat & Seafood</a></li>
      <li class="flex"><a href="#" class="relative my-1 flex items-center whitespace-nowrap rounded-button px-3 text-body-sm font-medium text-muted-foreground before:absolute before:-inset-y-0.5 before:content-[""] hover:bg-brand-50 hover:text-brand-700">Dates & Sweets</a></li>
      <li class="flex"><a href="#" class="relative my-1 flex items-center whitespace-nowrap rounded-button px-3 text-body-sm font-medium text-muted-foreground before:absolute before:-inset-y-0.5 before:content-[""] hover:bg-brand-50 hover:text-brand-700">Modest Fashion</a></li>
      <li class="flex"><a href="#" class="relative my-1 flex items-center whitespace-nowrap rounded-button px-3 text-body-sm font-medium text-muted-foreground before:absolute before:-inset-y-0.5 before:content-[""] hover:bg-brand-50 hover:text-brand-700">Prayer Essentials</a></li>
      <li class="flex"><a href="#" class="relative my-1 flex items-center whitespace-nowrap rounded-button px-3 text-body-sm font-medium text-muted-foreground before:absolute before:-inset-y-0.5 before:content-[""] hover:bg-brand-50 hover:text-brand-700">Books & Quran</a></li>
      <li class="ml-auto flex"><a href="#" class="relative my-1 flex items-center whitespace-nowrap rounded-button px-3 text-body-sm font-medium text-muted-foreground before:absolute before:-inset-y-0.5 before:content-[""] hover:bg-brand-50 hover:text-brand-700">Sell on {{BRAND_NAME}}</a><a href="#" class="relative my-1 flex items-center whitespace-nowrap rounded-button px-3 text-body-sm font-medium text-muted-foreground before:absolute before:-inset-y-0.5 before:content-[""] hover:bg-brand-50 hover:text-brand-700">Help</a></li>
    </ul>
  </nav>
</header>
```

## 12. Test notes
- Sticky at all widths; no overflow at 360px with 2-digit badges.
