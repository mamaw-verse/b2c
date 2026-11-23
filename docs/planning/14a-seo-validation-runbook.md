# SEO & GEO — Validation, Monitoring and Rollout Runbook

Companion to [`14-seo-geo-optimization.md`](./14-seo-geo-optimization.md), Phase 5 (T5.1–T5.5).
Automated pieces live in the repo; the rest needs a person with access to the deployed site and the vendor tools.

---

## 1. What is automated

| Tool | Where | Run it |
| --- | --- | --- |
| PHP structured-data validator | `app/Support/Schema/JsonLdValidator.php` | used by the tests and the audit below |
| Policy test (every public page passes the validator) | `tests/Feature/SeoStructuredDataPolicyTest.php` | `php artisan test --compact --filter=StructuredDataPolicy` |
| Validator unit tests | `tests/Unit/JsonLdValidatorTest.php` | `php artisan test --compact --filter=JsonLdValidator` |
| Node validator + CLI | `scripts/validate-jsonld.mjs` | self-test runs in `npm run check`; live crawl: see below |
| Weekly audit | `php artisan seo:audit` (scheduled Mondays 05:00, production only) | see below |

**What the validator checks:** exactly one JSON-LD block; `@context` + `@graph`; a `@type` on every node; unique `@id`s; every `@id` reference resolves (the sitewide Organization/WebSite ids may be referenced without being defined); no empty strings, nulls or empty arrays; absolute URLs for `url`/`image`/`logo`/`item`/`sameAs`; and the properties Google requires for the types we emit (Product/ProductGroup, Offer, AggregateRating, Review, BreadcrumbList, ItemList, Organization, WebSite, Store, FAQPage, Article, page types). Product images and Article `datePublished` are warnings, not errors.

**What it does not check:** schema.org vocabulary correctness beyond those rules, Google's _recommended_ properties, or Merchant Center policy. The Rich Results Test (section 2) remains the authority.

### Live crawl of a deployed origin (no PHP needed)

```bash
npm run validate:jsonld -- --base-url https://<staging-or-prod>
npm run validate:jsonld -- --base-url https://<staging-or-prod> /products/<slug> /categories/<slug> /shops/<slug>
npm run validate:jsonld -- --file saved-page.html
```

Exit code is `1` on any error, `2` on bad usage. The PHP validator is authoritative; keep both rule sets in step.

### Weekly audit (`seo:audit`)

```bash
php artisan seo:audit                       # canonical origin, 10 random products
php artisan seo:audit --sample=25 --base-url=https://staging.example.com
php artisan seo:audit --require-ssr         # missing server-rendered body becomes a failure
```

It fetches live HTML for the home page, sellers directory, why-choose-us, seller terms, 2 random categories, 2 random approved shops and N random visible products, then reports:

- **Failures** (non-zero exit, `Log::error('SEO audit found regressions.')` with up to 50 failures): non-200 pages, JSON-LD errors, any image (JSON-LD, `og:image`, `twitter:image`) that does not answer 200, a sitemap index or child sitemap that does not answer 200 or lists a non-canonical host, `robots.txt` (and `/llms.txt` where the app serves it) not answering 200.
- **Warnings** (printed only): JSON-LD warnings, and a product name that is missing from the server-rendered body. That second one is the T0.7 crawler smoke test; it stays a warning until SSR is confirmed in production, then switch the schedule to `--require-ssr`.

Point alerting at the `SEO audit found regressions.` log message. `sitemap` URLs are fetched through the audited origin, so a staging audit never hits production, but images keep the absolute URLs the page emits.

---

## 2. T5.2 — Pre-release manual validation checklist

Run against **staging** and record the result and date next to each item. Staging serves `Disallow: /` and `noindex`, which some fetchers honour: if a tool reports the page as blocked, paste the rendered HTML into it (the Rich Results Test and Schema Markup Validator both accept pasted code) or repeat that check on production right after release.

Sample set: home, 3 products (plain, discounted + free shipping, with variants), 1 product with reviews, 1 category, 1 shop, sellers directory, why-choose-us, `/pages/returns`, `/pages/halal-verification` (if enabled).

