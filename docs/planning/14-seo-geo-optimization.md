# SEO & GEO Optimization — Implementation Plan and Tasks

**Repo:** `mamaw-verse/b2c` (HalalBenta, Laravel + Inertia/React 19 + Tailwind 4, Pest tests)
**Branch audited:** `production` (the repo has no `main` branch; `production` is the default, `develop` also exists)
**Scope:** Schema.org vocabularies as JSON-LD · Open Graph / social / AI preview signals · GEO (Generative Engine Optimization)

---

## 0. Implementation status

Phase 0, Phase 1, Phase 2 (rich entity schema) and most of Phase 3 (social/AI preview tags) are implemented. Everything below is **un-run in CI**: it was written
and linted (`php -l`, Pint) but the Pest suite still needs to be run locally
(`php artisan test --compact --filter=Seo` and `tests/Unit/SchemaGraphTest.php`).
Phase 2 tests live in `tests/Feature/SeoProductSchemaTest.php`, Phase 3 tests in `tests/Feature/SeoSocialTagsTest.php`.

| Task | Status | Notes |
|---|---|---|
| T0.1 Remove static SEO artifacts | Done | Deleted `public/robots.txt` + 5 sitemap files; patterns added to `.gitignore`. **Still verify on the deployed server** that `/robots.txt` and `/sitemap.xml` reach Laravel (`try_files`). |
| T0.2 `@context` hotfix | Done | `SchemaGraph::encode()` wraps a bare node list in `@context` + `@graph`; superseded by T1.3 (builders now emit a full document). |
| T0.3 `config/seo.php` | Done | Private paths, exceptions, noindex-follow paths, faceted query params and AI crawler policy live in one file. `RobotsController` (via `BuildRobotsTxt`), `SeoData::isPrivatePath()`/`defaultRobots()` and `EnforceSeoStandards` all read it. |
| T0.4 Logo URLs | Done (see erratum) | Single `config('seo.logo_path')` → `/brand/halalbenta-icon-512.png` (512×512), exposed through `SeoData::logoUrl()`. |
| T0.5 Shop rating honesty | Done | `aggregateRating` from real, non-hidden product reviews only; no `followers_count` fallback. |
| T0.6 Real `lastmod` | Done | Index uses `max(updated_at)` per child; static pages omit `<lastmod>` instead of faking "now". Cache invalidation hooks already existed on Product/Shop/Category. |
| T0.7 Inertia SSR everywhere | **Not started** | Needs deploy/infra decisions (compose, CI `build:ssr`, health check, crawler-UA smoke test). |
| T1.1 `SchemaGraph` + `SchemaId` | Done | `app/Support/Schema/`. |
| T1.2 Sitewide nodes | Done | `BuildOrganizationNode`, `BuildWebSiteNode` (`EntryPoint` search action). Full on home, about and why-choose-us; other pages reference by `@id`. |
| T1.3 Migrate builders | Done | Home, Product, Category, Shop, Sellers, Content, WhyChooseUs, SellerTerms, plus the `SeoData::fallback()`. Product schema content itself is unchanged (Phase 2) apart from `@id`/`url`/`seller` linking. |
| T1.4 Safe Blade output | Done | `SchemaGraph::encode()` uses `JSON_HEX_TAG\|JSON_HEX_AMP`. |
| T1.5 `WebPage` wrapper | Done | `BuildWebPageNode` on every page (`isPartOf`, `breadcrumb`, `primaryImageOfPage`, `mainEntity`). |
| T1.6 Regression tests | Done | `tests/Feature/SeoTest.php` (graph validity, `@id` resolution, XSS, shop ratings, robots parity, sitemap lastmod) and `tests/Unit/SchemaGraphTest.php`. |
| T4.1 AI-crawler policy | **Partly pulled forward** | `config('seo.ai_crawlers')` + generated robots groups (each repeats private disallows). Default: allow search/answer bots and training bots; set `SEO_BLOCK_AI_TRAINING=true` to block training crawlers. **Business decision still required; verify bot names with each vendor.** |
| T2.1 Product node | Done | `BuildProductNode`: `@id`, `url`, full sanitized description (5,000 char cap; falls back to the meta description when empty), absolute `image[]`, `sku`, `brand` (shop name; no brand field exists), `category` path text, `weight` (`KGM`), `additionalProperty` for halal status, ingredients and certificate details, `hasCertification`. Certificate details are published only while the certificate is valid. `gtin`/`mpn` omitted (not stored, T4.8). |
| T2.2 Offers, shipping, returns | Done (3 deviations) | `BuildOfferNode`: price, `PHP`, availability, `itemCondition`, `seller` → shop `@id`, `hasMerchantReturnPolicy` from `config('marketplace.return_window_days')` (0 → `MerchantReturnNotPermitted`). **Deviations:** (1) `priceValidUntil` is omitted, there is no price-expiry field and a rolling date would be invented; (2) `shippingDetails` is emitted only for `free_shipping` (rate `0.00`) because no per-product rate exists; handling time comes from `seller_terms.ship_within_days` when set; (3) the sale price uses `priceType: StrikethroughPrice` (Google's documented value) instead of `ListPrice`. Re-check all three in the Rich Results Test. |
| T2.3 Variants | Done | Decision: **`ProductGroup` + `hasVariant`** (per-variant `sku`, `size`/`color`, own `Offer`), `variesBy` mapped to schema.org `size`/`color` when the option name matches. Variant URLs stay as `?variant=` deep links; the page canonical stays clean. |
| T2.4 Reviews and ratings | Done (see note) | `BuildReviewNodes`: `aggregateRating` and up to 5 recent `Review` nodes from non-hidden reviews only; anonymous reviewers are `Anonymous`; seller replies are never emitted. **Note:** this is one aggregate query per render, not a stored `reviews_count` column. The visible page still reads `products.rating` and counts hidden reviews in `toDetail()`, so the on-page number can differ from the schema until that is aligned (follow-up). |
| T2.5 Shop node | Done (kept `Store`) | `BuildShopNode` (extracted from the builder). Kept `@type: Store` so existing `@id`s and tests stay stable; added `areaServed` and a `hasOfferCatalog` outline of the categories the shop really sells in. Only city/region are published, never street address, postal code, contact, permit or payout data (test covers head and JSON-LD). There is still no seller opt-in for a public address. |
| T2.6 Category and listing pages | Done | `BuildItemListNode` can emit typed `ListItem.item` stubs sharing the detail page's `@id`: Product stubs on categories, Store stubs on the sellers directory. Self-referencing canonicals and prev/next were already in place. |
| T2.7 Shared breadcrumb | Done | Product breadcrumbs and `Product.category` now include every category ancestor (root first). |
| T2.8 Video | **Deferred** | `VideoObject` needs a stable public `contentUrl` and a `thumbnailUrl`. Product videos are served through `media.view`, a short-lived signed redirect with `private` caching, and no thumbnail is stored. Revisit once videos have a stable public URL and poster image. |
| T3.1 Complete OG/Twitter set | Done (partly) | Added `og:image:secure_url` (https only), `og:updated_time` (products), `twitter:site` (from `SEO_TWITTER_HANDLE`, omitted when unset), `product:category`, and `product:sale_price:*` (with `product:price:amount` now the list price when discounted). `article:*` tags are supported by the template, but no content page has real published/modified dates yet, so none are emitted. Facebook Debugger / LinkedIn / X validators still need a manual pass (T5.2). |
| T3.2 Real product photo as `og:image` | Done | Configured via `config('seo.prefer_photo_og.product')` (default true); product og:image uses primary photo and falls back to generated card when no photo is uploaded. |
| T3.3 Harden `GenerateSocialImage` | Done | Bundled LiberationSans fonts in `resources/fonts/`, fail-soft with `report($e)`, defensive text wrapping against overflow, immutable Cache-Control only with `?v=`, and `PreWarmSocialImageJob` dispatched on product publish. |
| T3.4 `og:type` and labels | Done | `halal-verification` is `article`; shops get a Location label and categories an Items label. Home, category and shop stay `website`. |
| T3.5 Share-link hygiene | Done | Clean canonical route provided in Inertia share props; canonical URL builder strips tracking parameters (UTM, fbclid, etc.); test covers parity. |
| T3.6 AI preview meta | Done | Added `<meta name="author">` on content and editorial pages (`halal-verification`, `about`, `terms`, `privacy`, `why-choose-us`); preview robots directives and titles active. |
| T3.7 Favicon and app signals | Done | 180×180 apple-touch-icon verified, 32×32 PNG icon generated (`/favicon-32x32.png`), added `<meta name="application-name">`, and updated `manifest.webmanifest` with `id: "/"`, `lang: "en-PH"`, and `categories: ["shopping"]`. |
| Phases 4 (rest), 5 | Not started | |

**Erratum to G3.** `public/images/brand/logo.png` does exist (a 959×246 wordmark), so it was not a 404. It was still
the wrong asset for `Organization.logo` (not square, and inconsistent with the other references), so all references
were consolidated onto the 512×512 square icon.

**New env vars:** `SEO_FORCE_NOINDEX`, `SEO_SITE_NAME`, `SEO_SOCIAL_TIKTOK`, `SEO_SOCIAL_LINKEDIN`,
`SEO_SOCIAL_GOOGLE_BUSINESS`, `SEO_TWITTER_HANDLE`, `SEO_CONTACT_PHONE`, `SEO_AI_CRAWLER_GROUPS`,
`SEO_BLOCK_AI_TRAINING` (all optional). Existing `MARKETPLACE_SOCIAL_*` and `MARKETPLACE_SUPPORT_EMAIL` feed `sameAs`/`contactPoint`.

---

## 1. Where the repo stands today

A lot of SEO groundwork already exists. This plan **extends and fixes** it rather than starting over.

**Already in place**

| Area | Location |
|---|---|
| Per-page SEO value object + resolver | `app/Support/Seo.php`, `app/Support/SeoData.php` |
| Per-page builders (home, product, category, shop, sellers, search, content, why-choose-us, seller terms) | `app/Actions/Seo/Build*SeoData.php` |
| Head rendering (canonical, robots, OG, Twitter, `product:*`, prev/next, hreflang, JSON-LD) | `resources/views/app.blade.php` |
| Dynamic 1200×630 social images (GD) | `GenerateSocialImage`, route `social/{type}/{slug}.jpg` |
| Sitemap index + pages/categories/shops/products | `Build*Sitemap` actions, `routes/web.php` |
| `robots.txt` route, `X-Robots-Tag`, canonical redirects | `RobotsController`, `EnforceSeoStandards` middleware |
| Feature tests | `tests/Feature/SeoTest.php` |

**Gaps found (these drive the tasks below)**

| # | Finding | Evidence | Severity |
|---|---|---|---|
| G1 | **JSON-LD has no `@context`** on every page except the fallback. Builders return bare arrays like `[$breadcrumbSchema, $productSchema]` and Blade `json_encode`s them directly. Search engines will not treat this as valid structured data. | `BuildProductSeoData`, `BuildShopSeoData`, `BuildHomeSeoData`, `BuildCategorySeoData`, etc.; only `SeoData::fallback()` sets `@context`. `SeoTest.php` has no assertion on `@context`, so tests don't catch it. | **Critical** |
| G2 | **Committed static sitemaps and `robots.txt` in `public/`** contain `http://localhost:8000` URLs. A static file in `public/` is normally served by the web server before Laravel's dynamic route runs, so these can shadow `/sitemap.xml` and `/robots.txt`. The static `robots.txt` also lacks the non-production `Disallow: /` guard. | `git ls-files public` lists `sitemap*.xml` and `robots.txt`; `public/sitemap.xml` references `localhost:8000`. | **Critical** (verify on the deployed server) |
| G3 | **Broken logo URLs** in schema and fallback meta: `/images/brand/logo.png` is referenced but only `public/images/brand/icon.png` exists. Organization logo is also inconsistent (`/brand/halalbenta-icon-512.png` vs `/images/brand/logo.png`). | `BuildHomeSeoData`, `BuildProductSeoMeta`, `SeoData::fallback` | High |
| G4 | **Shop `aggregateRating.reviewCount` uses `followers_count`.** Followers are not reviews, which risks a structured-data policy violation. | `BuildShopSeoData` | High |
| G5 | **Product schema is thin:** `description` reuses the truncated meta description; no `itemCondition`, `shippingDetails`, `hasMerchantReturnPolicy`, `priceValidUntil`, `review`, `url`, `@id`, or halal certification. Variants emitted as flat multiple Offers with `?variant=` URLs. | `BuildProductSeoData` | High |
| G6 | **No entity graph:** no `@id` on Organization/WebSite/Store/Product, so entities aren't linked across pages (important for GEO entity resolution). | all builders | Medium |
| G7 | **Sitemap `lastmod` is "now" for every sitemap entry** in the index; not a real modification date. | `BuildSitemapIndex` | Medium |
| G8 | **No AI-crawler policy and no `llms.txt`.** `robots.txt` doesn't mention GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc. | `RobotsController`, `public/robots.txt` | Medium |
| G9 | **Duplicated robots rules** in `public/robots.txt`, `RobotsController`, and `SeoData::isPrivatePath()`; they can drift. `config('seo.force_noindex')` is read but there is no `config/seo.php`. | those three files | Medium |
| G10 | **Social images:** `og:image` is generated on demand via GD with hard-coded Liberation Sans paths and a `₱` glyph; no `og:image:secure_url`; `og:type` for shops/categories is generic; no `article:*` tags on content pages. | `GenerateSocialImage`, `app.blade.php` | Low–Medium |
| G11 | **Content pages lack FAQ/Article depth** for GEO (Why Choose Us, halal-verification, returns, shipping). No `FAQPage`, `Article` dates, `author`/`publisher`. | `BuildContentPageSeoData`, `BuildWhyChooseUsSeoData` | Medium |
| G12 | **Inertia SSR is enabled in config** (`http://127.0.0.1:13714`) but nothing in `docker/`, `compose.yaml` or `.github/workflows` starts or tests the SSR server. Body content for AI crawlers depends on it. | `config/inertia.php` | Medium (verify) |
| G13 | `Disallow: /*?*filter` and `/*?*sort=` only; no handling of other faceted params (`halal`, `price_min`, `price_max`) even though the category builder noindexes them. | `RobotsController`, `BuildCategorySeoData` | Low |

---

## 2. Goals and non-goals

**Goals**

1. Every indexable page emits **valid, eligible, entity-linked JSON-LD** (`@context` + `@graph` + `@id`).
2. Rich-result eligibility for Product, Merchant listing, Breadcrumb, Organization, Store/LocalBusiness, FAQ (where policy allows), Article.
3. Reliable **Open Graph / Twitter / messaging-app previews** (Facebook, Messenger, Viber, WhatsApp, Telegram, X, LinkedIn) with correct images on every public page.
4. **GEO readiness:** machine-readable facts, crawlable server-rendered content, explicit AI-crawler policy, `llms.txt`, quotable answer-style content.
5. Guardrails so none of this regresses (tests, CI validation, a single source of truth for robots/indexability).

**Non-goals**

- Paid ads, GA4 changes (already shipped), backlink or off-site work.
- Translating to other locales (single `en-PH` site; hreflang stays minimal).
- Rewriting the UI or the existing builders' title/description templates (they're already thoughtful).

