# Implementation spec: storefront fixes

Repo `mamaw-verse/b2c`, branch `production`, base commit `247619f`. Audit IDs refer to `audit-report.md`. Paths are relative to the repo root. Line numbers are at `247619f`.

**Order of work:** WP-1.x, then WP-2.x, then WP-3.x, then WP-4.x, then WP-5.x. Inside a group, follow the numbering. WP-1.1 (container) must land before any page template change, because the page edits depend on it.

**Existing tooling to reuse:** `npm run scan` (`scripts/scan-violations.mjs`: bans hex, px font sizes, `rgb()/hsl()` and brand-name strings in `resources/js`), `tests/e2e` (Playwright, `scenarios.json`, `specs/`), Pest in `tests/Feature` and `tests/Unit`.

---

## 1. Foundations

### WP-1.1 One page container
- **Severity:** P1. **Resolves:** H1, C4, P8, X1 (S1).
- **Files to change:** `resources/js/layouts/public-layout.tsx`, `resources/js/components/site-header.tsx`, `resources/js/components/site-footer.tsx`, `resources/js/pages/home.tsx`, `category.tsx`, `product.tsx`, `shop.tsx`, `search.tsx`, `resources/js/components/shop-header.tsx`, `carousel.tsx`.
- **Current behaviour:**
  - `site-header.tsx:86,186` and `site-footer.tsx:93` use `mx-auto max-w-container px-gutter` per row.
  - Pages use `px-gutter` (hero `home.tsx:43`, title `category.tsx:44`, banner `product.tsx:200`) next to `px-gutter md:px-0` / `lg:px-0` (`home.tsx:87,90,105,123,134`, `category.tsx:56,73,97`, `product.tsx:206,259,282,315,318`, `search.tsx:62,103`, `carousel.tsx:171`).
  - `--gutter` is 1rem (<768), 1.25rem (declared at 768), 1.5rem (768+; the second 48rem block overrides the first at the same breakpoint, see Step 6). `--container-max` is 1240px (`app.css:146-147,202,214`).
- **Target behaviour:**
  - Add a utility `.page` in `resources/css/app.css` (next to `max-w-container`, line 461): `margin-inline: auto; max-width: var(--container-max); padding-inline: var(--gutter);`.
  - Content left edge = `max(var(--gutter), (100vw - var(--container-max)) / 2 + var(--gutter))` at every breakpoint. At 1280 wide: edge = 24px + 20px = 44px from the viewport edge, identical for logo, nav text, breadcrumb, h1, chips, grid, sections and footer.
  - Horizontal scrollers (chips, nav, related list, voucher row) use `-mx-[var(--gutter)] px-[var(--gutter)]` (add utility `.bleed-x`) so the first item starts on the container edge and scrolls to the screen edge on mobile.
  - Pages render a plain `<div>` inside the layout. No page may use `px-gutter`, `md:px-0`, `lg:px-0` except the `.bleed-x` utility.
