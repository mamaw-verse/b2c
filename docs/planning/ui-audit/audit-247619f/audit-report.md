# Barakah Market storefront audit

Repo `mamaw-verse/b2c`, branch `production`, HEAD `247619f` (2026-11-07, "revise storefront product card, category nav and footer"). Stack: Laravel + Inertia React 19 + Tailwind 4.

## How this audit was done (and its limits)

- **Code: read directly.** Every "confirmed" cause below is a line I read in the cloned repo. Line numbers are for HEAD.
- **Screenshots: the 6 you supplied.** Home 360 (full page) and 1280, category 360 and 1280, product 360 and 1280. The screenshots match HEAD. For example, the footer layout and config-driven values are HEAD's, and the 24px left-edge offsets match the `--gutter` value in code. I inferred a scale of about 1.39 image px per CSS px from the container width (1659 image px for 1192 CSS px).
- **No live capture.** The sandbox has no PHP or Composer, so I could not run the app or Playwright. I did not capture 768/640/1024, dark theme, hover/focus/loading/empty/error states, or the product states you listed (see Coverage gaps).
- **Contrast: computed, not sampled.** Ratios come from the token hex values in `resources/css/app.css` using the WCAG 2.x relative-luminance formula (Node script). They are not pixel measurements from rendered output.
- **Fixed bars in full-page shots** (hairline across card bottoms at y≈1058/600/792, the mobile tab bar mid-page, the sticky action bar over the price, the nav over the gallery at 360) are treated as capture gaps, not defects.

## Summary

Counts are rows in the screen tables below (33 findings).

| Severity                          | Count |
| --------------------------------- | ----- |
| P0 wrong data or blocks core flow | 3     |
| P1 broken or off-spec             | 15    |
| P2 consistency                    | 13    |
| P3 nit                            | 2     |

### Top 5 in fix order

1. **S1** One page container: remove the `px-gutter` / `md:px-0` pairs and put the gutter in one place.
2. **S2** Halal trust claims that are hard-coded or fake: "all certificates verified", the "Halal certified" chip that does nothing, "Free shipping" on every product.
3. **S3** Dark theme never remaps brand, promo, rating and halal tokens (nav active text 1.53:1).
4. **S5** Product detail: no quantity stepper, red rating numeral, rating shown with zero reviews, a Variation selector with no variations.
5. **S4** Seed and fixture data is random and self-contradictory (name, category, photo, location, rating, lorem).

### Verdict per shell

- **Header and nav:** structurally sound (constant weight, `aria-current`, 2px indicator). Left edge is off by 12px and dark mode fails.
- **Home:** layout is fine, edges are inconsistent, and fixture data is the main problem.
- **Category:** weakest page. It has fake filters and counts, no sort state and no loading, empty or error state.
- **Product detail:** missing core purchase controls and a wrong-data shipping row.
- **Footer:** layout is correct. Placeholders and unconditional claims remain.

## Systemic issues

### S1. Two competing horizontal-padding systems (P1)

**Cause (confirmed).** `.mx-auto.max-w-container` is 1240px. The header, nav and footer pad their inner row with `px-gutter` (24px at md+): `site-header.tsx:86,186`, `site-footer.tsx:93`. Pages then use `px-gutter md:px-0` (or `lg:px-0`) on some blocks and plain `px-gutter` on others.

- Padded at all sizes: hero `home.tsx:43`, trust list `:67`, category title block `category.tsx:44`, shop banner `product.tsx:200`, gallery/title grid `product.tsx:75` (`lg:px-gutter`).
- Flush at md+ (0px): home headings and grids `home.tsx:87,90,105,123,134`; category chips and grid `category.tsx:56,73,97`; product sections `product.tsx:206,259,282` (`lg:px-0`), related list `:315,318`.

Result: blocks that are padded sit 24px inside the header edge, blocks that are flush sit on the container edge, and headings and grids stick out 24px past the header.

**Affected (observed).**

- Category 1280: title 147 vs chips/grid 113.
- Home 1280: hero/trust strip 83 vs "Categories" heading/grid 64.
- Product 1280: shop banner 110 vs section headings/boxes 85.

At 360 the edges align (category title and grid both at 23).

**Also (confirmed).** Nav first-item text sits 12px inside the logo edge: `ul px-gutter` (`site-header.tsx:186`) plus link `px-3` (`:24`). Observed on category 1280: nav 163 vs logo 147.