---

## 3. Target architecture

Keep the existing pattern (**Action builds `SeoData` → controller `Seo::set()` → Blade renders**) and add a small schema layer so JSON-LD is composed from reusable, tested pieces instead of inline arrays.

```
app/Support/Schema/
    SchemaGraph.php          // collects nodes, adds @context once, de-dupes by @id, emits @graph
    SchemaId.php             // stable @id helpers: org(), website(), shop($slug), product($slug), page($path)
app/Actions/Seo/Schema/
    BuildOrganizationNode.php
    BuildWebSiteNode.php
    BuildBreadcrumbNode.php
    BuildProductNode.php          // Product / ProductGroup + Offer(s)
    BuildOfferNodes.php           // price, availability, shipping, return policy
    BuildShopNode.php             // Store (+ Organization @id as seller)
    BuildItemListNode.php
    BuildFaqNode.php
    BuildArticleNode.php
config/seo.php                    // single source of truth (see Task 0.3)
```

**Rules for the graph**

- One `<script type="application/ld+json">` per page containing `{"@context":"https://schema.org","@graph":[...]}`.
- Stable `@id`s: `https://halalbenta.com/#organization`, `/#website`, `/shops/{slug}#store`, `/products/{slug}#product`, `/products/{slug}#breadcrumb`.
- Nodes reference each other by `@id` (`seller`, `brand`, `isPartOf`, `publisher`, `mainEntityOfPage`) instead of re-embedding.
- Only emit properties backed by real data. No invented ratings, no empty strings, no placeholder values.
- Escape for HTML context: encode with `JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE` so user-supplied product/shop text can never break out of the `<script>` tag.

