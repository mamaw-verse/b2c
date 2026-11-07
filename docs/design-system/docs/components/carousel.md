# Carousel / Gallery

Data display · Phase 2 · Live sheet: `styleguide/components/carousel.html`

## 1. Purpose
Swipeable media gallery with thumbnails, counter and full-screen zoom. CSS scroll-snap; JS only syncs controls.

**Use when**
- Product photos, promo banners.

**Don't use when**
- Auto-rotating content (not allowed).

## 2. Anatomy
1. Track (`scroll-snap`, focusable, arrow keys).
2. “n of N” counter.
3. Prev/next (pointer devices only; swipe on touch).
4. Thumbnails (`aria-current`).
5. Zoom button → full-screen dialog.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Gallery | `carousel({thumbs:true})` | Product detail. |
| Banner | `thumbs:false, zoom:false, ratio:aspect-[2/1]` | Home promos. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Arrows appear on pointer devices. |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: Prev hidden on first slide, next on last. |
| Loading | n/a: Skeleton. |
| Error | n/a: Placeholder media. |
| Selected | rendered |
| Empty | n/a: Single placeholder image. |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Edge-to-edge square, swipe, counter; thumbnails scroll. |
| Tablet (md, 768px+) | Same, inside the left column. |
| Desktop (lg, 1024px+) | Arrows on hover devices; thumbnails 64px. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| slides | {src, alt}[] | — |  |
| thumbs / zoom | boolean | true |  |
| ratio | class | `aspect-square` |  |
| label | string | “Product photos” |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `section` `aria-roledescription="carousel"`; slides `aria-roledescription="slide"` “n of N”. |
| Accessible name | `aria-label`. |
| Keyboard | Track focusable; Left/Right move; thumbnails are buttons. |
| Focus management | Zoom dialog focuses Close; returns to Zoom button. |
| ARIA | Thumb `aria-current`. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Smooth scrolling disabled under reduced motion. |
| Announcements | Slide label read on focus. |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--brand-700`, `--brand-800`, `--brand-950`, `--dur`, `--ease-out`, `--elevation-popover`, `--foreground`, `--foreground-inverse`, `--fs-caption`, `--fs-label`, `--gutter`, `--info`, `--info-soft`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--r-badge`, `--r-button`, `--r-hero`, `--r-panel`, `--r-tile`, `--ring`, `--sale`, `--sale-soft`, `--surface`, `--surface-inverse`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--warning`, `--warning-soft`, `currentColor (icons)`, `safe-area-inset-top`

## 9. Content rules
- Alt text describes the photo (“Ajwa dates, tub front view”).

## 10. Do / Don't
**Do**
- Let users swipe; never auto-advance.

**Don't**
- Don’t hide prev/next on desktop.

## 11. HTML usage
```html
<section class="grid gap-2" aria-roledescription="carousel" aria-label="Product photos" data-ds-carousel>
  <div class="relative">
    <ul class="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain md:rounded-panel [scrollbar-width:none]" data-ds-track tabindex="0" aria-label="Product photos, use arrow keys">
      <li class="w-full shrink-0 snap-center" aria-roledescription="slide" aria-label="1 of 5">
        <div class="grid w-full place-items-center overflow-hidden aspect-square bg-brand-100 text-brand-700" role="img" aria-label="Front"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-package"/></svg></div>
      </li>
      <li class="w-full shrink-0 snap-center" aria-roledescription="slide" aria-label="2 of 5">
        <div class="grid w-full place-items-center overflow-hidden aspect-square bg-info-soft text-info" role="img" aria-label="Side"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-shopping-bag"/></svg></div>
      </li>
      <li class="w-full shrink-0 snap-center" aria-roledescription="slide" aria-label="3 of 5">
        <div class="grid w-full place-items-center overflow-hidden aspect-square bg-sale-soft text-sale" role="img" aria-label="Back"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-gift"/></svg></div>
      </li>
      <li class="w-full shrink-0 snap-center" aria-roledescription="slide" aria-label="4 of 5">
        <div class="grid w-full place-items-center overflow-hidden aspect-square bg-warning-soft text-warning" role="img" aria-label="Detail"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-image"/></svg></div>
      </li>
      <li class="w-full shrink-0 snap-center" aria-roledescription="slide" aria-label="5 of 5">
        <div class="grid w-full place-items-center overflow-hidden aspect-square bg-surface-muted text-muted-foreground" role="img" aria-label="In use"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-tag"/></svg></div>
      </li>
    </ul>
    <p class="absolute bottom-2 right-2 rounded-full bg-surface-inverse px-2 py-0.5 text-caption text-foreground-inverse tabular" data-ds-count aria-hidden="true">1 of 5</p>
    <button type="button" class="btn btn-icon btn-neutral absolute right-2 top-2 rounded-full border-transparent shadow-popover" aria-label="Zoom photo" data-ds-open="cr1-zoom"><svg class="icon" aria-hidden="true"><use href="#i-zoom-in"/></svg></button>
    <button type="button" class="btn btn-icon btn-neutral absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full border-transparent shadow-popover [@media(hover:hover)]:inline-flex disabled:hidden" aria-label="Previous photo" data-ds-prev><svg class="icon" aria-hidden="true"><use href="#i-chevron-left"/></svg></button>
    <button type="button" class="btn btn-icon btn-neutral absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full border-transparent shadow-popover [@media(hover:hover)]:inline-flex disabled:hidden" aria-label="Next photo" data-ds-next><svg class="icon" aria-hidden="true"><use href="#i-chevron-right"/></svg></button>
  </div>
  <ul class="flex gap-2 overflow-x-auto px-gutter md:px-0" aria-label="Thumbnails">
    <li class="shrink-0">
      <button type="button" class="block size-14 overflow-hidden rounded-tile border-2 border-transparent aria-[current=true]:border-primary md:size-16" data-ds-thumb="0" aria-current="true" aria-label="Show photo 1: Front">
        <div class="grid w-full place-items-center overflow-hidden aspect-square bg-brand-100 text-brand-700" aria-hidden="true"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-package"/></svg></div>
      </button>
    </li>
    <li class="shrink-0">
      <button type="button" class="block size-14 overflow-hidden rounded-tile border-2 border-transparent aria-[current=true]:border-primary md:size-16" data-ds-thumb="1" aria-current="false" aria-label="Show photo 2: Side">
        <div class="grid w-full place-items-center overflow-hidden aspect-square bg-info-soft text-info" aria-hidden="true"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-shopping-bag"/></svg></div>
      </button>
    </li>
    <li class="shrink-0">
      <button type="button" class="block size-14 overflow-hidden rounded-tile border-2 border-transparent aria-[current=true]:border-primary md:size-16" data-ds-thumb="2" aria-current="false" aria-label="Show photo 3: Back">
        <div class="grid w-full place-items-center overflow-hidden aspect-square bg-sale-soft text-sale" aria-hidden="true"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-gift"/></svg></div>
      </button>
    </li>
    <li class="shrink-0">
      <button type="button" class="block size-14 overflow-hidden rounded-tile border-2 border-transparent aria-[current=true]:border-primary md:size-16" data-ds-thumb="3" aria-current="false" aria-label="Show photo 4: Detail">
        <div class="grid w-full place-items-center overflow-hidden aspect-square bg-warning-soft text-warning" aria-hidden="true"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-image"/></svg></div>
      </button>
    </li>
    <li class="shrink-0">
      <button type="button" class="block size-14 overflow-hidden rounded-tile border-2 border-transparent aria-[current=true]:border-primary md:size-16" data-ds-thumb="4" aria-current="false" aria-label="Show photo 5: In use">
        <div class="grid w-full place-items-center overflow-hidden aspect-square bg-surface-muted text-muted-foreground" aria-hidden="true"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-tag"/></svg></div>
      </button>
    </li>
  </ul>
</section>
<dialog id="cr1-zoom" aria-label="Zoomed photo" class="m-0 h-dvh max-h-dvh w-screen bg-surface-inverse p-0">
  <div class="on-inverse flex h-full flex-col">
    <div class="flex justify-end p-2 pt-safe">
      <button type="button" class="btn btn-icon btn-inverse rounded-full border-transparent" aria-label="Close" data-ds-close autofocus><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg></button>
    </div>
    <div class="grid flex-1 place-items-center overflow-auto p-4">
      <div class="grid w-full place-items-center overflow-hidden aspect-square bg-brand-100 text-brand-700 max-w-2xl rounded-panel" role="img" aria-label="Front"><svg class="icon size-1/3 max-w-16 stroke-[1.25]" aria-hidden="true"><use href="#i-package"/></svg></div>
    </div>
  </div>
</dialog>
```

## 12. Test notes
- No page overflow at 360px.
- Thumb click scrolls track.