**Fix.** One wrapper with `mx-auto max-w-container px-gutter` in `public-layout.tsx`, and delete every page-level `px-gutter`, `md:px-0`, `lg:px-0` pair. Give horizontal scrollers a negative margin equal to the gutter so they bleed to the screen edge on mobile. Offset the nav list by `-mx-3` so item text aligns with the container edge.
**Test.** Playwright: at 360, 768, 1280 assert the `left` of the logo, nav first item text, breadcrumb, h1, first chip, first card and footer brand are within 1px of each other.

### S2. Trust claims and controls that are not backed by data (P0)

All confirmed in code.

- **C1** `category.tsx:48-49` prints `{products.data.length}+ products · all certificates verified`. The count is the length of the current cursor page plus "+", not a total. The certificate claim is a hard-coded string and is shown regardless of `halal_status`. Observed: "4+ products · all certificates verified".
- **C2** `category.tsx:90` renders `<Chip pressed>Halal certified</Chip>` with no handler and no state. `ListCategoryProducts::handle(Category, string $sort)` (`app/Actions/Catalogue/ListCategoryProducts.php:14`) takes only a sort, so no halal filter exists server-side. Observed: filter shown as on, no card has a halal badge.
- **C3** Sort chips (`category.tsx:75-89`) never read the current `sort` and never set `pressed`, so no sort looks selected. `relevant` is also the default branch of `match` (`ListCategoryProducts.php:25`): it orders by `sold_count`, not relevance. The Price chip's `price_asc` never offers descending even though the action supports `price_desc`.
- **C4** `product.tsx:130` hard-codes `Free shipping · ${p.location}` for every product. It ignores `free_shipping`. `:131` hard-codes the returns line.
- **C5** `product.tsx:140-155` shows a "Variation: Default" button for every product, including products with none.
- **C6** `product-card.tsx:226-260` (compact) renders `OffBadge` (-NN%) but passes no `was` to `PriceBlock`. Observed: "Halal marshmallows" -30% in "You may also like" with no old price.
- **C7** The nav "Sell on …" and "Help" are `href="#"` (`site-header.tsx:210,213`).

**Fix.** Remove the hard-coded claims. Derive counts, claims and shipping text from data. Make filter and sort chips URL-driven. Add a halal filter to the action. Pass `was` to the compact card. Hide the variation row without variations.
**Test.** Feature test: certified filter returns only `halal_status = certified`. Vitest: the subtitle never contains "verified" unless every item on the page is certified.

### S3. Dark theme does not remap brand colours (P1)

**Cause (confirmed).** The `.dark` block (`app.css:236-293`) redefines surfaces, text, borders, ring and the `*-soft` tints. It does **not** redefine `--brand-*`, `--primary`, `--promo`, `--rating-foreground`, or the `--halal` family. Components use them as text on dark surfaces (nav active `text-brand-700`, `site-header.tsx:28`; `text-primary` links; `text-promo` in `.badge-promo`, `app.css:868`).
**Measured (computed from hex).** See the contrast table. The worst case is the nav active label at 1.53:1. The dark shadcn tokens also use unrelated greys (`--card: hsl(0 0% 3.9%)`, `app.css:262+`), which do not match `--surface #181f1b`.
**Not verified.** I did not render dark mode, so how many screens are visibly affected is a hypothesis. The token arithmetic is not.
**Fix.** Add dark values for the text-use tokens (spec WP-1.3). Remove the shadcn leftovers or map them to surface tokens.
**Test.** Unit script that parses `app.css`, resolves each text/background token pair in both themes and fails under 4.5:1 (text) or 3:1 (UI).

### S4. Fixture data is random and self-contradictory (P1)

**Cause (confirmed).** `CatalogueSeeder.php:199-215`: filler products get `category_id => $tops->random()`, an image from a 6-item rotation (`$fillerImages[$i % 6]`), and a `ProductFactory` row. `ProductFactory.php:22,30,33,35` sets name from 4 random Faker words, `description` from `fake()->paragraph()` (Latin lorem), `rating` random 4.0 to 5.0 with no reviews, `sold_count` random 0 to 25000, and `location` random per product. The shop's own `location` is a separate random pick (`ShopFactory.php:26`).