---

## 4. Phased plan

| Phase | Theme | Outcome | Est. |
|---|---|---|---|
| **0** | Stabilize and fix breakages | Valid JSON-LD, correct sitemaps/robots, no broken URLs | 1–2 d |
| **1** | Schema graph foundation | `SchemaGraph` + shared nodes, all existing pages migrated | 2–3 d |
| **2** | Rich Product / Shop / Category schema | Merchant-listing-eligible products, honest ratings, shipping + returns | 3–4 d |
| **3** | Open Graph, social and AI preview signals | Reliable previews everywhere, hardened image generation | 2–3 d |
| **4** | GEO layer | AI-crawler policy, `llms.txt`, FAQ/Article content, entity facts | 2–3 d |
| **5** | Validation, monitoring, rollout | CI checks, Search Console, staged release | 1–2 d |

Phases 0 → 1 are sequential; 2, 3 and 4 can run in parallel after Phase 1.

---

## 5. Tasks

Legend: ✅ = done, ◐ = partly done, no mark = not started (see section 0 for notes). **P** = priority (P0 must-do, P1 should, P2 nice). Each task lists files, work, and **acceptance criteria (AC)**.

### Phase 0 — Stabilize

**✅ T0.1 (P0) — Remove committed static SEO artifacts**
- Delete `public/robots.txt`, `public/sitemap.xml`, `public/sitemap-pages.xml`, `public/sitemap-categories.xml`, `public/sitemap-shops.xml`, `public/sitemap-products-1.xml`.
- Add them to `.gitignore` so a local `curl` dump is never committed again.
- Confirm in the deployed environment (nginx/Caddy `try_files`) that `/sitemap.xml` and `/robots.txt` now reach Laravel.
- **AC:** `curl -s https://<prod>/sitemap.xml` shows production-origin URLs; `git ls-files public | grep -E "sitemap|robots"` returns nothing.

