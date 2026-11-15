# Product Share Buttons & Share Counts — Spec, Implementation Plan & Tasks

|                  |                                                                                                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Repo**         | `mamaw-verse/b2c` @ `890d67e` (Laravel 13 + Inertia 3 + React)                                                                                                                                                                        |
| **Feature**      | Product detail page share bar (Copy link, Facebook, Messenger, Instagram via native share, X) with share counts                                                                                                                       |
| **Derived from** | A share-feature task list written for a different codebase (`b2b-marketplace`, Livewire/Blade/Alpine). This document keeps its product decisions and re-plans the implementation for this stack; §0.3 lists what was dropped and why. |
| **Estimate**     | ≈ 4.5 engineer-days                                                                                                                                                                                                                   |

Sizing: S ≤ 0.5 day, M ≈ 1–2 days. Priority: P0 blocks later tasks, P1 core, P2 optional. Conventions in `.ai/rules/*` apply (Actions, one form request per endpoint, thin CRUD controllers, ULID tables, forward-only migrations, `git add` new files, never commit, e2e on all four projects).

I read the code at this commit but did not run it (`vendor/` and `node_modules/` are not installed here). Items marked **VERIFY** are covered by a task.

---

## 0. Findings and scope

### 0.1 What the repo already has

| Area                    | Today                                                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Product URL             | `GET products/{product:slug}` → `ProductController@show` → Inertia page `product`. Hidden/unpublished products 404 in `ShowProductRequest`.   |
| Page `<head>`           | `resources/js/pages/product.tsx:154` sets only `<Head title={p.name} />`.                                                                     |
| Clipboard + toasts      | `hooks/use-clipboard.ts` and `sonner` (`<Toaster>` in `app.tsx`).                                                                             |
| JSON-from-React pattern | `report-dialog.tsx` posts with `fetch`, `X-XSRF-TOKEN` from the cookie and `Accept: application/json`; `ReportController@store` returns JSON. |
| Feature flags           | `config/marketplace.php` → `features.product_video_enabled` (env `MARKETPLACE_PRODUCT_VIDEO_ENABLED`, default `false`).                       |
| Seller product pages    | `Seller\ProductController@index/edit`, `ListSellerProducts`, `pages/seller/products/{index,form}.tsx`; staff may use them (G-S1).             |
| Fallback image          | `public/images/brand/logo.png`; first product photo via `Product::thumbnailUrl()`.                                                            |

### 0.2 Findings that change the plan

| #   | Finding                                                                                                                                                                                                                                                                                                | Consequence                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1  | **There are no `og:*`, `twitter:*` or canonical tags.** `app.blade.php` only renders `<x-inertia::head>` and the Inertia SSR bundle is disabled (`config/inertia.php`, `ssr` block commented). Link previews are built by crawlers that **do not run JavaScript**, so a React `<Head>` would not help. | Task **T0** adds server-rendered meta tags. Without it, Facebook, Messenger and X shares show a bare link with no image or title. The source document assumed these existed. |
| H2  | No Livewire, Alpine, Blade components or Flux.                                                                                                                                                                                                                                                         | Tracking becomes a normal endpoint (T3) and the bar a React component (T4).                                                                                                  |
| H3  | No i18n files (`lang/` does not exist); English only.                                                                                                                                                                                                                                                  | Localisation and RTL tasks dropped.                                                                                                                                          |
| H4  | Product tables use ULIDs; money is centavos (not relevant here); migrations have no `down()`.                                                                                                                                                                                                          | Adjusted in T2.                                                                                                                                                              |
| H5  | Seller product pages are available to staff, but finance, vouchers and dashboard are owner-only.                                                                                                                                                                                                       | Share counts are non-financial and shown to owner **and** staff (no change to the permission matrix).                                                                        |
| H6  | `lucide-react` is `^0.475`; brand icons there are deprecated and there is no X or Messenger logo.                                                                                                                                                                                                      | Ship small inline SVG brand icons (T4).                                                                                                                                      |

### 0.3 Dropped from the source document