So name, category, photo, rating and location are independent, and a product can be listed in Cotabato and ship from Taguig. The names in your screenshots (for example "Halal marshmallows, vanilla 200g") are not in the seeder I read. Your screenshot data comes from a different seed or database, which I could not see (see Open questions).

**Fix.** One authored catalogue. Derive `rating` and `sold_count` from reviews and orders (or null). Product `location` comes from the shop or from one `ships_from` field.
**Test.** Seeder test: every product's image filename belongs to its category, every certified product has a certification, and `rating` is null when `reviews_count = 0`.

### S5. Product detail is missing core controls and shows contradictory trust signals (P1)

All confirmed.

- No `QuantityStepper` is imported or rendered (`product.tsx` imports at 1-23). The component exists (`quantity-stepper.tsx`).
- Rating numeral uses `text-sale` (`product.tsx:290`): the promo red-orange colour on a rating.
- The rating, stars, "ratings" link and "19.4k sold" show with zero reviews (`:88-99`, `:289-310`). `p.rating` is a random column.
- "Authenticity" row (`:132-137`) repeats what the halal panel says. For non-certified products it shows "Muslim-friendly product". The "Halal status → Muslim-friendly (no certificate needed)" panel in your 1280 and 360 screenshots does not exist in `product.tsx` at HEAD (the only certification block is `:203-256`, rendered only when `cert` is set). See Open questions.
- Shipping location and "Ships from" both use `p.location`, which is random per product (S4).

**Fix.** WP-3.3. **Test.** Playwright: the product page for a product with 0 reviews has no rating numeral, and the stepper exists with min 1 and max `stock`.

### S6. Stepper focus ring is clipped (P1)

**Cause (confirmed).** `quantity-stepper.tsx:43` the container is `overflow-hidden` with no `.focus-ring` class. The −/+ buttons ring through the global `:focus-visible` rule (`app.css:601-613`) with a 2px offset, so the ring is clipped by `overflow-hidden`. The input sets `focus-visible:outline-offset-0` (`:74`), so it rings separately from the buttons. This is the exact composite-control case the base layer already handles with `.focus-ring` (`app.css:625-656`), which also zeroes the inner outlines.
**Fix.** Add `focus-ring` to the container, and remove `overflow-hidden` or switch to `focus-ring-inset`.
**Test.** Playwright: focus the stepper's "+" button, screenshot-compare the container ring.

### S7. Chips: sort and filter share one style, selected state is the only cue, navigation is exposed as toggles (P1/P2)

**Confirmed.**