**✅ T0.2 (P0) — Fix missing `@context` immediately (hotfix before the refactor)**
- Short-term: in `app.blade.php`, wrap `$seo->jsonLd` so that a list of nodes becomes `{"@context":"https://schema.org","@graph":[...]}` unless it already has `@context`.
- **AC:** every page's JSON-LD parses and contains `@context` and a `@graph`; add the Pest assertion in T1.6 now as a regression test.

**✅ T0.3 (P0) — Create `config/seo.php` and centralize indexability**
- Keys: `force_noindex`, `site_name`, `locale`, `default_og_image`, `logo_url`, `social_profiles`, `private_path_patterns`, `disallowed_query_params`, `ai_crawlers` (allow/deny map), `contact` (email/phone for Organization).
- Make `RobotsController`, `SeoData::isPrivatePath()` and `EnforceSeoStandards` read the same lists.
- **AC:** changing a pattern in one place changes robots.txt, meta robots and `X-Robots-Tag` together; test proves parity.

**✅ T0.4 (P0) — Fix logo / brand image URLs**
- Pick one canonical logo (recommend a ≥112×112 square PNG; `public/brand/halalbenta-icon-512.png` already exists) and expose it via `config('seo.logo_url')`.
- Replace `/images/brand/logo.png` in `BuildHomeSeoData`, `BuildProductSeoMeta` and any other reference.
- **AC:** `grep -rn "images/brand/logo.png" app` is empty; a test does a `HEAD` on every image URL emitted on the home page and expects 200.