| Dropped                                                                                                             | Reason                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Livewire `#[Renderless] trackShare`, `RateLimiter` inside the component                                             | Not used here → controller + action + named limiter (T3).                                                                                                       |
| Blade `<x-hs-share-buttons>`, Alpine, `--hs-*` CSS variables                                                        | Replaced by a React component using this repo's design tokens (T4).                                                                                             |
| `lang/{en,ar,id,ms,tr}.json`, RTL checks                                                                            | Project has no i18n (H3).                                                                                                                                       |
| `ShopAnalyticsService`, `ProductPolicy`, `ProductForm`/`ProductList` Livewire classes, `CompanyHub`                 | Do not exist; `ListSellerProducts` and `Seller\ProductController@edit` are the equivalents. **No policies in this repo**: authorization stays in form requests. |
| Pest browser tests, `FeatureFlagTest`, `composer ci:check`, `.kiro/specs/phase8/tasks.md`, `.ai/rules` note wording | Replaced by Pest feature tests, Playwright e2e (four projects), `composer lint` + PHPStan, and this file.                                                       |
| "Previews already covered" (S-claims about `og:*` and a featured-image route)                                       | Not true here (H1). There is no `products.featured-image` route.                                                                                                |
| Postgres `onDelete('cascade')` snippet and `down()` rollback                                                        | Use `foreignUlid()->constrained()->cascadeOnDelete()`; forward-only migrations.                                                                                 |

### 0.4 Decisions

Kept from the source unless noted. Change in review if you disagree.

| #   | Decision                                                                                                                                                                                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | **No Facebook App ID.** Messenger is the mobile deep link `fb-messenger://share/?link=` and is **hidden on devices with a fine pointer** (desktop).                                                                  |
| S2  | **Instagram has no web share URL for links.** Its button calls `navigator.share()` and is shown only where the browser supports it. Desktop users get Copy link, Facebook and X.                                     |
| S3  | A "share" is **a click on a share action**; platforms do not report completion. Exception: `native` counts only when `navigator.share()` resolves (not on cancel). UI wording: "shares".                             |
| S4  | Channels: `copy`, `facebook`, `messenger`, `x`, `native`. Instagram cannot be counted separately; seller stats show `native` as "Mobile share sheet (incl. Instagram)".                                              |
| S5  | Counts are **daily aggregates per product and channel** (no IP or user id stored) plus a denormalised `products.share_count`.                                                                                        |
| S6  | Seller/staff see a total in the product list and a per-channel breakdown (all-time and last 30 days) on the edit page. The public sees a total only when it reaches `share_count_public_min` (default 5).            |
| S7  | Tracking is a small JSON endpoint on the existing public product route family, not a new subsystem.                                                                                                                  |
| S8  | **New:** the whole feature sits behind `marketplace.features.product_share_enabled` (default `false`), like product video. Meta tags (T0) are **not** behind the flag because they benefit any link pasted anywhere. |

### 0.5 Out of scope

Share counts on cards, shop pages or the home feed; click-through attribution (UTM, referrals); WhatsApp, LinkedIn, Telegram or other buttons; Facebook App ID features; sharing from the cart or order pages; any link between share counts and affiliates (affiliate work is parked, see `09-…plan.md` §5.0).

---

## T0. Server-rendered link-preview tags (0.5 d, P0)

**Files:** `resources/views/app.blade.php`, `app/Http/Controllers/ProductController.php`, new `app/Actions/Catalogue/BuildProductSeoMeta.php`, `tests/Feature/ProductSeoMetaTest.php`

- [ ] `BuildProductSeoMeta::handle(Product $product): array` returns `title`, `description`, `url`, `image`, `site_name`. `description` is the product description with tags stripped and whitespace collapsed, limited to ~200 chars (fall back to the product name). `image` is the first product photo made absolute with `url()` when it is relative, else `url('/images/brand/logo.png')`. `url` is `route('products.show', $product)`.
- [ ] `ProductController@show` passes it to the root view, for example `Inertia::render('product', [...])->withViewData(['meta' => $meta])` (**VERIFY** the exact Inertia 3 API for root-view data).
- [ ] `app.blade.php`: when `$meta` is set, print `<link rel="canonical">`, `og:type` (`product`), `og:title`, `og:description`, `og:url`, `og:image`, `og:site_name`, `twitter:card` (`summary_large_image`), `twitter:title`, `twitter:description`, `twitter:image`, and a `<meta name="description">`. Escape everything through Blade. Keep `<Head title>` in React as is; do not emit the same tags from React, to avoid duplicates.
- [ ] Hidden/unpublished products are already a 404, so nothing is emitted for them.
- [ ] Tests: published product response HTML contains each tag with the slug URL and an absolute image URL; no-photo product uses the brand logo; a description containing `<script>` is escaped/stripped; unpublished product 404.