- `chip.tsx:24` fixed style for all chips (13px/700, `text-label` weight 700 at `app.css:414`), 1px `border-control` (#818b84, 3.52:1 on white).
- `chip.tsx:22` always sets `aria-pressed`, including on subcategory chips (`category.tsx:59-67`) and sort chips, which navigate with `router.get`. Screen readers announce navigation as a toggle that is "not pressed".
- Sort and filter chips are one row and one group (`category.tsx:70-91`). The filter chip is distinguished only by green fill and a check.
- The chip rows scroll with no edge fade (`category.tsx:56,73`), while the nav has a mask (`site-header.tsx:186`). Observed at 360: "Beverage…" and "Halal certified" cut off.

**Fix.** WP-2.4. **Test.** a11y: sort controls are `role="radio"` in a `role="radiogroup"` (or links), and filters are `aria-pressed` buttons.

### S8. Footer: correct structure, placeholder values and unconditional claims (P2)

**Confirmed.**

- Link pitch is `min-h-9` (36px) plus `gap-3` (12px) = 48px (`site-footer.tsx:19,44`). That equals the observed ~67 image px at the inferred 1.39 scale, so the "grid row stretching" hypothesis is **refuted**. The columns are independent flex columns; rows line up only because each link is the same height. A wrapped label ("Privacy (Data Privacy Act notice)") shifts only its own column.
- `config/marketplace.php:20` default `support@example.com`, `:24` default `DTI Business Name Reg. No. 0000-0000`. `site-footer.tsx:169-175,194` always renders them.
- `config/marketplace.php:26,28` hard-code payment methods and couriers. `site-footer.tsx:103-126` renders them unconditionally.
- On wide screens the footer left edge matches the header; on mobile the accordions work (`site-footer.tsx:55-76`). The 5-column grid (`:130`) is 1.4fr + 5×1fr.

**Fix.** WP-2.5.

## Screen tables

### Home

| ID  | Sev | BP   | Finding                                                                                                                               | Evidence                                                                                                                                                               |
| --- | --- | ---- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1  | P1  | 768+ | Hero and trust strip inset 24px vs headings/grid. S1                                                                                  | `home.tsx:43,67` vs `:87,134`. Screenshot: hero 83, headings 64 (1280)                                                                                                 |
| H2  | P1  | all  | Products' halal badge inconsistent: shown on prayer beads, bottled water, henna cone; absent on "Halal marshmallows", "Halal gelatin" | Observed. Cause is data: `showHalalBadge` (`product-card.tsx:34-39`) keys on `halal_status` and category slug, not the name. Names and categories are independent (S4) |
| H3  | P2  | all  | Category row has 10 tiles including Home & Living and Vouchers; the top nav shows 8                                                   | Observed. Cause not checked (nav uses `navCategories`, row uses `categories`)                                                                                          |
| H4  | P2  | all  | Photos contradict names (chicken photo on "Bottled water", fish on "Black seed oil", manicure on "Dates energy bars")                 | Observed. S4                                                                                                                                                           |
| H5  | P2  | 1280 | Last row has 4 of 5 cards; fine, but infinite-scroll has no end state                                                                 | Observed. Not verified in code                                                                                                                                         |

### Category

| ID  | Sev | BP   | Finding                                                                                                             | Evidence                                                                   |
| --- | --- | ---- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| C1  | P0  | all  | "4+ products · all certificates verified" is hard-coded and counts the page                                         | `category.tsx:48-49`                                                       |
| C2  | P0  | all  | "Halal certified" chip on, does nothing; no halal badges on any card                                                | `category.tsx:90`, `ListCategoryProducts.php:14`                           |
| C3  | P1  | all  | No sort selected state; "relevant" is sort by sales                                                                 | `category.tsx:75-89`, `ListCategoryProducts.php:25`                        |
| C4  | P1  | 768+ | Title block 24px inside chips and grid. S1                                                                          | `category.tsx:44` vs `:56,73,97`. Observed 147 vs 113                      |
| C5  | P2  | 1280 | Four cards leave the 5th column empty. This is 4 products in a 5-col grid (`product-card.tsx:344`), not a width bug | Observed: 4 cards span 4 of 5 columns                                      |
| C6  | P1  | all  | No loading, empty or error state in the page                                                                        | No reference to `ErrorState`, `EmptyState` or `Skeleton` in `category.tsx` |
| C7  | P1  | all  | No pager or end-of-list text (relies on `InfiniteScroll`); fallback not verified                                    | `category.tsx:93-99`                                                       |
| C8  | P2  | 360  | Chip rows clipped at the right with no fade                                                                         | Observed: crop of the 360 shot; `category.tsx:56,73`                       |
| C9  | P2  | all  | Chips are 13px/700 with 3.5:1 outlines; sort and filter look identical                                              | `chip.tsx:24`, `app.css:414`                                               |
| C10 | P1  | all  | Subcategory and sort chips expose `aria-pressed="false"`                                                            | `chip.tsx:22`                                                              |
| C11 | P2  | all  | Card names, categories and photos contradict (Halal Food page: Abaya, Miswak)                                       | Observed. S4                                                               |

### Product detail

| ID  | Sev | BP   | Finding                                                                                                                                      | Evidence                                                       |
| --- | --- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| P1  | P0  | all  | "Free shipping" hard-coded for every product                                                                                                 | `product.tsx:130`                                              |
| P2  | P1  | all  | No quantity stepper                                                                                                                          | `product.tsx` imports; observed                                |
| P3  | P1  | all  | Rating numeral red-orange (`text-sale`)                                                                                                      | `product.tsx:290`. Observed                                    |
| P4  | P1  | all  | Rating, stars and "ratings" link with 0 reviews; "No reviews yet" next to 4.2                                                                | `product.tsx:88-99,289-310`; factory `ProductFactory.php:33`   |
| P5  | P1  | all  | Variation row for a product with no variations                                                                                               | `product.tsx:140-155`                                          |
| P6  | P2  | all  | Authenticity row duplicates halal info; for non-certified products there is a "Halal status" panel in the screenshot that is not in the code | `product.tsx:132-137`; screenshot vs HEAD (see Open questions) |
| P7  | P2  | all  | Shop in Cotabato, ships from Taguig; lorem description                                                                                       | `ProductFactory.php:30,35` vs `ShopFactory.php:26`             |
| P8  | P2  | 768+ | Shop banner 25px inside section blocks. S1                                                                                                   | `product.tsx:200` vs `:206,259,282`. Observed 110 vs 85        |
| P9  | P1  | all  | Compact related card shows -30% without old price                                                                                            | `product-card.tsx:226-260`                                     |
| P10 | P2  | all  | "You may also like" names truncated to one line ("Miswak natural t…")                                                                        | `product-card.tsx:239` (`truncate`). Observed                  |
| P11 | P3  | all  | "1 of 1" counter and single thumbnail for a one-image gallery                                                                                | Observed. `carousel.tsx` not read                              |
| P12 | P1  | all  | Stepper (when added) ring clipped. S6                                                                                                        | `quantity-stepper.tsx:43,74`                                   |

### Shells

| ID  | Sev | BP   | Finding                                                                                                                                  | Evidence                                      |
| --- | --- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| X1  | P1  | 768+ | Nav first item 12px inside the logo edge                                                                                                 | `site-header.tsx:24,186`. Observed 163 vs 147 |
| X2  | P2  | all  | "Sell on" and "Help" are dead `#` links                                                                                                  | `site-header.tsx:210,213`                     |
| X3  | P1  | dark | Brand/promo/rating tokens not remapped. S3                                                                                               | `app.css:236-293`                             |
| X4  | P2  | all  | Footer placeholders and unconditional claims. S8                                                                                         | `config/marketplace.php:20,24,26,28`          |
| X5  | P3  | all  | Nav active state only on `/categories/*`; product and home show none. This is acceptable, but product pages could highlight the category | `site-header.tsx:49-51`                       |

## Contrast table (computed from tokens, WCAG 2.x)

Method: relative luminance from the hex values in `resources/css/app.css`, ratio = (L1+0.05)/(L2+0.05). Not sampled from rendered pixels.

| Pair                                                    | Ratio | Need           | Result                                 |
| ------------------------------------------------------- | ----- | -------------- | -------------------------------------- |
| muted text `#566159` on surface `#ffffff`               | 6.46  | 4.5            | pass                                   |
| muted on background `#f7f8f6`                           | 6.07  | 4.5            | pass                                   |
| muted on footer `#fafbfa`                               | 6.23  | 4.5            | pass                                   |
| muted on `--surface-muted`                              | 5.74  | 4.5            | pass                                   |
| white on `--promo #c2310f` (tag)                        | 5.61  | 4.5            | pass                                   |
| `--rating-foreground #8a5a00` on white                  | 5.93  | 4.5            | pass                                   |
| star amber `#d99b25` on white                           | 2.42  | 3 (decorative) | decorative only, value is also printed |
| focus ring light `#17643c` on white                     | 7.18  | 3              | pass                                   |
| focus ring light on bg `#f7f8f6`                        | 6.74  | 3              | pass                                   |
| focus ring dark `#78a68d` on dark surface `#181f1b`     | 6.11  | 3              | pass                                   |
| focus ring dark on dark bg `#0f1512`                    | 6.72  | 3              | pass                                   |
| `--border-control #818b84` on white (chips, inputs)     | 3.52  | 3              | pass                                   |
| `--border-control` dark `#55645b` on `#181f1b`          | 2.69  | 3              | **fail**                               |
| halal `#0b6657` on `--halal-soft #e2f4ef`               | 6.03  | 4.5            | pass                                   |
| nav hover `brand-700` on `brand-50`                     | 9.76  | 4.5            | pass                                   |
| **dark:** `--primary #17643c` text on `#181f1b`         | 2.34  | 4.5            | **fail**                               |
| **dark:** `brand-700 #10452d` (nav active) on `#181f1b` | 1.53  | 4.5            | **fail**                               |
| **dark:** `--promo` text on `--promo-soft #33160e`      | 2.96  | 4.5            | **fail**                               |
| **dark:** `--promo` on `#181f1b`                        | 2.99  | 4.5            | **fail**                               |
| **dark:** `--rating-foreground` on `#181f1b`            | 2.83  | 4.5            | **fail**                               |
| muted dark `#a3b3a8` on `#181f1b`                       | 7.65  | 4.5            | pass                                   |

## Regression table (your findings 1-10)

"Status" compares your finding with the code and screenshots at HEAD.

| #                                         | Status                             | Evidence                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Left edges differ                       | **Not fixed** (cause confirmed)    | S1. Offsets are the 24px gutter.                                                                                                                                                                                                                                                                                                                               |
| 2 Grid fills 2/3                          | **Not a defect (cause confirmed)** | 4 products in a 5-column grid, `product-card.tsx:344`. Add a fuller fixture and the pager.                                                                                                                                                                                                                                                                     |
| 3 Footer spacing / row stretching         | **Cause refuted**                  | Pitch is `min-h-9`+`gap-3` = 48px; not a stretching grid. Placeholders **not fixed** (S8).                                                                                                                                                                                                                                                                     |
| 4 Product detail items                    | **Not fixed**                      | No stepper; `text-sale` rating (`:290`); no-reviews + rating (`:289-310`); location mismatch (S4); lorem (`ProductFactory.php:30`). "Authenticity" row present (`:132`); the "Halal status" panel is in the screenshot but not in HEAD code (open question).                                                                                                   |
| 5 Halal badge inconsistent                | **Partially**                      | Rule exists and is consistent in code (`product-card.tsx:34-39`). The visible inconsistency comes from data (S4). Rule uses a hard-coded slug set (`:19-23`) rather than a category flag.                                                                                                                                                                      |
| 6 Category header, chips, states          | **Not fixed**                      | S2 C1-C3, S7, C6, C7.                                                                                                                                                                                                                                                                                                                                          |
| 7 Names/categories/photos contradict      | **Not fixed**                      | S4.                                                                                                                                                                                                                                                                                                                                                            |
| 8 Category nav states                     | **Largely fixed in code**          | Default, hover (`bg-brand-50 text-brand-700`), active (`aria-current` + `after:h-0.5` indicator), focus (global ring); weight constant `font-medium` (`site-header.tsx:24-28`). Edge misaligned by 12px (X1). Dark fails (S3). Hover/focus not visually verified.                                                                                              |
| 9 Focus ring                              | **Partially**                      | One 2px / 2px-offset token ring exists (`app.css:166-172,601-613`), container pattern exists (`:625-656`), and there are no `focus:ring-*` overrides in pages. Exceptions: stepper (S6), `input-otp.tsx:46` uses `ring-2 ring-ring ring-offset-2`, `phone-input.tsx:115` and `two-factor-setup-modal.tsx:123` use `outline-none`. Not verified on text inputs. |
| 10 Danger red on prices/ratings/discounts | **Partially**                      | Prices use `text-foreground` (`price-block.tsx:42`). Discount uses `--promo` (not `--danger`) but its hue (#c2310f) reads as red next to `--danger #b42318`. Rating numeral uses `text-sale` (= promo) at `product.tsx:290`. Notification badges use `bg-sale` (`site-header.tsx:144,161`).                                                                    |

## Coverage gaps (re-shoot list)

- 768, 640 and 1024 for all three pages.
- Dark theme for all three pages at 360 and 1280.
- Nav hover and focus-visible, input focus, stepper focus (stepper does not exist on the page today), chip focus.
- Loading, empty and error on category (there are no such states in code).
- Product states: certified (with certificate card), under review, expiring, expired, missing, Muslim-friendly (seen), frozen (cold-chain note), out of stock, discounted (seen), long name.
- Mobile product at 360 without the sticky bar overlapping the price (viewport shot, not full page).

## Open questions

1. Where does the screenshot data come from? Names such as "Prayer beads, tasbih olive wood 99" are not in `CatalogueSeeder.php`. Is it a different seeder or a shared DB?
2. The product screenshots show a "Halal status" panel with "Muslim-friendly (no certificate needed)". `product.tsx` at HEAD has no such panel. Is the screenshot from a different build or local changes?
3. Is "Free shipping" meant to be universal (marketplace policy) or per product (`free_shipping`)?
4. What should "relevant" sort mean (today it is sales)?
5. Does `InfiniteScroll` render a manual "load more" or an end state? Not visible from the code or the screenshots.
6. Is `Product::visible()` supposed to hide products with expired or missing certificates?
7. Why does the home category row (10) differ from `navCategories` (8)?