**✅ T0.5 (P0) — Stop using followers as review count**
- `BuildShopSeoData`: emit `aggregateRating` only when the shop has real reviews (count from `reviews` joined through products/orders, or a stored `reviews_count`). Never fall back to `followers_count`.
- **AC:** shop with followers but zero reviews has no `aggregateRating`; shop with N real reviews shows `reviewCount = N`.

**✅ T0.6 (P1) — Real `lastmod` in sitemaps**
- Index: use `max(updated_at)` per child sitemap, not `now()`.
- Pages/categories/shops: use model `updated_at`.
- Invalidate caches via the existing `InvalidateSitemapCache` on product/shop/category changes (verify it's wired to model events).
- **AC:** two consecutive index requests with no data change return identical `lastmod`s.

**T0.7 (P1) — Confirm Inertia SSR in every environment**
- Add the SSR process to `compose.yaml` / deploy scripts (`php artisan inertia:start-ssr`), `build:ssr` in CI, and a health check.
- Add a CI smoke test: request `/products/{slug}` with a crawler UA and assert the product name and price appear in the **HTML body**, not only in the head.
- **AC:** `curl -A Googlebot` returns body text for home, a category, a product and a shop.

### Phase 1 — Schema graph foundation

**✅ T1.1 (P0) — `SchemaGraph` + `SchemaId`**
- Implement `add(array $node)`, `ref(string $id)`, de-dupe by `@id`, strip null/empty values recursively, `toArray()` returning `@context` + `@graph`.
- Unit tests: de-dupe, null stripping, stable ids.

**✅ T1.2 (P0) — Sitewide nodes (Organization, WebSite)**
- `Organization` with `@id`, `name`, `url`, `logo` (`ImageObject` with width/height), `sameAs` (from `config('seo.social_profiles')`), `contactPoint` (customer support), `areaServed: PH`, `knowsAbout` (halal food, modest fashion, prayer essentials), and `slogan`/`description`.
- `WebSite` with `@id`, `publisher` → Organization `@id`, `inLanguage: en-PH`, and `SearchAction` using `EntryPoint` (the home builder already does this; the fallback in `SeoData` uses the older string form, so align both).
- Emit on **home only** in full; other pages reference `{"@id": ".../#organization"}`.

**✅ T1.3 (P0) — Migrate all builders onto `SchemaGraph`**
Replace inline arrays in: `BuildHomeSeoData`, `BuildProductSeoData`, `BuildCategorySeoData`, `BuildShopSeoData`, `BuildSellersSeoData`, `BuildContentPageSeoData`, `BuildWhyChooseUsSeoData`, `BuildSellerTermsSeoData`; keep `SeoData::$jsonLd` typed as `array<string,mixed>` (the full `@context` document).

**✅ T1.4 (P0) — Safe Blade output**
- Render via a small Blade component/`@json`-style helper using the hex-escape flags in section 3.
- **AC:** a product named `</script><script>alert(1)</script>` renders harmlessly (test).

**✅ T1.5 (P1) — `WebPage` wrapper node on every page**
- `WebPage` / `CollectionPage` / `ProfilePage`-style node with `@id`, `url`, `name`, `isPartOf` → WebSite, `breadcrumb` → BreadcrumbList `@id`, `primaryImageOfPage`, `datePublished`/`dateModified`, `inLanguage`.

**✅ T1.6 (P0) — Regression tests**
- Extend `tests/Feature/SeoTest.php`: for each public route, parse the JSON-LD and assert `@context`, `@graph`, unique `@id`s, every `@id` reference resolves within the graph or to the sitewide ids, and no empty values.

### Phase 2 — Rich entity schema

**✅ T2.1 (P0) — Product node**
- `@id`, `url`, `name`, **full** sanitized description (not the meta description), `image[]` (absolute, ≥3 sizes where available), `sku`, `mpn` only if stored, `gtin` only if stored, `brand` → Brand (shop name or real brand field), `category` (breadcrumb path text), `weight` (`QuantitativeValue`, from `weight` column), `material`/`ingredients` where present (the product has an `ingredients` field).
- Halal signals: `additionalProperty` `PropertyValue` entries (`Halal status`, `Certifying body`, `Certificate number`, `Valid until`) from `halalCertification`, plus `hasCertification`/`Certification` where the certifying body is known. Only when the certificate is currently valid.
- **AC:** Rich Results Test passes for Product snippets and Merchant listings with no errors.

**✅ T2.2 (P0) — Offers, availability, shipping and returns**
- `Offer`: `price`, `priceCurrency: PHP`, `availability` (InStock/OutOfStock; map `frozen`/preorder if applicable), `itemCondition: NewCondition`, `priceValidUntil`, `url`, `seller` → shop `@id`.
- `shippingDetails` (`OfferShippingDetails`): `shippingDestination` PH, `shippingRate` (`0` when `free_shipping`), `deliveryTime` from courier config if available.
- `hasMerchantReturnPolicy`: `MerchantReturnPolicy` using `config('marketplace.return_window_days')` (7 by default), `applicableCountry: PH`, `returnPolicyCategory: MerchantReturnFiniteReturnWindow`.
- Sale pricing: when `was_price` exists, emit `priceSpecification` with a `ListPrice`-type `UnitPriceSpecification` so strike-through pricing is represented.
- **AC:** Offer values match the visible page values exactly (add a test comparing against `product->toDetail()`).

**✅ T2.3 (P1) — Variants**
- Decision: use `ProductGroup` + `hasVariant` (with `variesBy`, one `Product` per variation with its own `sku`, `Offer`) instead of multiple Offers with `?variant=` URLs, *or* keep a single Product with `AggregateOffer` (`lowPrice`, `highPrice`, `offerCount`). Recommend `ProductGroup` since option names (`option1_name`, `option2_name`) exist.
- Keep canonical on the clean product URL; do not index variant URLs.

**✅ T2.4 (P0) — Reviews and ratings (honest)**
- `aggregateRating` only when `reviews_count ≥ 1` (use a stored count or cached counter instead of `$product->reviews()->count()` on every render).
- Add up to ~5 recent `Review` nodes (`author` Person or "Anonymous" respecting the existing `anonymous` flag, `datePublished`, `reviewRating`, `reviewBody`).
- Do **not** emit seller replies as reviews. Do not self-serve ratings from the seller's own data.
- **AC:** ratings match the visible page; anonymous reviewers never expose names.

**✅ T2.5 (P1) — Shop node**
- Type: `OnlineStore` (or `Store`) with `@id`, `url`, `name`, `description`, `logo`/`image`, `address` (`PostalAddress` from `address_line`, `city`, `state`, `postal_code`, `PH`; only publish if the shop opted in to a public address), `areaServed`, `parentOrganization`/`memberOf` → marketplace Organization, `makesOffer`/`hasOfferCatalog` linking to category ItemLists.
- Never emit `contact_number`, bank, ID or business-permit data. Add a test proving none of the private registration fields appear in any JSON-LD or meta tag.

**✅ T2.6 (P1) — Category and listing pages**
- Keep `CollectionPage` + `ItemList`; make `itemListElement` entries reference Product `@id`s with `ListItem.item` as `Product` stubs (`url`, `name`, `image`), and keep paginated pages (`?page=N`) with self-referencing canonicals (already done) and correct `prev`/`next`.
- Note: Google no longer uses `rel=prev/next` for indexing, but it's harmless; keep it.
- Sellers directory: `CollectionPage` with `ItemList` of shop `@id`s.

**✅ T2.7 (P1) — Breadcrumbs as a shared node**
- One `BuildBreadcrumbNode` used everywhere. Include category ancestors for products (currently only the leaf category) and the parent category in category pages (already present).

**T2.8 (P2) — Video**
- Products have `video_path`/`video_duration`. When a product has a public video: `VideoObject` (`name`, `description`, `thumbnailUrl`, `uploadDate`, `duration` ISO 8601, `contentUrl`). Also add `og:video*` tags only if the video is publicly fetchable.

### Phase 3 — Open Graph, social and AI preview signals

**✅ T3.1 (P0) — Complete the OG/Twitter set**
- Add `og:image:secure_url`; `og:updated_time` on content/product pages; `article:published_time`, `article:modified_time`, `article:section` on `Article` content pages (type `article`).
- Product pages: keep `product:*` tags; verify `product:availability` values against Meta's accepted vocabulary (`in stock`, `out of stock`, etc.), and add `product:category`, `product:sale_price:amount` when `was_price` exists.
- Twitter: add `twitter:site` (from config) when a handle exists. Keep `summary_large_image`.
- **AC:** Facebook Sharing Debugger, LinkedIn Post Inspector and X card validator show no warnings for home, product, category, shop.

**✅ T3.2 (P0) — Prefer real product photography for `og:image`**
- Today product pages point to the generated `/social/product/{slug}.jpg`. Keep the generated card as the *fallback*, but use the seller's first high-quality image (center-cropped to 1.91:1, ≥1200×630) when it exists, so shared links show the actual item.
- Decide per type and record the decision in `config/seo.php`.

**✅ T3.3 (P1) — Harden `GenerateSocialImage`**
- Bundle the font files in the repo (`resources/fonts/`) instead of relying on `/usr/share/fonts/truetype/liberation/...`; verify the `₱` glyph renders; fail soft (serve `default-og.jpg`) on any GD/font error and log it.
- Cache generated files on disk keyed by `type/slug/version`; add queue-based pre-warm on product publish so first share doesn't time out a crawler (Facebook gives ~a few seconds).
- Confirm `?v=` cache-busting (already used) and that `Cache-Control: immutable` is only sent when `v` is present.
- Escape/limit text to avoid overflow; test long names, emoji and non-Latin text.
- **AC:** image endpoint p95 < 500 ms warm, < 2 s cold; never returns 500 for a valid slug.

**✅ T3.4 (P1) — Correct `og:type` and per-type labels**
- Home/category/shop: `website` (or `profile` is **not** appropriate for shops); content pages: `article`; product: `og:product` (already `product`).
- Add Twitter `label1/data1` for shops (Location, Rating) and categories (Items) in the same pattern as products.

**✅ T3.5 (P1) — Share-link hygiene**
- Ensure the share buttons (`ProductShareController`, `docs/planning/10-product-share-buttons.md`) always share the **clean canonical URL**, and that UTM/`fbclid` are stripped from canonicals (already handled by `buildCanonical`).

**✅ T3.6 (P1) — Meta for AI previews (ChatGPT, Gemini, Perplexity, Copilot link cards)**
- Keep `<title>` ≤ ~60 chars, description 140–160 chars, `robots` with `max-image-preview:large, max-snippet:-1, max-video-preview:-1` on all indexable pages (currently only the fallback includes `max-image-preview:large`).
- Ensure every public page has a unique, descriptive `<title>` and `<meta name="description">` (search results page stays `noindex, follow`).
- Add `<meta name="author">`/`<link rel="author">` on content pages.

**✅ T3.7 (P2) — Favicon and app signals**
- Verify `apple-touch-icon` size (180×180), add `<link rel="icon" sizes="32x32">` PNG fallback, and `<meta name="application-name">`. Make `manifest.webmanifest` include `id`, `lang: en-PH`, `categories: ["shopping"]`.

### Phase 4 — GEO layer

**◐ T4.1 (P0) — AI-crawler policy in `robots.txt`**
- Decide policy with the business, then encode in `config/seo.php['ai_crawlers']`. Suggested default: **allow** search/answer bots and user-triggered fetchers so the marketplace can be cited (`OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `Claude-SearchBot`, `Claude-User`, `Googlebot`, `Bingbot`); make training crawlers a **toggle** (`GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`, `Applebot-Extended`, `Bytespider`).
- Keep `Disallow` for private routes under every named agent (a named `User-agent` group replaces the `*` group for that bot, so rules must be repeated).
- Verify bot names against each vendor's current documentation before shipping; they change.
- **AC:** `robots.txt` generated from config; a test asserts that each named agent also disallows `/cart`, `/checkout`, `/account`, `/admin`, `/api`.

**T4.2 (P1) — `/llms.txt` (+ optional `/llms-full.txt`)**
- New `LlmsTxtController` + `BuildLlmsTxt` action, cached, production-only.
- Content: one-paragraph description of HalalBenta (what it is, where it ships, how halal verification and escrow work), then curated link sections: Categories (top-level), How halal verification works, Shipping & returns, Seller terms, Sellers directory, Sitemap.
- Treat it as a low-cost, unproven signal. Do not rely on it for ranking or citation; keep it accurate and cheap to maintain.
- **AC:** returns `text/plain`/`text/markdown`, valid links, only public URLs.

**T4.3 (P0) — Machine-readable trust and policy facts**
- Expose, in both visible copy and schema: halal verification process, escrow-protected checkout, return window, shipping coverage, seller verification. Source the numbers from `config/marketplace.php` so page copy, JSON-LD and `llms.txt` can't disagree.
- Add `Organization.hasMerchantReturnPolicy` and `Organization.areaServed`.

**T4.4 (P1) — FAQ and answer-first content**
- Add FAQ blocks to: Why Choose Us, halal-verification page, shipping/returns page, and top categories (e.g. "Is this meat halal-certified?", "How long does delivery take to Mindanao?").
- Emit `FAQPage` JSON-LD **only where the Q&A is visible on the page**. Note Google restricted FAQ rich results to authoritative government/health sites in 2023, so the value here is machine readability and answer-engine extraction, not a rich result.
- Write answers as short, self-contained, quotable paragraphs (40–80 words) with specific facts.

**T4.5 (P1) — `Article` for editorial pages**
- `halal-verification` is already typed `Article`: add `headline`, `datePublished`, `dateModified`, `author` (Organization or a named reviewer), `publisher` → Organization `@id`, `image`, `mainEntityOfPage`.
- Add a visible "Last updated" date on the page and keep it in sync with `dateModified`.

**T4.6 (P1) — Server-rendered, crawlable body content**
- Dependent on T0.7. Ensure primary content (product description, specs, halal info, reviews summary, category intro text) is in the initial HTML, uses semantic HTML (`h1` once, ordered `h2/h3`, `<ul>`, `<table>` for specs), and that deferred props (`reviews`, `related` use `Inertia::defer`) are not the only place key facts live.
- Add short descriptive intro copy to category pages (currently only template meta descriptions) so they have unique, indexable text.

**T4.7 (P2) — Entity consistency (off-site)**
- Fill `sameAs` with every official profile (Facebook, Instagram, YouTube are supported via `MARKETPLACE_SOCIAL_*` env vars; add TikTok/LinkedIn/Google Business Profile if they exist), and keep name/description identical across them.
- Set the three env vars in production; confirm `sameAs` is non-empty in the home JSON-LD.

**T4.8 (P2) — Quality of product data for answer engines**
- Add optional structured fields to the seller product form: brand, GTIN/EAN, ingredients, allergens, net weight, storage, origin/"ships from". Each one feeds schema (`gtin`, `additionalProperty`, `countryOfOrigin`) and on-page specs. Without these, answer engines have little to quote.

### Phase 5 — Validation, monitoring, rollout

**T5.1 (P0) — Automated structured-data validation in CI**
- Pest tests for all phases (see the matrix in section 6).
- A small script (`scripts/validate-jsonld.mjs`, wired into `npm run check`) that crawls a fixture set of routes in a test server and validates JSON-LD against schema.org types and required/recommended properties (e.g. via `schema-dts`-style type checks or the `jsonld` package for syntax).
- Policy test (like the existing `scripts/scan-violations.mjs`): fail the build if any builder emits a node without `@type` or an empty string value.

**T5.2 (P0) — Manual validation checklist (pre-release)**
- Google Rich Results Test (product, merchant listing, breadcrumb, organization), Schema Markup Validator (validator.schema.org), Facebook Sharing Debugger, LinkedIn Post Inspector, X card validator, a Viber/WhatsApp/Telegram paste test on real devices.

**T5.3 (P0) — Search Console and Merchant Center**
- Verify the production domain (DNS), submit `sitemap.xml`, watch Enhancements (Products, Merchant listings, Breadcrumbs), Page indexing, and Core Web Vitals.
- Optionally create a Merchant Center feed from the same product data later (separate project).

**T5.4 (P1) — Monitoring**
- Weekly job: sample N products, fetch live HTML, validate JSON-LD, check image URLs return 200, and alert on regressions. Log 404/500 on `/social/*` and sitemap routes.
- Track AI referrals in GA4 (referrers such as `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com`) via a custom channel group, and log crawler hits by user-agent from server logs.

**T5.5 (P1) — Staged rollout**
1. Ship Phase 0 hotfixes (T0.1–T0.5) on their own, immediately.
2. Deploy Phase 1–2 to staging (`SeoData::isStaging()` keeps it `noindex`); run T5.1/T5.2.
3. Release to production; request indexing for home + a handful of products and categories.
4. Compare Search Console enhancements and impressions at 2 and 6 weeks.

---

## 6. Test matrix (Pest, extends `tests/Feature/SeoTest.php`)

| Test | Covers |
|---|---|
| Every public page JSON-LD has `@context` and `@graph` | G1, T1.6 |
| `@id` uniqueness and reference resolution | T1.1, T1.3 |
| Hostile product/shop names can't break out of `<script>` | T1.4 |
| Product schema price/availability equal visible values | T2.1–T2.2 |
| Product with `free_shipping` → `shippingRate` is 0; return window equals config | T2.2 |
| Shop without reviews has no `aggregateRating` | T0.5 |
| Anonymous review never exposes the author's name | T2.4 |
| No private shop field (contact, bank, ID, permit) appears in head or JSON-LD | T2.5 |
| Every URL in OG/JSON-LD/sitemap resolves (200) | T0.4, T3.1 |
| `og:image` is 1200×630 JPEG and cacheable; fallback on generator failure | T3.3 |
| robots.txt, meta robots and `X-Robots-Tag` agree for every private pattern | T0.3 |
| Each named AI user-agent repeats the private-path disallows | T4.1 |
| `/llms.txt` only lists public, 200 URLs | T4.2 |
| Sitemap `lastmod` stable between requests; no `localhost` URLs | T0.1, T0.6 |
| Crawler UA gets body content (SSR) | T0.7, T4.6 |

---

## 7. Definition of done

- All P0 tasks merged; Rich Results Test shows **0 errors** on a sample of ≥10 product pages, home, a category and a shop.
- `grep -rn "localhost" public/*.xml` is empty and no static SEO files remain in `public/`.
- Sharing home, a product, a category and a shop on Facebook/Messenger, Viber, WhatsApp, Telegram, X and LinkedIn shows the right title, description and image.
- `robots.txt`, `llms.txt` and sitemaps are generated from config and reflect the business's AI-crawler decision.
- `npm run check` and `php artisan test` include the new SEO tests and pass in CI.

---

## 8. Risks and open questions

| Item | Notes / decision needed |
|---|---|
| AI-crawler policy | Allow-for-citation vs. block-for-training is a business decision (T4.1). |
| Shop public address | Registration collects addresses; confirm sellers consent to publishing them in schema (T2.5). |
| Review data model | No stored `reviews_count` exists; schema aggregates non-hidden reviews per render (T0.5, T2.4). Decide whether to add a cached counter, and align the visible page's rating/count with it. |
| Brand / GTIN data | Not collected today; schema will omit them until sellers can supply them (T4.8). |
| Variant strategy | Decided: `ProductGroup` + `hasVariant` (T2.3). |
| FAQ rich results | Not expected for a marketplace under current Google policy; value is for answer engines (T4.4). |
| SSR in production | Verify it is actually running (T0.7); GEO value drops sharply without server-rendered body content. |
| Search/vendor behavior drifts | Crawler names, Google structured-data requirements and Merchant Center rules change; re-verify against current docs when implementing each phase. |

---

## 9. Suggested sequencing for a small team

1. **Day 1:** T0.1, T0.2, T0.4, T0.5 (hotfix PR).
2. **Days 2–3:** T0.3, T0.6, T0.7, then T1.1–T1.6.
3. **Days 4–8:** T2.x in parallel with T3.x; T4.1–T4.3.
4. **Days 9–11:** T4.4–T4.8, then T5.1–T5.5.