**Done when:** `curl -s <product url>` (no JS) shows the tags, and the Facebook Sharing Debugger and X card preview read them (T7).

## T1. Config and flag (0.25 d, P0)

**Files:** `config/marketplace.php`, `.env.example`

- [ ] `features.product_share_enabled` → `(bool) env('MARKETPLACE_PRODUCT_SHARE_ENABLED', false)`.
- [ ] A `share` block: `public_min` (`MARKETPLACE_SHARE_PUBLIC_MIN`, default 5), `dedupe_minutes` (`MARKETPLACE_SHARE_DEDUPE_MINUTES`, default 10), `channels` (`copy`, `facebook`, `messenger`, `x`, `native`).
- [ ] Add the three env keys to `.env.example`.

**Done when:** the flag is `false` by default and existing tests still pass.

## T2. Data model for counts (0.5 d, P0)

**Files:** 2 migrations, `app/Models/ProductShareStat.php`, `app/Models/Product.php`, factory

- [ ] Migration `create_product_share_stats_table`: ULID `id`, `product_id` (`foreignUlid`, `cascadeOnDelete`), `channel` (string 20), `shared_on` (date), `count` (unsigned int, default 0), timestamps; unique `(product_id, channel, shared_on)`; index `(product_id, shared_on)`.
- [ ] Migration `add_share_count_to_products_table`: `unsignedInteger('share_count')->default(0)`; add `@property int $share_count` and the cast to `Product`. **Do not add it to `#[Fillable]`**; only the tracking action writes it.
- [ ] `ProductShareStat` (`final`, `#[Fillable]`, `product()`), `Product::shareStats()`, `ProductShareStatFactory`.

**Done when:** migrations run on a fresh database and on the current schema.

## T3. Tracking endpoint and action (0.75 d, P0)

**Files:** `routes/web.php`, `app/Http/Controllers/ProductShareController.php`, `app/Http/Requests/CreateProductShareRequest.php`, `app/Actions/Catalogue/RecordProductShare.php`, `app/Providers/AppServiceProvider.php`

- [ ] Route: `POST products/{product:slug}/shares` → `ProductShareController@store`, name `products.shares.store`, public (guests allowed), middleware `throttle:product-share`.
- [ ] Named limiter `product-share`: 30 per minute keyed by user id or IP, registered in `AppServiceProvider::boot()`. Over the limit the framework answers 429; the client ignores it.
- [ ] `CreateProductShareRequest`: `authorize()` mirrors `ShowProductRequest` (published and visible to buyers, otherwise `denyAsNotFound()`) and also returns not-found when the flag is off; `rules()`: `channel` required, `Rule::in(config('marketplace.share.channels'))`.
- [ ] `RecordProductShare::handle(Product $product, string $channel, string $fingerprint): bool`:
    1. De-duplicate with `Cache::add("share:{$product->id}:{$channel}:{$fingerprint}", 1, now()->addMinutes(config('marketplace.share.dedupe_minutes')))`; if it already existed return `false`.
    2. In one `DB::transaction`: upsert the daily `product_share_stats` row (`count + 1`) and `Product::whereKey($product->id)->increment('share_count')` (query-builder increment, so no model events).
    3. Return `true`.
- [ ] Fingerprint = `sha1(($user?->id ?? $ip).'|'.$userAgent)`. Neither the IP nor the user id is stored; only the short-lived cache key exists.
- [ ] The controller returns `response()->noContent()` whether or not the share was counted, so the response does not leak the de-dupe state. A failure inside the action is caught, reported (`report($e)`) and still returns 204.

**Done when:** posting `facebook` twice inside the window adds 1 to `share_count` and the daily row; an unknown channel returns 422; the flag off returns 404; a hidden product returns 404.

## T4. Share bar (React) (1 d, P1)

**Files:** `resources/js/components/share-buttons.tsx`, `resources/js/pages/product.tsx`, `resources/js/types/catalogue.ts`