- **Steps:**
  1. Add `.page` and `.bleed-x` utilities to `app.css`.
  2. In `public-layout.tsx` wrap `{children}` in `<div className="page">`. Replace the inner wrappers in `site-header.tsx` (both `mx-auto … px-gutter` rows) and `site-footer.tsx:93` with `.page`.
  3. In each page delete `mx-auto max-w-container` wrapper (`home.tsx:42`, `category.tsx:43`, `product.tsx:74`) and every `px-gutter`, `md:px-0`, `lg:px-0`.
  4. Scrollers: replace `px-gutter … md:px-0` with `bleed-x` on `category.tsx:56,73`, `home.tsx:105`, `product.tsx:318`, `carousel.tsx:171`.
  5. Product two-column grid (`product.tsx:75`): remove `lg:px-gutter`; keep `lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8`.
  6. In `app.css:196-220` merge the two `@media (min-width: 48rem)` blocks into one (gutter 1.5rem, header 4.875rem). The first block's values (`1.25rem`, `4rem`) are dead because the second wins at the same breakpoint. Optionally add a 640px step; if added, add 640 to the test matrix.
  7. Nav: `ul` gets `-mx-3` and drop `px-gutter` (the link's own `px-3` then puts the text on the container edge). The right group ("Sell on …", "Help") ends on the edge with the same offset on the right.
  8. Shop banner (`shop-header.tsx:45`): remove `md:px-6` / `px-gutter` handling so the avatar and name align to the container edge.
- **Edge cases:** the full-bleed hero image stays inside the container (no change). Safe-area padding is not affected. RTL: use logical properties (`padding-inline`, `margin-inline`); no left/right literals.
- **Acceptance criteria:**
  - At 360, 768, 1024, 1280 and 1440, left edges of logo, first nav item text, breadcrumb, h1, first chip, first card, section h2 and footer brand are equal within 1px; right edges (cart/login group, last card, footer legal text) are equal within 1px.
  - `grep -rn "md:px-0\|lg:px-0" resources/js` returns nothing.
  - `grep -rn "px-gutter" resources/js/pages` returns nothing.
- **Tests:** `tests/e2e/specs/layout-edges.spec.ts` (Playwright) for home, `/categories/{slug}`, `/products/{slug}` at the five widths, reading `getBoundingClientRect().left/right` for `[data-edge]` markers. Add `data-edge="start"` to the elements listed above. Grep check added to `scripts/scan-violations.mjs` as rule "page-level gutter override" (files under `resources/js/pages`).
- **Risk and rollback:** touches every public page. Ship as one PR; revert the commit to roll back. Account, seller and admin shells have their own layouts and are untouched.

### WP-1.2 Focus ring audit and exceptions
- **Severity:** P2. **Resolves:** regression 9.
- **Files to change:** `resources/js/components/ui/input-otp.tsx:46`, `resources/js/components/phone-input.tsx:115`, `resources/js/components/two-factor-setup-modal.tsx:123`, `resources/js/components/ui/dropdown-menu.tsx:7`.
- **Current behaviour:** the base layer (`app.css:581-656`) defines one ring: `outline: 2px solid var(--focus-ring-color); outline-offset: 2px` on `:focus-visible`, container ring via `.focus-ring` / `.focus-ring-inset`, error colour on `[aria-invalid]`. Exceptions: `input-otp.tsx:46` (`ring-2 ring-ring ring-offset-2`), `phone-input.tsx:115` and `two-factor-setup-modal.tsx:123` (`outline-none`), `dropdown-menu.tsx:7` (`outline-none` with `focus:bg-surface-muted`).
- **Target behaviour:**
  - Ring is `2px solid var(--focus-ring-color)`, `2px` offset, no box-shadow rings. Light `--focus-ring-color` is `#17643c` (7.18:1 on white, 6.74:1 on `#f7f8f6`). Dark is `#78a68d` (6.11:1 on `#181f1b`, 6.72:1 on `#0f1512`).
  - Text inputs change `border-color` to `var(--primary)` on focus and show the global outline only on `:focus-visible` (keyboard). The audit rule "inputs change border colour only (no second ring)" means: an input must not show both a border-colour change and a separate shadow ring. Keep the outline as the single ring and do not add `focus:ring-*`.
  - Composite controls: container has `.focus-ring`; inner controls have no outline of their own (already enforced at `app.css:645-657`).
- **Steps:**
  1. `input-otp.tsx:46`: replace `border-primary ring-2 ring-ring ring-offset-2` with `focus-ring` on the group and `border-primary` on the active slot.
  2. `phone-input.tsx:115`: remove `outline-none`; wrap in `.focus-ring` (prefix and input are one field).
  3. `two-factor-setup-modal.tsx:123`: remove `outline-none` from the code box, add `focus-ring-inset`.
  4. `dropdown-menu.tsx:7`: keep `outline-none` on items only if `focus:bg-surface-muted` is kept (menu item uses highlight, not ring, as a Radix pattern). Add `data-[highlighted]:outline-2 data-[highlighted]:outline-offset-[-2px]` with the ring colour to keep a 3:1 indicator.
- **Edge cases:** forced colours: add `@media (forced-colors: active) { :focus-visible { outline-color: Highlight; } }` to the base layer. Reduced motion: no transitions on the ring.
- **Acceptance criteria:** `grep -rn "ring-offset\|focus:ring\|focus-visible:ring" resources/js --include=*.tsx` returns nothing except `ui/sidebar.tsx`. Tabbing through the home page shows exactly one ring per focused element.
- **Tests:** a11y Playwright test `tests/e2e/specs/focus.spec.ts`: tab through header, nav, card, chip, stepper and assert `getComputedStyle(el).outlineWidth === '2px'` and `outlineOffset === '2px'` (or `0px`/`-2px` for container and inset variants); axe-core run with no `focus-visible` violations.
- **Dependencies:** none. **Risk:** low.

### WP-1.3 Dark-theme colour roles
- **Severity:** P1. **Resolves:** X3 (S3).
- **Files to change:** `resources/css/app.css` (`.dark` block at line 236), `resources/js/components/site-header.tsx:28`.
- **Current behaviour:** `.dark` does not set `--brand-*`, `--primary*`, `--promo`, `--rating-foreground`, or `--halal*`. Shadcn leftovers (`--card hsl(0 0% 3.9%)`, `--secondary`, `--muted`, `app.css:262-293`) do not match the app surfaces.
- **Target behaviour (add to `.dark`):**

| Token | Light | Dark | Contrast (dark) |
|---|---|---|---|
| `--primary-text` (new; text and links on surfaces) | `var(--brand-600)` | `#a3cdb3` | 9.55:1 on `#181f1b` |
| `--nav-active` (new) | `var(--brand-700)` | `#a3cdb3` | 9.55:1 |
| `--promo` | `#b54708` | `#f79009` | 7.15:1 on `#181f1b` |
| `--promo-solid-bg` (new, tag fill) | `#b54708` | `#b54708` | white text 5.43:1 |
| `--rating-foreground` | `#8a5a00` | `#fdb022` | 9.12:1 |
| `--border-control` | `#818b84` | `#6f8077` | 4.02:1 on `#181f1b`, 4.43:1 on `#0f1512` |

  - Light `--promo` changes from `#c2310f` to `#b54708` (5.43:1 white-on-fill, 5.43:1 text-on-white). This moves the discount tag away from the `--danger #b42318` hue (see WP-1.4).
  - Keep `--brand-*` scale values as they are (they feed backgrounds and the brand button). Components that use brand as **text** switch to `--primary-text` or `--nav-active`.
- **Steps:**
  1. Add the tokens above under `:root` and `.dark`; map `--color-primary-text` and `--color-nav-active` in `@theme inline` (near `app.css:317-349`).
  2. `site-header.tsx:26-28`: `hover:text-brand-700` and `text-brand-700` become `hover:text-nav-active` and `text-nav-active`. The indicator `after:bg-brand-600` becomes `after:bg-primary-text`.
  3. Replace `text-primary` (as text on surface) with `text-primary-text` in the storefront components (`grep -rn "text-primary\b" resources/js/components resources/js/pages`). Leave `text-primary-foreground` untouched.
  4. Remove or remap the shadcn tokens in `.dark` (`--card`, `--popover`, `--secondary`, `--muted`, `--accent`, `--input`, `--sidebar*`) to the app surface tokens.
- **Edge cases:** `.badge-promo` (`app.css:868`) uses `bg-promo-soft text-promo`; dark `--promo-soft #33160e` with `#f79009` gives 7.09:1. Print and forced colours: no change.
- **Acceptance criteria:** every text token pair in the contrast table (audit report) is ≥4.5:1 in both themes; non-text control borders ≥3:1.
- **Tests:** `tests/Unit/contrast.test.mjs` (Node): parse `app.css`, resolve the pairs `{text, surface}` in `[:root, .dark]`, fail below 4.5 (text) or 3 (control). Run in CI via `npm run check`.
- **Dependencies:** WP-1.4 (same file). **Risk:** medium (visual change in dark mode). Roll back by reverting the token block.

### WP-1.4 Colour roles: danger only for errors
- **Severity:** P2. **Resolves:** regression 10.
- **Files to change:** `resources/css/app.css` (`--sale`, `--promo`, `.badge-sale-solid` at ~line 862), `resources/js/pages/product.tsx:290`, `resources/js/components/site-header.tsx:144,161`, `resources/js/components/rating.tsx`.
- **Current behaviour:** `--sale: var(--promo)` (`app.css:122`). The rating numeral uses `text-sale` (`product.tsx:290`). Unread badges use `bg-sale` (`site-header.tsx:144,161`). `--promo #c2310f` is the same hue family as `--danger #b42318`.
- **Target behaviour:**
  - `--promo: #b54708` (see WP-1.3). Used only for discount tags and sale labels.
  - Ratings: numeral `text-foreground`, star fill `var(--rating)` (decorative), printed value always present.
  - Unread-count badges use `bg-primary text-primary-foreground` (7.18:1), not promo or danger.
  - `--danger` and `--danger-soft` are used only for errors, destructive actions and `badge-danger` (expired/missing certificate states).
- **Steps:** change `product.tsx:290` to `text-foreground`; change header badges; delete `--sale` and `.badge-sale-solid` after `grep -rn "sale" resources/js` shows no users (or alias for one release).
- **Acceptance criteria:** `grep -rn "text-sale\|bg-sale\|text-danger\|bg-danger" resources/js/pages/product.tsx resources/js/pages/category.tsx resources/js/pages/home.tsx resources/js/components/{product-card,price-block,rating,site-header}.tsx` returns nothing.
- **Tests:** grep check added to `scripts/scan-violations.mjs` ("danger/sale token on storefront price or rating components").
- **Dependencies:** WP-1.3. **Risk:** low.

### WP-1.5 Zero states: loading, empty, error, end of list
- **Severity:** P1. **Resolves:** C6, C7.
- **Files to change:** `resources/js/pages/category.tsx`, `home.tsx`, `search.tsx`, `resources/js/components/product-card.tsx` (add `ProductGridSkeleton`), existing `ui/skeleton.tsx`, `ui/empty-state.tsx`, `ui/error-state.tsx`.
- **Current behaviour:** `category.tsx` has no loading, empty or error handling (no use of the three `ui/` components); `InfiniteScroll` is used without a visible fallback.
- **Target behaviour:**
  - **Loading** (initial navigation and filter change): `ProductGridSkeleton` with the same grid classes and 10 placeholder cards (image 1:1, 2 text lines, price line). Show while `router` is processing a visit to the same page (`router.on('start'/'finish')`).
  - **Empty:** `EmptyState` with title "No products match", body "Try removing a filter.", action "Clear filters" (links to the category URL with no query). Shown when `products.data.length === 0`.
  - **Error:** Inertia `onError` or a failed partial reload shows `ErrorState` with "Couldn't load products" and a "Try again" button that repeats the visit.
  - **End of list / pager:** when `next_cursor` is null and `data.length > 0`, show "You've seen all N products" (N from WP-3.2's total). When `next_cursor` exists show a "Load more" button below the grid (the infinite scroll stays as progressive enhancement; the button is the keyboard and no-JS path).
- **Edge cases:** exactly 1 product (singular label "1 product"); 0 with filters on (show Clear filters); reduced motion (no shimmer, static tint); error while loading page 2 (keep page 1, show inline retry).
- **Acceptance criteria:** each state renders in Storybook-less Playwright test via `scenarios.json` entries `category-empty`, `category-error`, `category-loading`.
- **Tests:** `tests/e2e/specs/category-states.spec.ts`; Pest feature test for an empty category returning `products.data = []`.
- **Dependencies:** WP-1.1, WP-3.2. **Risk:** low.

---

## 2. Shared components

### WP-2.1 Product card
- **Severity:** P1. **Resolves:** P9, P10, H2.
- **Files to change:** `resources/js/components/product-card.tsx`, `price-block.tsx`, `resources/js/types/catalogue.ts`, `app/Models/Product.php` (`toCard`, line 105-125).
- **Current behaviour:**
  - Grid card: price (`text-price` 700), old price `text-body-sm text-muted-foreground`, `OffBadge` `promo-solid` top-right, halal badge top-left only if `halal_status === 'certified'` and slug not in `UNCERTIFIED_CATEGORIES` (`product-card.tsx:19-39`), handling tag only when `p.temperature` is set (`:63`), equal height (`li.flex`, `article.flex-col`, title `min-h-[2lh]`, `mt-auto`).
  - Compact card shows `OffBadge` without the old price (`:226-260`).
  - Halal rule uses a hard-coded slug set.
- **Target behaviour:**
  - Price is the largest and heaviest text on the card (`--fs-price` 1.0625rem, weight 700 per `app.css:417`); every other line on the card is `--fs-caption` or `--fs-body` at a lighter weight. Old price is `--fs-body-sm`, muted, `line-through`. Never red.
  - Discount: `-NN%` tag, `bg-promo text-primary-foreground` (`--promo #b54708`, 5.43:1), top-right of the image. Rendered only when `was_price > price` and in stock.
  - Halal badge: render when `halal_status === 'certified'` **and** `requires_certification` is true (new boolean on the card payload, from `categories.requires_certification`). Remove `UNCERTIFIED_CATEGORIES` and `category_slug` from the component.
  - Handling tag (Frozen/Chilled) only when `temperature` is non-null (unchanged).
  - Compact card: show old price and the tag together, or neither. Either pass `was` to `PriceBlock` or drop `OffBadge`; pick "show both" (width 128px: price on line 1, old price on line 2).
  - Compact title: `line-clamp-2` with `min-h-[2lh]` instead of `truncate`.
  - All cards in a row are equal height (keep).
- **Steps:**
  1. Migration: add `requires_certification boolean default true` to `categories`; set false for `prayer-essentials`, `modest-fashion`, `books-quran` (and their children).
  2. `Product::toCard()`: add `'requires_certification' => $this->category->requires_certification`; keep `category_slug` only if used elsewhere.
  3. Update `ProductCardData` in `types/catalogue.ts`.
  4. Edit `product-card.tsx` as above and delete the slug set.
- **Edge cases:** 60+ character name (2-line clamp, `title` attribute stays); `was_price` ≤ `price` (no tag, no old price); out of stock (price muted, no tag, no quick add: existing); price range; certified item in a non-certification category (no badge: rule); expired or missing certificate (never shows the "Halal" badge; list-level state badge is out of scope).
- **Acceptance criteria:** a certified product in Meat & Seafood shows the badge; a certified product in Prayer Essentials does not; a product with `was_price` shows tag and old price; compact card never shows a tag without an old price; in a 5-column row all `article` heights are equal.
- **Tests:** Vitest component tests for `ProductCard` (new `resources/js/components/__tests__/product-card.test.tsx`, add Vitest via `vite-plus` if not present); Pest test for `toCard()` payload; Playwright visual snapshot of the grid at 360/1280.
- **Dependencies:** WP-1.3, WP-1.4. **Risk:** medium (migration). Roll back with the down migration.

### WP-2.2 Halal badge vocabulary
- **Severity:** P2. **Resolves:** regression 5.
- **Files to change:** `resources/js/components/halal-badge.tsx`, `halal-facts.tsx`, `halal-certificate-card.tsx`.
- **Current behaviour:** six statuses with labels and tones (`halal-badge.tsx:12-59`): `certified` "Halal certified"/"Halal" (green), `review` "Certificate under review"/"In review" (warning), `expiring` "Certificate expires soon"/"Expiring" (warning), `expired` "Certificate expired"/"Expired" (danger), `missing` "No certificate"/"No certificate" (danger), `na` "Muslim-friendly (no certificate needed)"/"Muslim-friendly" (neutral).
- **Target behaviour (one shared vocabulary, same strings in card, detail and filters):**
  - **Cards (grid/list):** only `certified` gets a badge (rule in WP-2.1). Other states render **no badge** on cards. A non-certified item in a certified-required category is not shown in the "Halal certified" filter.
  - **Detail page:** `HalalBadge` full label plus certificate details (WP-3.3).
  - **Muslim-friendly (`na`):** no badge on cards; on detail, one neutral line "Muslim-friendly · no certificate needed".
  - Badge `aria-label` always "Halal certified, verified by {platform}" (exists at `product-card.tsx:172`).
- **Edge cases:** dark mode (soft pill stays light, text `#0b6657` on `#e2f4ef` is 6.03:1); forced colours (badge keeps border via `forced-colors` override: add `border: 1px solid CanvasText`).
- **Acceptance criteria:** the status-to-label table above is the only place these strings live (`grep -rn "Muslim-friendly" resources/js` shows only `halal-badge.tsx`).
- **Tests:** Vitest snapshot over all six statuses.
- **Dependencies:** WP-2.1. **Risk:** low.

### WP-2.3 Category nav
- **Severity:** P1/P2. **Resolves:** X1, X2, regression 8.
- **Files to change:** `resources/js/components/site-header.tsx:19-29,181-219`, `app/Http/Middleware/HandleInertiaRequests.php`, `config/marketplace.php`.
- **Current behaviour:** one `navLink()` style: default `text-muted-foreground`, hover `bg-brand-50 text-brand-700`, active `text-brand-700` + 2px `after` indicator, constant `font-medium`, focus from the global ring. Active only for `/categories/{slug}` (`:49-51`). "Sell on …" and "Help" are `href="#"`.
- **Target behaviour (states):**

| State | Spec |
|---|---|
| default | `text-muted-foreground` (6.46:1), weight 500, no background |
| hover | `bg-brand-50` tint (light) / `bg-surface-muted` (dark), text `--nav-active` |
| active | `aria-current="page"`, text `--nav-active`, 2px bottom indicator `--primary-text`, inset 12px each side, weight 500 (unchanged) |
| focus-visible | global 2px ring, 2px offset; indicator must not clip it (ring is drawn outside the link box; keep `before:-inset-y-0.5` hit area) |

  - First item's text starts on the container edge (WP-1.1 step 7).
  - "Sell on …" and "Help" link to real routes from config (`marketplace.nav.sell`, `marketplace.nav.help`). If the value is empty, the link is not rendered.
  - On product pages the product's top-level category gets `aria-current="true"` styling only if `ProductDetail.category.slug` is passed in shared props (optional; skip if not wanted, see Decisions).
- **Edge cases:** 12+ categories (scrolls with the existing right-edge mask at <1024); very long label (nowrap, scrolls); RTL (logical `ms-auto`).
- **Acceptance criteria:** computed `font-weight` is identical across default, hover, active; `aria-current` present on exactly one link on a category page and on none on home; no `href="#"` in `site-header.tsx`.
- **Tests:** Playwright: hover, focus, active computed styles; grep check for `href="#"` in `resources/js/components/site-*.tsx`.
- **Dependencies:** WP-1.1, WP-1.3. **Risk:** low.

### WP-2.4 Filter chips and sort control
- **Severity:** P1/P2. **Resolves:** C3, C9, C10, C8 (S7).
- **Files to change:** `resources/js/components/chip.tsx`, new `resources/js/components/sort-control.tsx`, `resources/js/pages/category.tsx`, `search.tsx`.
- **Current behaviour:** `Chip` is `min-h-9`, 13px/700 (`--text-label` weight 700), `border-border-control`, `aria-pressed` always set (`chip.tsx:22-24`). Sort chips and filter chip share a row (`category.tsx:70-91`).
- **Target behaviour:**
  - **Filter chip** (toggle): 36px high, 13px/500, border `var(--border-outline)` (`#cbd9cf`) default, background `--surface`. Selected: `aria-pressed="true"`, background `--primary-soft`, border `--primary`, text `--primary-soft-foreground` (6.38:1), leading check icon (exists). Not-selected chips carry **no** `aria-pressed` unless they are toggles.
  - A lighter default border (`--border-outline`) is below 3:1 on white. Keep it only if the label contrast (≥4.5:1) carries the affordance and the chip has a visible hover and focus state; otherwise keep `--border-control` (3.52:1). See Decisions D3.
  - **Subcategory chips:** render as links (`<a>` via Inertia `Link`), no `aria-pressed`. The current category's child is `aria-current="page"` with the selected style.
  - **Sort:** separate control from the chips, placed on the right of the filter row at md+ and a second row at <768: a `<select>`-style menu (existing `ui/select.tsx`) labelled "Sort by" with options Relevance, Newest, Top sales, Price: low to high, Price: high to low. Selected value read from the URL `sort` query.
  - Chip rows get `bleed-x` plus the same right-edge fade mask as the nav (`mask-image: linear-gradient(to right, #000 calc(100% - 2.5rem), transparent)`) below 1024px.
  - Chip hit area stays ≥44px (existing `after:-inset-y-[5px]`).
- **Edge cases:** 0 selected filters; many chips (scroll); selected chip scrolled out of view (`scrollIntoView({inline:'center'})` as the nav does); forced colours (selected chip shows a 2px outline).
- **Acceptance criteria:** sort is visually and structurally separate from filters; the current sort is shown; subcategory chips have no `aria-pressed`; selected state does not rely on colour alone (check icon).
- **Tests:** Vitest `chip.test.tsx`; Playwright: select "Price: low to high", URL has `sort=price_asc`, control shows it; axe has no `aria-pressed` on links.
- **Dependencies:** WP-1.1, WP-3.2. **Risk:** low.

### WP-2.5 Footer
- **Severity:** P2. **Resolves:** X4 (S8).
- **Files to change:** `resources/js/components/site-footer.tsx`, `config/marketplace.php:20,24,26,28`, `.env.example`, `app/Http/Middleware/HandleInertiaRequests.php`, `resources/js/types/navigation.ts`.
- **Current behaviour:** flex-column groups; link pitch `min-h-9` + `gap-3` = 48px (`site-footer.tsx:19,44`). Mobile accordions below 640px. Config defaults `support@example.com`, `DTI Business Name Reg. No. 0000-0000`; payments and couriers hard-coded in config and always rendered.
- **Target behaviour:**
  - Keep flex columns (do not move to stretched grid rows). Column grid at lg: `[1.4fr_repeat(5,minmax(0,1fr))]` stays. Link pitch 40px (`min-h-9` + `gap-1`) and `gap-x-8`.
  - **Config-driven, no placeholders:** in `config/marketplace.php` the defaults for `support.email`, `support.hours`, `registration`, `payments`, `couriers` become `null` / `[]`. Each footer block renders only when its value is non-empty: the contact block when `email` or `hours` set; the legal registration line when `registration` set; the payments chip group when `payments` is non-empty; the couriers group likewise. The trust line "Every halal claim is verified by {name}" is rendered only when `marketplace.claims.halal_verification` is true.
  - **No claims beyond config:** payments/couriers listed only if configured per environment; remove the defaults from the config file; document them in `.env.example`.
  - Mobile (<640px): accordions as today; the brand block, contact block and legal bar stay visible; heading buttons keep `min-h-touch` (44px).
  - Links whose `href` is empty are not rendered.
- **Edge cases:** all optional blocks empty (footer shows brand, links and copyright only); 1 payment method; long registration string (wraps under the copyright at <640px); RTL.
- **Acceptance criteria:** with a clean `.env` the HTML contains neither `example.com` nor `0000-0000`; with values set they appear. Footer left and right edges equal the header's (WP-1.1).
- **Tests:** Pest feature test rendering with empty config asserting the strings are absent; Vitest for the conditional blocks; grep check for `example.com|0000-0000` in `config/` and `resources/js`.
- **Dependencies:** WP-1.1. **Risk:** low. Deploy note: production `.env` must set the real values or the blocks disappear.

### WP-2.6 Quantity stepper
- **Severity:** P1. **Resolves:** S6, P12.
- **Files to change:** `resources/js/components/quantity-stepper.tsx:39-88`.
- **Current behaviour:** container `inline-flex overflow-hidden rounded-field border`; no `.focus-ring`; input has `focus-visible:outline-offset-0` (`:74`); `type="text" inputMode="numeric"`; clamps on every keystroke (`setValue`).
- **Target behaviour:**
  - Container: `focus-ring` (ring hugs the border, 2px, offset 0 as defined at `app.css:632-634`), no `overflow-hidden` (use `rounded-field` on the first and last button instead, so the outline is never clipped).
  - Inner buttons and input: no outline of their own (the base layer already removes it under `.focus-ring`).
  - Buttons 44x44px minimum (`btn-icon` with `min-h-touch min-w-touch`).
  - Input: 48px wide, centred, `aria-label` "Quantity". Typing a value is held in local text state and clamped on blur or Enter (not every keystroke), empty input reverts on blur.
  - Disabled "−" at `min`, disabled "+" at `max`; `max` = product or variation stock.
  - `aria-live` announcement of the current value (exists at `:85`).
- **Edge cases:** stock 1 (both buttons disabled, value 1); stock 0 (stepper not rendered, "Out of stock" shown); typing "0" or "abc" (reverts); very large paste (clamps to max); RTL (buttons mirror via flex order, no left/right literals).
- **Acceptance criteria:** focusing any inner element draws one 2px ring around the whole control, fully visible (not clipped) in light and dark.
- **Tests:** Vitest for clamping and blur behaviour; Playwright screenshot of the focused stepper in both themes.
- **Dependencies:** WP-1.2. **Risk:** low.

---

## 3. Page templates

### WP-3.1 Home
- **Severity:** P2. **Resolves:** H1, H3, H4, H5.
- **Files to change:** `resources/js/pages/home.tsx`, `app/Http/Controllers/HomeController.php` (category list source).
- **Current behaviour:** hero, trust list (3 hard-coded items at `home.tsx:13-21`, including "Cash on delivery"), categories, vouchers, daily discover with `InfiniteScroll`.
- **Target behaviour:**
  - Container per WP-1.1.
  - Trust list items come from config (`marketplace.trust`) and each is hidden if not configured. "Cash on delivery / Pay the rider on arrival" is shown only when `payments` includes `COD` (consistency with the footer).
  - Category row and nav list use the same source (`navCategories`). If the row intentionally has more tiles, document the reason in a code comment (Decision D6).
  - Grid: 5 / 4 / 2 columns (WP-3.2 grid spec).
  - End of list message per WP-1.5.
- **Acceptance criteria:** left edges per WP-1.1; no hard-coded payment claim without config.
- **Tests:** Playwright edges test (WP-1.1); Vitest for hidden trust items.
- **Dependencies:** WP-1.1, WP-2.5, WP-4.1. **Risk:** low.

### WP-3.2 Category page
- **Severity:** P0/P1. **Resolves:** C1-C11 (S2, S7).
- **Files to change:** `resources/js/pages/category.tsx`, `app/Actions/Catalogue/ListCategoryProducts.php`, `app/Http/Controllers/CategoryController.php`, `resources/js/components/product-card.tsx` (`ProductGrid` classes at `:344`), `tests/Feature/CatalogueTest.php`.
- **Current behaviour:** subtitle `{data.length}+ products · all certificates verified` (`category.tsx:48-49`); `Chip pressed` "Halal certified" with no behaviour (`:90`); sort chips with no state (`:75-89`); action takes only `$sort`; grid `grid-cols-2 sm:grid-cols-3 md:gap-3 lg:grid-cols-5`.
- **Target behaviour:**
  - **Count:** the controller passes `total` (a `count()` over the same query, not the page size). Subtitle: `"{total} products"` (singular "1 product"; 0 shows the empty state). The words "all certificates verified" are removed. If a certified filter is on, show "{total} halal-certified products".
  - **Filters that filter:** query params `halal=1`, `sort=relevant|newest|top_sales|price_asc|price_desc`. `ListCategoryProducts::handle(Category $c, string $sort, bool $halalOnly)` adds `->when($halalOnly, fn($q) => $q->where('halal_status', 'certified'))`. The chip's `pressed` state reads `halal` from the URL; toggling it sets or removes the param with `router.get(url, {}, {preserveState: true, preserveScroll: true})`.
  - **Sort values:** `relevant` is defined as `ORDER BY sold_count DESC, id` and labelled "Best match" only if D4 confirms; otherwise label "Top sales" for `top_sales` and rename `relevant` to `featured` with an explicit rule. Add `top_sales` to the `match` (today it falls to `default`, `ListCategoryProducts.php:25`) and `price_desc` to the UI.
  - **Grid:** `grid-cols-2` (<640) `sm:grid-cols-3` (640) `md:grid-cols-4` (768) `lg:grid-cols-5` (1024), full width of the container. Gap 8px (<768) / 12px (768+). The grid always fills the container width; fewer products leave empty cells at the end of the row, never a narrower grid. (Today `product-card.tsx:344` has `sm:grid-cols-3` and jumps to 5 at lg; add `md:grid-cols-4`.)
  - **States and pager:** WP-1.5.
  - **Breadcrumb, title, chips and grid** share the container (WP-1.1).
- **Edge cases:** category with 0 products; 1 product; 24 products exactly (cursor page size 24 at `ListCategoryProducts.php:28`) with and without a next page; invalid `sort` (falls back to default, no 500); `halal=1` with no certified products (empty state with "Clear filters"); parent category with children (children included in the query: existing).
- **Acceptance criteria:** with `halal=1`, every returned product has `halal_status = certified`; subtitle count equals the total row count; the current sort is shown; at 1280 the grid spans the full container with 5 columns; at 768 it shows 4 and at 360 it shows 2.
- **Tests:** Pest feature tests in `tests/Feature/CatalogueTest.php` (halal filter, sort orders, total); Playwright: toggle the chip and compare the number of cards; edges test.
- **Dependencies:** WP-1.1, WP-1.5, WP-2.4. **Risk:** medium (query change). Roll back by reverting the action and page together.

### WP-3.3 Product detail
- **Severity:** P0/P1. **Resolves:** P1-P7, P9, P11, S5.
- **Files to change:** `resources/js/pages/product.tsx`, `resources/js/components/rating.tsx`, `resources/js/components/variation-picker.tsx`, `app/Http/Controllers/ProductController.php`, `app/Models/Product.php` (`toDetail`).
- **Current behaviour:** see audit S5 and S2 C4/C5.
- **Target behaviour:**
  - **Purchase block (right column at lg, below the gallery at <1024):** title, rating row, price panel, shipping/returns rows, variation row (only if `variations.length > 0`), then the **quantity stepper** (label "Quantity", min 1, max = selected variation's stock or `p.stock`, 44px buttons) above the action buttons. Cart requests post `{product_id, variation_id, qty}`.
  - **Shipping row:** `p.free_shipping ? "Free shipping" : "Shipping calculated at checkout"`, followed by "· ships from {p.ships_from}". One field, `ships_from`, set from the shop's location unless a product override exists. "Ships from" in the details table uses the same field (remove the duplicate source).
  - **Rating row:** render stars, numeral and "(N ratings)" only when `review_count > 0`. With 0 reviews show "No ratings yet" (muted). Numeral is `text-foreground` (WP-1.4). The "ratings" link is rendered only when `review_count > 0`. "{sold_count} sold" is shown only when `sold_count > 0`.
  - **Ratings & reviews section:** average block hidden when `review_count = 0`; empty state "No reviews yet. Reviews appear after verified purchases." only.
  - **Halal panel (one place):** replace the "Authenticity" row and any "Halal status" panel with a single "Halal status" section rendered from `HalalBadge` + facts:
    - `certified`: badge "Halal certified" plus rows: Certifier (`certifying_body`), Certificate number, Valid until (`MMM YYYY`), Coverage (what the certificate covers: product and facility; from `certification.scope`). Link "View certificate" opens `HalalCertificateCard`.
    - `review`, `expiring`, `expired`, `missing`: the matching badge (vocabulary in WP-2.2) plus one sentence stating what the buyer should do.
    - `na`: single neutral line "Muslim-friendly · no certificate needed".
    - The shipping/returns key-value list no longer has an "Authenticity" row.
  - **Description:** render only if present; fixtures must not contain lorem (WP-4.1).
  - **Related cards:** compact card per WP-2.1.
  - **Container:** WP-1.1; the shop banner and sections share edges.
  - **Gallery:** hide the "1 of N" counter and thumbnails strip when `images.length === 1`.
- **Steps:** add `review_count`, `ships_from`, `certification.number`, `certification.scope` to `Product::toDetail()`; update `ProductDetail` type; edit `product.tsx` as above; wire the stepper into `buyAction` and `VariationPicker`.
- **Edge cases:** 0/1/many images; 0 reviews, 1 review, many; out of stock (stepper and buttons replaced by "Out of stock" + "Notify me" if available, otherwise disabled buttons); variation with stock 0 (disabled option); stock below the typed quantity (clamp); long product name (wraps, no truncation); frozen product (cold-chain note: existing, keep); RTL (logical properties); reduced motion (gallery without transitions).
- **Acceptance criteria:** product with no reviews shows no rating numeral or stars and no "ratings" link; product without variations shows no variation row; no "Authenticity" text in the DOM; stepper exists, min 1, max = stock; shipping row says "Free shipping" only when `free_shipping`; one location source.
- **Tests:** Playwright: scenarios for 0 reviews, no variations, out of stock, certified with certificate data; Pest: `toDetail()` payload fields; Vitest for the rating row.
- **Dependencies:** WP-1.1, WP-1.4, WP-2.1, WP-2.2, WP-2.6, WP-4.1. **Risk:** high (purchase flow). Roll back by feature flag `PRODUCT_PAGE_V2` if D7 is "yes"; otherwise revert the commit.

---

## 4. Fixtures and data

### WP-4.1 Authored catalogue fixtures
- **Severity:** P1. **Resolves:** S4, H4, C11, P7.
- **Files to change:** `database/seeders/CatalogueSeeder.php:109-215`, `database/factories/ProductFactory.php:22-46`, `database/factories/ShopFactory.php:26`, `public/images/catalogue/` (assets).
- **Current behaviour:** 8 authored products, then 40 filler products with random Faker name, random category (`$tops->random()`), rotated photo, random rating, random location, lorem description.
- **Target behaviour:**
  - Replace the filler loop with an authored list (name, category, image, price, was, halal status, certifier, frozen, shop) of at least 30 products, spread across all top-level categories so every category page has ≥ 5 items and at least one category has > 24 (to exercise the pager).
  - Each image filename matches the product's category and name.
  - `ProductFactory` no longer produces random names, lorem text, or random `rating` / `sold_count`. Factory defaults: `rating = null`, `sold_count = 0`, description a fixed English sentence. `rating` and `sold_count` are written by the seeder from the seeded reviews and orders (or null).
  - `location` of a product = its shop's `location` (or an explicit `ships_from`). `ShopFactory` location list stays, but products must not pick independently.
  - Add state fixtures for: certified, under review, expiring (valid_until within 30 days), expired, missing, Muslim-friendly, frozen, out of stock (`stock = 0`), discounted, long name (≥ 80 chars), no reviews, no variations, one image, multiple images.
- **Acceptance criteria:** `php artisan db:seed` yields no lorem, no product whose photo contradicts its name, no product whose `location` differs from its shop without an explicit `ships_from`, and every state in the list is reachable by slug.
- **Tests:** Pest `tests/Feature/CatalogueSeedTest.php` asserting the above, plus the slug list in `tests/e2e/scenarios.json`.
- **Dependencies:** none for data; WP-3.3 and WP-3.2 tests depend on it. **Risk:** low (dev and test data only). Make sure production data is not reseeded.

---

## 5. Tests and CI checks

### WP-5.1 CI gates
- **Files to change:** `scripts/scan-violations.mjs`, `package.json` (`check`), `tests/e2e/specs/*`, `tests/Unit/contrast.test.mjs`, CI config (`.github/workflows` if present; not checked).
- **Add:**
  1. Grep rules in `scan-violations.mjs`: `md:px-0|lg:px-0|px-gutter` under `resources/js/pages`; `text-sale|bg-sale` outside admin/seller; `href="#"` in `site-*.tsx`; `example.com|0000-0000` in `config` and `resources/js`; `aria-pressed` on `Chip` used for navigation.
  2. Contrast unit test (WP-1.3).
  3. Playwright specs: `layout-edges`, `focus`, `category-states`, plus visual snapshots of home, category and product at 360, 768, 1280, both themes.
  4. axe-core run on the three pages in both themes (no serious or critical violations).
- **Acceptance criteria:** `npm run check` fails on each new violation when introduced deliberately.
- **Dependencies:** all earlier packages. **Risk:** low.

---

## Definition of done
- [ ] Left and right edges of header, nav, breadcrumb, title, chips, grid, sections and footer match at 360, 768, 1024, 1280, 1440 (WP-1.1 test).
- [ ] One 2px / 2px-offset focus ring in both themes at ≥3:1; the stepper ring is on its container and not clipped.
- [ ] Every text and control token pair in both themes meets 4.5:1 / 3:1 (contrast test passes).
- [ ] No `--danger` or `--sale` on prices, ratings or discounts; discount tag uses `--promo #b54708`.
- [ ] Product card: price strongest, old price muted, halal badge only for certified items in certification-required categories, equal card heights.
- [ ] Category page: real count, working halal filter, selected sort, 5/4/2 columns (3 at 640), loading, empty and error states, pager or load more.
- [ ] Product page: stepper, no red rating numeral, no rating block with 0 reviews, one halal panel with certifier, number, expiry and coverage, one shipping and ships-from source.
- [ ] Footer: no placeholder strings; blocks hidden when config is empty; accordions on mobile.
- [ ] Fixtures: no lorem, no contradicting name/category/photo, every product state reachable.
- [ ] `npm run check`, `npm run types:check`, Pest and Playwright suites green.

## Decisions needed from the product owner (with recommended default)
| # | Decision | Recommended default |
|---|---|---|
| D1 | Is "Free shipping" per product (`free_shipping`) or a marketplace policy? | Per product; show "Shipping calculated at checkout" otherwise |
| D2 | Which categories do not need certification? | Prayer Essentials, Modest Fashion, Books & Quran (as today), stored as `requires_certification` |
| D3 | Chip default border: keep `#818b84` (3.52:1) or lighten to `#cbd9cf` (below 3:1)? | Keep `#818b84` for inputs and toggles. Use the lighter border only on chips that also have a visible hover, focus and selected state |
| D4 | What does "relevant" sort mean? | Rename to "Top sales" and drop "relevant" until a ranking exists |
| D5 | Should the halal chip also appear on search? | Yes, same component and param |
| D6 | Should the home category row match the nav list (10 vs 8)? | Yes, one source |
| D7 | Feature-flag the new product page? | Yes, `PRODUCT_PAGE_V2`, remove after one release |
| D8 | Highlight the product's category in the nav on product pages? | No (keep nav active only on category pages) |
| D9 | Real values for support email, hours, registration number, payments, couriers | Must be supplied before launch; blocks stay hidden until set |
| D10 | Should the rating show a count instead of hiding at 0 reviews? | Hide the average at 0 reviews; show "N ratings" otherwise |