- [ ] **Google Rich Results Test** (<https://search.google.com/test/rich-results>): Product snippets, Merchant listings, Breadcrumb, Organization on the sample set. Expected: 0 errors. Re-check the three Phase 2 deviations (no `priceValidUntil`; `shippingDetails` only for free shipping; `StrikethroughPrice` for sale price) and note any warning they cause.
- [ ] **Schema Markup Validator** (<https://validator.schema.org>): paste each sample URL; expect no errors, and note any warning for properties we deliberately omit.
- [ ] **Facebook Sharing Debugger** (<https://developers.facebook.com/tools/debug/>): home, product, category, shop. Click "Scrape Again", confirm title, description, 1200×630 image, `og:type`, `product:*` tags.
- [ ] **LinkedIn Post Inspector** (<https://www.linkedin.com/post-inspector/>): same four URLs.
- [ ] **X / Twitter card**: paste a product URL into a draft post (the standalone validator was retired) and check the large summary card and the Price / Availability labels.
- [ ] **Messaging apps on real devices**: paste a product URL into Viber, WhatsApp, Messenger and Telegram; confirm the real product photo (not the generated card) when the product has photos, and the generated card when it does not.
- [ ] **Social image latency**: `curl -s -o /dev/null -w "%{time_total}\n" https://<origin>/social/product/<slug>.jpg` twice; expect < 2 s cold and < 0.5 s warm.
- [ ] **Crawler HTML**: `curl -A "Googlebot" https://<origin>/products/<slug> | grep -c "<product name>"` returns body text for home, a category, a product and a shop (T0.7 / T4.6). If only the Inertia payload contains it, SSR is not running.
- [ ] `grep -rn "localhost" public/*.xml` is empty and `git ls-files public | grep -E "sitemap|robots"` returns nothing.
- [ ] `https://<origin>/sitemap.xml`, `/robots.txt` and `/llms.txt` show production-origin URLs.

---

## 3. T5.3 — Search Console and Merchant Center

1. Add the production domain as a **Domain property** in Search Console and verify via DNS TXT.
2. Submit `https://<origin>/sitemap.xml` (the index; children are discovered from it).
3. Use URL Inspection → _Request indexing_ for the home page and a handful of products and categories.
4. Watch, weekly: **Enhancements** (Products, Merchant listings, Breadcrumbs), **Pages** (indexing), **Core Web Vitals**, and **Sitemaps** (discovered vs indexed).
5. Optional, separate project: a Merchant Center feed generated from the same product data.

---

## 4. T5.4 — Monitoring that is not in the repo

- **AI referral channel in GA4.** Admin → Data display → Channel groups → create a custom group "AI assistants" with the rule _Source matches regex_ `chatgpt\.com|openai\.com|perplexity\.ai|gemini\.google\.com|copilot\.microsoft\.com|claude\.ai`. Review the referrer list after a month; vendors change hostnames.
- **Crawler hits by user agent.** From the web-server access logs, count requests per agent (`OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Claude-SearchBot`, `Claude-User`, `Googlebot`, `bingbot`; and `GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot` if training crawlers are allowed). Check names against each vendor's current documentation first.
- **404/500 on `/social/*` and sitemap routes.** `seo:audit` covers a sample weekly; for full coverage add a log alert on those paths at the web-server or APM level.

---

## 5. T5.5 — Staged rollout

1. **Hotfixes first** (T0.1–T0.5) were safe to ship alone; if they are not yet in production, ship them before anything else.
2. **Staging** (`SeoData::isStaging()` keeps it `noindex`): deploy, run `php artisan test`, `npm run check`, `php artisan seo:audit --base-url=<staging>`, then section 2 above.
3. **Production**: deploy, run `php artisan seo:audit --sample=25`, then section 3 (submit sitemap, request indexing for home + a few products/categories).
4. **Compare** Search Console impressions and Enhancements reports at **2 weeks** and **6 weeks**; record the numbers in this folder.

### Open items that block "done"

- **T0.7 Inertia SSR**: still has no process in `compose.yaml` and no `build:ssr` in CI. Until it runs in production, the GEO value of Phase 4 is limited and `seo:audit` will warn on every product.
- **AI-crawler policy** (T4.1) is a business decision; verify bot names with each vendor before launch.
- **Halal page dates** (T4.5): set `MARKETPLACE_PAGE_HALAL_PUBLISHED` / `MARKETPLACE_PAGE_HALAL_UPDATED`, or no Article dates are published.
- **`sitemap:generate` writes static files into `public/` every day at 02:00** (`routes/console.php`). That contradicts T0.1: the files are git-ignored, but on a server where the web server serves static files first they will shadow the dynamic, cache-invalidated `/sitemap*.xml` routes and go stale between runs. Decide whether to remove that schedule (recommended) or have the command warm the cache instead of writing files.
- **CI trigger**: `.github/workflows/tests.yml` runs on pushes to `main` and on pull requests, but this repo's default branch is `production` (there is no `main`). Pushes straight to `production` do not run the checks.