- [ ] `ProductController@show` adds a `share` prop: `{ enabled, url, count }`, where `count` is `share_count` only when it is ≥ `public_min`, otherwise `null`. Leave `Product::toDetail()` untouched.
- [ ] `<ShareButtons url title text count />` renders nothing when `enabled` is `false`. Icon-only buttons (`aria-label`, ≥ 40 px, the same focus ring and tokens as the rest of `product.tsx`; semantic tokens only, `npm run check` must stay clean):

    | Button    | Behaviour                                                                                                                                                                         | Shown                                                    |
    | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
    | Copy link | `useClipboard()`; on failure fall back to a hidden `<textarea>` + `document.execCommand('copy')`. Success feedback with `toast('Link copied')` (sonner is an `aria-live` region). | always                                                   |
    | Facebook  | `<a href="https://www.facebook.com/sharer/sharer.php?u=…" target="_blank" rel="noopener noreferrer">`                                                                             | always                                                   |
    | X         | `<a href="https://x.com/intent/post?url=…&text=…" …>`                                                                                                                             | always                                                   |
    | Messenger | `<a href="fb-messenger://share/?link=…">`                                                                                                                                         | only when `matchMedia('(pointer: coarse)')` matches (S1) |
    | Instagram | button calling `navigator.share({ title, text, url })`; tooltip "Share via your phone's share sheet"                                                                              | only when `navigator.share` exists (S2)                  |

- [ ] Inline SVG brand icons for Facebook, X, Messenger and Instagram (H6); `lucide-react` `Link`/`Check` for copy.
- [ ] Each action calls a small `trackShare(channel)` helper: `fetch('/products/{slug}/shares', { method: 'POST', keepalive: true, headers: { 'X-XSRF-TOKEN': …, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ channel }) })`, **not awaited**, errors swallowed. Reuse the cookie/CSRF reading from `report-dialog.tsx`; extract it to a shared helper in `lib/` rather than copying it a third time. For `native`, track only inside the `.then()` of `navigator.share()` and ignore `AbortError`.
- [ ] Place the bar under the `<h1>` title block at `product.tsx` (~line 204), before the supplier line. Show `"{n} shares"` (singular when 1) beside it only when `count` is not `null`.
- [ ] Wraps on small screens (`flex-wrap`), checked at **360 / 768 / 1280**.

**Done when:** all five actions behave per the table, nothing renders with the flag off, and `npm run check` + `npm run types:check` pass.

## T5. Seller and staff stats (0.5 d, P1)

**Files:** `app/Actions/Seller/ListSellerProducts.php`, `app/Actions/Seller/GetProductShareBreakdown.php`, `app/Http/Controllers/Seller/ProductController.php`, `resources/js/pages/seller/products/{index,form}.tsx`

- [ ] `ListSellerProducts`: add `share_count` to the mapped rows (denormalised, no extra query); `index.tsx` adds a "Shares" column to the `DataTable` (hidden on `sm` if the table already scrolls horizontally, consistent with the other columns).
- [ ] `GetProductShareBreakdown::handle(Product $product, int $days = 30): array` → `['total', 'recent', 'by_channel' => [channel => ['all', 'recent']]]` using two grouped queries on `product_share_stats`.
- [ ] `Seller\ProductController@edit` adds `sharing` to the page props when the flag is on; `form.tsx` shows a read-only "Sharing" card (per-channel rows, `native` labelled "Mobile share sheet (incl. Instagram)"), only in edit mode.
- [ ] Authorization is unchanged: `EditSellerProductRequest` already allows owner and staff of the shop and returns not-found for other shops.

**Done when:** owner and staff see the column and the card for their own products; another shop's product behaves as it does today.

## T6. Tests (0.75 d, P1)

Pest feature tests (`RefreshDatabase`, existing factories) and Playwright.

**`tests/Feature/ProductShareTrackingTest.php`**

- [ ] valid channel: daily row created and `share_count` = 1
- [ ] repeat inside the window not counted; counted again after the window (`Carbon::setTestNow`)
- [ ] two different channels both count
- [ ] unknown channel 422; flag off 404; hidden and unpublished product 404
- [ ] the 31st request in a minute returns 429
- [ ] guest and signed-in buyer both allowed; no IP or user id column exists on the table
- [ ] an exception inside the action still returns 204

**`tests/Feature/ProductSeoMetaTest.php`** (T0) and **`tests/Feature/ProductShareBarPropsTest.php`**

- [ ] `share` prop: `enabled` follows the flag; `count` is `null` below `public_min` and the number at or above it

**`tests/Feature/Seller/ProductShareStatsTest.php`**

- [ ] list `share_count`; breakdown excludes rows older than 30 days from `recent`
- [ ] owner and staff of the shop see it; owner of another shop gets not-found

**e2e** (`tests/e2e/specs/product-detail.spec.ts` and `seller-products.spec.ts`; register new steps in `tests/e2e/scenarios.json`, tick `08-e2e-coverage-plan.md` §5)

- [ ] Copy link shows the toast and the network call to `/products/{slug}/shares`; Facebook and X links open with `target=_blank` and `rel` containing `noopener`
- [ ] Messenger is absent at `desktop-1280` and present on `mobile-360`/`iphone-safari`; Instagram appears only when `navigator.share` is stubbed
- [ ] the seller list shows the Shares column; axe passes with the bar present
- [ ] run on **desktop-1280, tablet-768, mobile-360, iphone-safari**

Gate: `composer lint`, PHPStan, `npm run check`, `npm run types:check`, then the e2e projects above.

## T7. Manual QA and release (0.25 d, P1)

- [ ] **VERIFY** previews: paste a published product URL into the Facebook Sharing Debugger and the X card preview; title, image and description must appear, and the image must load without login.
- [ ] **VERIFY** the Inertia root-view-data API used in T0 and that the page still hydrates normally.
- [ ] **VERIFY** on a real iPhone and an Android phone: the share sheet offers Instagram; the Messenger deep link opens the app (nothing happens without it; accepted).
- [ ] **VERIFY** desktop Chrome, Safari and Firefox over HTTPS: Messenger and Instagram buttons are hidden; Copy link works.
- [ ] Keyboard and screen-reader pass (tab order, `aria-label`s, toast announcement).
- [ ] Add a short note to `.ai/rules` or `docs/planning/03-architecture.md`: share tracking is `ProductShareController` → `RecordProductShare`; counts are clicks, not completions; Instagram is reachable only through native share.
- [ ] Rollout: deploy with the flag **off** (T0 meta tags go live immediately) → run migrations → enable `MARKETPLACE_PRODUCT_SHARE_ENABLED` in staging → QA → production. Rollback: turn the flag off; tables stay.

---

## Task summary

| Task                            | Est.        | Depends on                                                                  |
| ------------------------------- | ----------- | --------------------------------------------------------------------------- |
| T0 Link-preview meta tags       | 0.5 d       | n/a                                                                         |
| T1 Config and flag              | 0.25 d      | n/a                                                                         |
| T2 Data model                   | 0.5 d       | T1                                                                          |
| T3 Tracking endpoint and action | 0.75 d      | T1, T2                                                                      |
| T4 Share bar (React)            | 1 d         | T1, T3                                                                      |
| T5 Seller and staff stats       | 0.5 d       | T2                                                                          |
| T6 Tests                        | 0.75 d      | T0, T3 – T5                                                                 |
| T7 QA and release               | 0.25 d      | all                                                                         |
| **Total**                       | **≈ 4.5 d** | T0, T1 and T2 can start in parallel; T4 and T5 can run in parallel after T3 |

## Risks

| Risk                                                                        | Mitigation                                                                           |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Without T0 the buttons work but shared links look empty (H1)                | T0 is P0 and ships regardless of the flag.                                           |
| No SSR, so a React `<Head>` cannot serve crawlers                           | Tags are rendered by Blade from root-view data, not React.                           |
| Counts are clicks, not completed shares, and can be inflated                | De-dupe window, per-visitor rate limit, "shares" wording, S3 documented.             |
| Instagram cannot be counted or deep-linked on desktop                       | Native share on supported browsers only; stats group it under "Mobile share sheet".  |
| Messenger deep link fails silently without the app and is hidden on desktop | Mobile-only; Copy link is the universal fallback.                                    |
| Public endpoint can be spammed                                              | Named throttle, per-fingerprint de-dupe, silent client errors, 204 for all outcomes. |
| Clipboard API needs HTTPS and may be blocked                                | `execCommand` fallback; confirm only on success.                                     |
| Inertia root-view-data API differs in v3                                    | Verified in T0 before building on it (T7 also re-checks).                            |
