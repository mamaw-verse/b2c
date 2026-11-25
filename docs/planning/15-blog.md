# 15 — Blog (Shopee-style editorial hub): plan, spec and implementation tasks

**Repo:** `mamaw-verse/b2c` (HalalBenta, Laravel + Inertia/React 19 + Tailwind 4, Pest tests, Playwright e2e)
**Branch audited:** `production` (the repo has no `main` branch; `production` is the default, `develop` also exists)
**Scope:** public blog (`/blog`), admin authoring (Admin workspace), product embeds, SEO/GEO integration with [`14`](./14-seo-geo-optimization.md)
**Date written:** 2026-11-25

---

## 0. Status

**Planning only.** Nothing in this document is implemented. No application code was written or run while producing it, and no file outside `docs/planning/` was touched. Every task in §11 starts as _Not started_. Per `.ai/rules/planning.md`, tick a task only when a passing test or e2e run proves it, and record deviations in the task's notes column.

The repo findings in §3 come from reading the `production` branch. Items marked **(verify)** were inferred and must be confirmed in code before building on them.

**Shopee reference note.** "Shopee-style" here means the common marketplace-blog patterns in §1 (featured hero, category navigation, card grid, article page with table of contents, shoppable product cards, related reads). The live Shopee blog was not re-audited for this document, so treat §1 as a design brief rather than a pixel spec. We copy the _pattern_, never Shopee's content, copy, imagery or branding.

---

## 1. What "like Shopee's blog" means for HalalBenta

| Pattern (marketplace-blog convention)           | HalalBenta decision                                                                      |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Featured hero / carousel of top stories         | `is_featured` posts, max 5, rendered with the existing `carousel.tsx`                    |
| Category navigation (tabs / chips)              | `blog_categories` with chip row on the index (`chip.tsx`); each category has its own URL |
| Card grid of latest stories (cover, tag, title) | 12 per page, numbered pagination (`pagination.tsx`), self-canonical pages                |
| "Popular / trending" rail                       | Top posts by `view_count`; upgrade path to a 30-day window in §13                        |
| Search within the blog                          | `?q=` on `/blog`, `noindex,follow`                                                       |
| Article page: breadcrumb, byline, read time     | Breadcrumb, category chip, date, reading minutes, last-updated                           |
| In-article table of contents                    | Generated from `h2`/`h3`, sticky on desktop, collapsible on mobile                       |
| Share buttons                                   | Reuse `share-buttons.tsx` (see §6.4: it is coupled to product share tracking today)      |
| Shoppable products inside the article           | `[[product:slug]]` embeds render live product cards with halal badge, price, stock       |
| Related articles                                | Same category first, then shared tags, 3 cards                                           |
| CTA banner back into the shop                   | Category-linked CTA at the end of each post (configurable)                               |
| Content calendar / scheduling                   | `published_at` in the future = scheduled; no queue job needed (query-time filter)        |

**HalalBenta-specific additions** (not in a generic marketplace blog): halal-claim editorial rules (§4.6), seasonal categories such as Ramadan and Eid, and UTM tagging on product-card links so blog-driven sales are attributable.

---

## 2. Goals and non-goals

**Goals**

1. A public blog at `/blog` that drives organic search and AI-answer traffic and funnels readers into product pages.
2. An admin-only editorial workflow (draft → schedule → publish → archive) inside the existing Admin workspace, with audit logging.
3. Safe rich content: Markdown only, server-rendered and sanitized, with a controlled set of embeds.
4. First-class SEO/GEO: `BlogPosting` JSON-LD, article Open Graph tags, blog sitemap, `llms.txt` entries, validator coverage.
5. Ships dark behind a feature flag and degrades cleanly (empty states, hidden UI blocks) per the repo's "never render an unbacked placeholder" rule in `config/marketplace.php`.

**Non-goals (v1)**

- Seller-authored posts or a seller "Seller Centre blog" (Shopee runs separate seller-education content; revisit as a later workspace feature, see §14).
- Comments, reactions, user accounts on the blog, newsletter capture, push notifications.
- WYSIWYG / block editor. Markdown textarea with live preview is enough.
- Multi-language content or hreflang (single `en-PH` site, same as doc 14).
- Image CDN or responsive-image pipeline beyond what product images already do.
- Per-view analytics beyond a simple counter and existing GA4 page views.

---

## 3. Repo findings that shape the design

| #   | Finding                                                                                                                                                                                                                                                                  | Consequence for the blog                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | Controllers are thin `final class`es that take a `FormRequest` and an `Action` (`app/Actions/**`, `handle()` method), e.g. `Admin\CategoryController`. Actions are `final readonly` where stateless.                                                                     | Follow the same split. No business logic in controllers.                                                                                                       |
| F2  | Admin routes live under `Route::prefix('admin')->middleware('workspace:admin')` and every admin request authorizes with `$this->user()?->isAdmin() ? Response::allow() : Response::denyAsNotFound()`. `.ai/rules/workspaces.md` requires this and forbids hardcoded nav. | Blog admin goes under `admin/blog/*`, form requests under `App\Http\Requests\Admin\Blog\*`, nav item added only in `resources/js/lib/workspaces.ts`.           |
| F3  | Admin mutations call `RecordAuditLog::handle($actor, $action, $subject, $metadata, $ip)`.                                                                                                                                                                                | Every create/update/publish/archive/delete writes an audit row.                                                                                                |
| F4  | Public content pages are config-gated (`marketplace.pages.{key}.enabled`), 404 when off, and listed in `BuildPagesSitemap`.                                                                                                                                              | Blog gets `config('blog.enabled')`; when off every blog route 404s and sitemap/llms/footer omit it.                                                            |
| F5  | SEO is built by `Action → SeoData → Seo::set() → app.blade.php`, JSON-LD is composed through `SchemaGraph` + `app/Actions/Seo/Schema/Build*Node`. `JsonLdValidator` has per-type required-property rules and `SeoStructuredDataPolicyTest` renders pages in-process.     | Add `BuildBlogPostSeoData` etc. and `BuildBlogPostingNode`; extend the validator and policy test for `BlogPosting` and `Blog`.                                 |
| F6  | Doc 14 notes the template supports `article:*` tags but "no content page has real published/modified dates yet".                                                                                                                                                         | Blog posts are the first content with real dates; wire `article:published_time` / `modified_time` from `published_at` / `updated_at`.                          |
| F7  | Product images are stored with `$file->store('product-images', 'public')` and a public URL. The `media` table is for private docs/videos served through a short-lived signed redirect, which is unsuitable for `og:image`.                                               | Blog covers use the `public` disk like product images, never `media.view`.                                                                                     |
| F8  | No HTML sanitizer package is in `composer.json`; existing code uses `strip_tags` on plain-text-ish fields. `laravel/framework` already depends on `league/commonmark`.                                                                                                   | Store Markdown, render with CommonMark configured to strip raw HTML and block unsafe links. No new dependency needed **(verify `league/commonmark` version)**. |
| F9  | `share-buttons.tsx` takes `slug`, `count`, `enabled` and records shares via `products.shares.store`.                                                                                                                                                                     | Needs either `enabled={false}` for blog or a small extraction so blog sharing does not hit the product endpoint **(verify)**.                                  |
| F10 | `docs/design-system/` is frozen; UI work uses components in `resources/js/` (`.ai/rules/js.md`). After UI changes the rule is `optimize:clear` + `npm run build`.                                                                                                        | Reuse `carousel`, `chip`, `pagination`, `breadcrumb`, `faq-list`, `halal-badge`; do not consult the styleguide.                                                |
| F11 | CI (`.github/workflows/tests.yml`) triggers `push` on `main` and on every `pull_request`; the default branch is `production`.                                                                                                                                            | Already flagged in doc 14a. Open a PR for blog work so CI runs; do not rely on push-triggered CI.                                                              |
| F12 | `ProductSlugHistory` exists for slug-change redirects.                                                                                                                                                                                                                   | Mirror it as `blog_post_slug_histories`.                                                                                                                       |

---

## 4. Product spec

### 4.1 Audiences

- **Shoppers / searchers:** discover recipes, buying guides, seasonal content, then click through to products.
- **Answer engines and crawlers:** need server-rendered, well-structured, dated articles.
- **Admins (editors):** write, schedule and maintain posts. v1 has no separate editor role (§14).

### 4.2 Public routes

| Route                           | Name                   | Notes                                                                            |
| ------------------------------- | ---------------------- | -------------------------------------------------------------------------------- |
| `GET /blog`                     | `blog.index`           | Hero, category chips, latest grid, popular rail. `?page=`, `?q=`                 |
| `GET /blog/category/{category}` | `blog.categories.show` | Category intro, grid, pagination. Binds `blog_categories.slug`                   |
| `GET /blog/tag/{tag}`           | `blog.tags.show`       | Tag grid. `noindex,follow` until a tag has at least 3 posts (thin-content guard) |
| `GET /blog/feed.xml`            | `blog.feed`            | RSS 2.0, latest 20. Phase 4                                                      |
| `GET /blog/{post}`              | `blog.show`            | Binds `blog_posts.slug`, published only. Old slugs 301 to the current one        |

Route order matters: register `category/*`, `tag/*` and `feed.xml` before `blog/{post}`. Post slugs must not equal reserved words (`category`, `tag`, `feed.xml`, `search`, `page`); enforce in the slug rule and in a test.

Place them with the other public routes in `routes/web.php` (outside `auth`).

### 4.3 Page specs

**Index (`resources/js/pages/blog/index.tsx`)**

- `h1` "HalalBenta Blog" plus one-sentence intro (config-driven).
- Hero carousel: up to 5 featured posts (cover, category chip, title, excerpt on desktop). Hidden when none are featured.
- Category chip row: "All" plus each category that has at least one published post, in `sort_order`.
- Latest grid: 12 cards per page. Card = cover (fixed 16:9, `loading="lazy"` except first row), category chip, title (2-line clamp), excerpt (3-line clamp, hidden on small phones), date, reading minutes.
- Popular rail: top 5 by `view_count`; hidden on page 2+ and when search is active.
- Search box: `GET ?q=`; results replace the grid; empty state "No stories match 'x'" with a link back to all posts.
- Empty state (no posts at all): short message and link to the shop. Never shown as a broken page. In production with flag on and zero posts, return 200 with `noindex`.

**Category page:** same grid, category name as `h1`, `description` as intro paragraph (real copy only, same rule as `CategoryIntro`), breadcrumb Home › Blog › Category.

**Post page (`resources/js/pages/blog/show.tsx`)**

- Breadcrumb Home › Blog › Category › Title.
- Category chip, single `h1`, excerpt as standfirst, byline (display name from config, not a user's personal name by default), published date, "Updated" date only when materially later than published, reading minutes.
- Cover image with alt text (required), `width`/`height` set to avoid layout shift, eager-loaded (it is the LCP image).
- Share bar (copy link, native share on touch, Facebook/Messenger/Viber/X links; see F9).
- Table of contents (≥3 headings only).
- Body: server-rendered HTML segments plus product-card components (§7).
- Optional FAQ block (stored as structured Q&A, rendered with `faq-list.tsx` and emitted as `FAQPage` JSON-LD with the same parity guarantee as doc 14 T4.4). Phase 3.
- End-of-post CTA: "Shop {category cta label}" linking to the mapped storefront category (`blog_categories.shop_category_id`, nullable; hidden when null).
- Related posts: 3 cards.

**Home page:** optional "From the blog" strip with the 3 latest posts, rendered only when the flag is on and at least 3 posts exist. Footer gets a "Blog" link via `config/marketplace.php` (gated by the flag).

### 4.4 Admin spec (Admin workspace)

| Screen                            | Behaviour                                                                                                                                                                                    |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin/blog/posts` (list)         | Filter by status, category, free-text; columns: title, category, status (+ "Scheduled for …"), published date, views, featured. Uses `data-table.tsx`.                                       |
| `admin/blog/posts/create`, `edit` | Title, slug (auto, editable), category, tags (free-text combobox), excerpt (with counter), cover upload + alt text, Markdown body with live preview, SEO overrides, featured toggle, status. |
| Preview                           | `admin/blog/posts/{post}/preview` renders the public page for any status, always `noindex`, admin only.                                                                                      |
| `admin/blog/categories`           | Create/update/delete (blocked while posts exist; archive instead). Name, slug, description, sort order, optional shop category link.                                                         |
| Publish gate                      | Server-side checks (§5.3). The UI lists failing checks next to the publish button.                                                                                                           |
| Audit                             | `blog.post.created`, `.updated`, `.published`, `.unpublished`, `.archived`, `.deleted`, `.featured` with title and slug in metadata.                                                         |

Nav: one "Blog" item in the admin `nav` array in `resources/js/lib/workspaces.ts`. `tests/Unit/workspaces.test.mjs` must still pass.

### 4.5 Status model

`BlogPostStatus` enum (`app/Enums`): `draft`, `published`, `archived`.

- **Live** = `status = published` AND `published_at <= now()`.
- **Scheduled** = `status = published` AND `published_at > now()` (not live, shown as scheduled in admin).
- Archived posts 404 publicly; the old URL is not redirected.
- Unpublishing (back to `draft`) keeps `published_at` for history.

### 4.6 Editorial rules for a halal marketplace

These are policy, enforced where cheap and documented in the admin form help text.

1. No halal-certification claim about a brand or product unless the post embeds that product (so the badge comes from real data) or links to the verification page.
2. No health or medical claims. The publish checklist shows a warning if the body contains configurable red-flag phrases (`config('blog.flagged_phrases')`); it warns, it does not block.
3. Every product mention that sells something uses an embed or a normal link to a live product page; no raw external affiliate links.
4. Delivery, escrow and return statements must come from `TrustFacts` values (do not hardcode "7 days"), consistent with doc 14 T4.3. A `[[fact:return_window]]` token is a possible later addition; v1 relies on editorial discipline.

---

## 5. Data model

All new tables use ULID primary keys (like `media`, `product_images`). Foreign keys to `users`, `products` and `categories` must match the existing key types **(verify in the migrations before writing ours)**.

### 5.1 Tables

**`blog_categories`**

| Column             | Type                     | Notes                                      |
| ------------------ | ------------------------ | ------------------------------------------ |
| `id`               | ulid PK                  |                                            |
| `name`             | string(80)               |                                            |
| `slug`             | string(100) unique       | not a reserved word                        |
| `description`      | text nullable            | real intro copy; rendered on category page |
| `sort_order`       | unsignedSmallInteger     | default 0                                  |
| `shop_category_id` | FK `categories` nullable | `nullOnDelete`; drives the end-of-post CTA |
| timestamps         |                          |                                            |

**`blog_posts`**

| Column                   | Type                 | Notes                                                         |
| ------------------------ | -------------------- | ------------------------------------------------------------- |
| `id`                     | ulid PK              |                                                               |
| `blog_category_id`       | FK `blog_categories` | `restrictOnDelete`                                            |
| `author_id`              | FK `users` nullable  | `nullOnDelete`; internal only, not shown publicly by default  |
| `title`                  | string(160)          |                                                               |
| `slug`                   | string(160) unique   |                                                               |
| `excerpt`                | string(300)          | standfirst and meta-description fallback                      |
| `body_markdown`          | longText             | source of truth                                               |
| `body_html`              | longText             | rendered and sanitized on save; contains product markers (§7) |
| `toc`                    | json nullable        | `[{id, text, level}]`                                         |
| `word_count`             | unsignedInteger      | for reading time and `wordCount` in JSON-LD                   |
| `reading_minutes`        | unsignedTinyInteger  | `max(1, ceil(words / 200))`                                   |
| `cover_path`             | string nullable      | `public` disk, `blog-covers/…`                                |
| `cover_alt`              | string(200) nullable | required when `cover_path` is set                             |
| `cover_width/height`     | unsignedSmallInteger | stored at upload for `<img>` and `og:image:width/height`      |
| `faqs`                   | json nullable        | `[{question, answer}]` (Phase 3)                              |
| `status`                 | string(16)           | `BlogPostStatus`, default `draft`, indexed                    |
| `published_at`           | timestamp nullable   | indexed with `status`                                         |
| `is_featured`            | boolean              | default false                                                 |
| `view_count`             | unsignedInteger      | default 0                                                     |
| `seo_title`              | string(70) nullable  | optional override                                             |
| `seo_description`        | string(170) nullable | optional override                                             |
| timestamps, `deleted_at` |                      | soft deletes                                                  |

Indexes: `(status, published_at)`, `(blog_category_id, status, published_at)`, `(is_featured, status, published_at)`, unique `slug`.

**`blog_tags`** (`id`, `name` string(60), `slug` string(80) unique, timestamps) and pivot **`blog_post_tag`** (`blog_post_id`, `blog_tag_id`, composite PK, cascade deletes).

**`blog_post_products`** (`blog_post_id`, `product_id`, `sort_order`, composite PK, cascade deletes). Rebuilt from the `[[product:…]]` tokens on every save. It exists so a later "Featured in" block on product pages needs no body parsing.

**`blog_post_slug_histories`** (`id`, `blog_post_id`, `slug` unique, timestamps), mirroring `product_slug_histories`.

### 5.2 Models

`BlogPost`, `BlogCategory`, `BlogTag` under `app/Models`, `final`, `#[Fillable([...])]` attribute style as in `Media`, `HasUlids`, `HasFactory` (factories in `database/factories`). `BlogPost` scopes: `live()`, `featured()`, `inCategory()`, `search(string)`. Route binding for `blog.show` is overridden to resolve live posts only and fall back to `blog_post_slug_histories` (301).

### 5.3 Publish checks (server-side, `ValidateBlogPostForPublish`)

Blocking: title, slug valid and unique, category set, excerpt 50–300 chars, cover present with alt text, body ≥ 150 words, no empty product embeds (every `[[product:x]]` resolves to an existing product), `published_at` set (defaults to now).
Warning only: no `h2`, flagged phrases (§4.6), embedded products currently unavailable, cover smaller than 1200×630, duplicate `seo_title`.

---

## 6. Architecture

### 6.1 Backend files (new)

```
app/Enums/BlogPostStatus.php
app/Models/{BlogPost,BlogCategory,BlogTag}.php
app/Http/Controllers/
    Blog/BlogController.php                    // index (+ ?q=)
    Blog/BlogCategoryController.php            // show
    Blog/BlogTagController.php                 // show
    Blog/BlogPostController.php                // show
    Blog/BlogFeedController.php                // RSS (Phase 4)
    Admin/Blog/PostController.php              // resource
    Admin/Blog/PostPreviewController.php       // preview + markdown preview POST
    Admin/Blog/CategoryController.php          // resource
app/Http/Requests/
    Blog/ShowBlogIndexRequest.php              // validates page, q
    Admin/Blog/{Create,Update,Delete}BlogPostRequest.php
    Admin/Blog/{Create,Update,Delete}BlogCategoryRequest.php
    Admin/Blog/PreviewMarkdownRequest.php
app/Actions/Blog/
    ListBlogIndex.php  ListBlogCategoryPosts.php  ListBlogTagPosts.php
    ShowBlogPost.php   RecordBlogPostView.php     ListRelatedPosts.php
    RenderBlogBody.php        // markdown → sanitized html + toc + counts + product tokens
    SyncBlogPostRelations.php // tags, blog_post_products, slug history
    InvalidateBlogCache.php
    Admin/{CreateBlogPost,UpdateBlogPost,PublishBlogPost,ArchiveBlogPost,DeleteBlogPost}.php
    Admin/{Create,Update,Delete}BlogCategory.php
    Admin/StoreBlogCover.php
    Admin/ValidateBlogPostForPublish.php
app/Actions/Seo/
    BuildBlogIndexSeoData.php  BuildBlogCategorySeoData.php  BuildBlogPostSeoData.php
    BuildBlogSitemap.php
    Schema/{BuildBlogNode,BuildBlogPostingNode}.php
app/Support/BlogSegments.php   // splits body_html on product markers
config/blog.php
database/migrations/…_create_blog_tables.php
database/factories/{BlogPost,BlogCategory,BlogTag}Factory.php
database/seeders/BlogSeeder.php   // local/dev only
```

Controllers stay `final class` with the request + action signature used by `Admin\CategoryController` (F1). Admin requests use the `isAdmin()` / `denyAsNotFound()` pattern (F2).

### 6.2 Frontend files (new)

```
resources/js/pages/blog/{index,show}.tsx
resources/js/pages/admin/blog/{posts,post-form,categories}.tsx
resources/js/components/blog/
    blog-card.tsx  blog-hero.tsx  blog-category-chips.tsx  blog-toc.tsx
    blog-body.tsx           // renders segments: sanitized HTML + <BlogProductCard>
    blog-product-card.tsx   // uses halal-badge.tsx, price formatting from lib/format.ts
    blog-related.tsx  blog-share-bar.tsx
```

Edit: `resources/js/lib/workspaces.ts` (admin nav), `site-footer.tsx` / `config/marketplace.php` (footer link), `pages/home.tsx` and `ListHomeFeed` (optional "From the blog" strip), `components/share-buttons.tsx` (F9).

Per the repo's JS rule, after UI changes run `vendor/bin/sail artisan optimize:clear` and `vendor/bin/sail npm run build`, and run `npm run check` (includes `scan-violations.mjs`, contrast, workspaces and JSON-LD tests).

### 6.3 Caching

- Index data (hero, popular, category chips) cached 5 minutes under `blog:index:*` keys. Use plain keys, not tags, because the cache driver may not support tags **(verify)**.
- `InvalidateBlogCache` runs on post/category save and delete (observer, same pattern as the sitemap invalidation hooks) and also clears `sitemap:blog` and `llms:txt`.
- `body_html` is stored, so a post view does no Markdown parsing.
- Lists select only card columns (never `body_*`), and eager load `category` and `tags`. No queries in loops; add a query-count assertion in the index feature test.

### 6.4 Share bar

`ShareButtons` currently posts to `products.shares.store` when `slug`/`enabled` are set (F9). For the blog, pass `enabled={false}` and no `slug`, or extract a presentational `ShareMenu` used by both. Decide in B3.6 after reading the component; do not add a blog share-tracking endpoint in v1.

---

## 7. Markdown rendering and embeds

**Renderer (`RenderBlogBody`)** uses CommonMark with:

- `html_input: strip` (no raw HTML from authors), `allow_unsafe_links: false`.
- Heading offset: `#` becomes `h2`, so the page has exactly one `h1` (the title). Anything deeper than `h4` is flattened.
- Heading ids (slugified, de-duplicated) for anchors and the TOC.
- External links get `rel="noopener noreferrer"` and `target="_blank"`; `nofollow` is controlled by `config('blog.nofollow_external')` (default true).
- Images must have alt text; a missing alt is a publish warning. Body images render `loading="lazy"` and `decoding="async"`. v1 allows only images uploaded through the blog image endpoint or same-origin URLs (**open question** §14: whether to allow body image uploads in v1 or cover-only).
- Output is plain HTML (no scripts, iframes or inline styles). A unit test feeds hostile Markdown (`<script>`, `javascript:` links, `onerror=` attributes, nested HTML) and asserts none survives.

**Embeds (custom block syntax)**

```
[[product:halal-beef-tapa-500g]]
```

On a line by itself, replaced with a marker element `<div data-blog-product="halal-beef-tapa-500g"></div>`. Inline use inside a sentence is ignored and flagged as a warning.

`SyncBlogPostRelations` extracts slugs into `blog_post_products`. At request time `BlogSegments` splits `body_html` on the markers into `[{type:'html', html}, {type:'product', product}]`, where `product` is looked up in one batched query using the catalogue's public-visibility rules (approved shop, not hidden or moderated, same scope the category and home feeds use **(verify the exact scope)**). Unavailable products are skipped silently so a stale embed never breaks the page. `blog-body.tsx` maps segments to HTML blocks and `<BlogProductCard>`, which keeps SSR intact and the card data live (price, stock, halal badge).

Product-card links append `?utm_source=blog&utm_medium=content&utm_campaign={post-slug}`. Doc 14 T3.5 strips tracking params from canonicals, so this does not create duplicate-URL SEO issues.

---

## 8. SEO and GEO integration (builds on doc 14)

| Surface            | Spec                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title              | Post: `{seo_title ?? title} \| HalalBenta Blog`. Index: `HalalBenta Blog – halal shopping guides, recipes and tips`. Category: `{name} \| HalalBenta Blog`.                                                                                                                                                                                                                                                                                                                |
| Description        | Post: `seo_description ?? excerpt`, trimmed to the repo's meta length. Category: `description` or a generated sentence from real counts.                                                                                                                                                                                                                                                                                                                                   |
| Canonical / robots | Self-canonical per page, `?page=` pages self-canonical with prev/next (as category pages). `?q=` and `?page` beyond the last are `noindex,follow` (add `q` to the noindex query-param list in `config/seo.php`, **verify the key name**). Preview and draft routes `noindex`. Private-path rules unchanged.                                                                                                                                                                |
| JSON-LD            | One `@graph` per page via `SchemaGraph`. Post: `WebPage` wrapper → `BlogPosting` (`@id` `/blog/{slug}#article`, `headline`, `description`, `image[]` absolute, `datePublished`, `dateModified`, `author` and `publisher` → Organization `@id`, `mainEntityOfPage`, `articleSection`, `keywords`, `wordCount`, `inLanguage: en-PH`) + `BreadcrumbList` (+ `FAQPage` when FAQs exist). Index: `Blog` node with `blogPost` stubs sharing post `@id`s via `BuildItemListNode`. |
| Open Graph         | `og:type=article`, `article:published_time`, `article:modified_time`, `article:section`, `article:tag`, `og:image` = cover (absolute https, with `og:image:width/height/alt`). No cover → `GenerateSocialImage` with a new `blog` type so a post never ships without an image.                                                                                                                                                                                             |
| Sitemap            | New `sitemap-blog.xml` (`BuildBlogSitemap`) linked from `BuildSitemapIndex`, only live posts, `lastmod = updated_at`, cached `sitemap:blog` 1 h, cleared by `InvalidateBlogCache`. Categories with posts included; tags only when indexable.                                                                                                                                                                                                                               |
| `llms.txt`         | `BuildLlmsTxt` gains a "Blog" section with the 10 latest posts (title, URL, one-line excerpt). Omitted when the flag is off or no posts exist. Same production-only 404 rule already in place.                                                                                                                                                                                                                                                                             |
| Validator and CI   | `JsonLdValidator` (PHP) and `scripts/validate-jsonld.mjs` (Node twin) learn `BlogPosting` (required: `headline`, `image`, `datePublished`, `author`) and `Blog`. `SeoStructuredDataPolicyTest` renders a post, the index and a category. `tests/Unit/jsonld-validator.test.mjs` gets blog fixtures.                                                                                                                                                                        |
| Audit command      | `seo:audit` samples the 2 latest posts and the blog index and includes `sitemap-blog.xml`.                                                                                                                                                                                                                                                                                                                                                                                 |
| Entity honesty     | Author is the Organization ("HalalBenta Editorial") unless a named, real author profile exists (open question §14). No invented ratings, review counts or dates.                                                                                                                                                                                                                                                                                                           |

---

## 9. Security, privacy, performance, accessibility

**Security**

- Authoring is admin-only and every admin request authorizes in the FormRequest (F2). Non-admins get 404, not 403.
- Markdown is the only input format; HTML is stripped (§7). The rendered `body_html` is trusted by the frontend only because it is produced by `RenderBlogBody`; never render `body_markdown` or user-supplied HTML directly.
- Cover upload: allow `image/jpeg|png|webp`, max 3 MB, min 1200×630, verified by content sniffing (not extension), stored under a random name on the `public` disk. Reuse the product-image MIME allowlist. Antivirus parity with `MediaUploadService::scanningEnabled()` is an open question (§14).
- The Markdown preview endpoint is admin-only, throttled, and returns rendered HTML from the same renderer (no second code path).
- JSON-LD output goes through `SchemaGraph::encode()` (`JSON_HEX_TAG|JSON_HEX_AMP`), so titles cannot break out of the script tag.
- View counting ignores bots (common crawler user-agents and `HumanPass` failures) and counts at most once per session per post per day, via a cache key. It never writes on the HEAD/prefetch requests.

**Privacy:** the blog collects nothing about readers beyond the existing GA4 page views. The author's personal name and email are never exposed unless an author-profile feature is added.

**Performance budget:** post page server time under 100 ms warm (one post query, one batched product query, one related-posts query); LCP image eager and sized; no new client JS dependency (TOC highlighting uses `IntersectionObserver`).

**Accessibility:** one `h1`; heading order preserved by the renderer; TOC is a `nav` with `aria-label`; carousel respects reduced motion and has visible controls (reuse `carousel.tsx` checks); cover alt text required; card links are whole-card anchors with a single accessible name; focus-visible styles; contrast verified by `tests/Unit/contrast.test.mjs` for any new tokens.

---

## 10. Configuration (`config/blog.php`, all optional env)

| Key                      | Env                      | Default                                 | Purpose                                          |
| ------------------------ | ------------------------ | --------------------------------------- | ------------------------------------------------ |
| `enabled`                | `BLOG_ENABLED`           | `false`                                 | Master flag: routes, sitemap, llms, footer, home |
| `title`                  | `BLOG_TITLE`             | `HalalBenta Blog`                       | Index `h1` and titles                            |
| `intro`                  | `BLOG_INTRO`             | _(empty, block hidden)_                 | Index standfirst                                 |
| `per_page`               | `BLOG_PER_PAGE`          | `12`                                    | Grid size                                        |
| `hero_count`             | –                        | `5`                                     | Featured slots                                   |
| `popular_count`          | –                        | `5`                                     | Popular rail size                                |
| `related_count`          | –                        | `3`                                     | Related posts                                    |
| `author_display`         | `BLOG_AUTHOR_DISPLAY`    | `HalalBenta Editorial`                  | Public byline and schema author                  |
| `nofollow_external`      | `BLOG_NOFOLLOW_EXTERNAL` | `true`                                  | `rel` on external body links                     |
| `reserved_slugs`         | –                        | `category, tag, feed.xml, search, page` | Slug validation                                  |
| `flagged_phrases`        | –                        | small starter list                      | Publish warnings (§4.6)                          |
| `cover.min_width/height` | –                        | `1200` / `630`                          | Cover validation                                 |
| `cover.max_kb`           | –                        | `3072`                                  | Cover validation                                 |

Document every env var in `.env.example` (the repo does this for SEO and marketplace vars).

---

## 11. Implementation plan and tasks

Ship in phases; each phase is mergeable on its own because everything stays dark behind `BLOG_ENABLED=false`.

### Phase 0 — Foundations

| Task | Description                                                                                                                                                     | Acceptance                                                                                       | Status      |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------- |
| B0.1 | Read `.ai/rules/{js,workspaces,e2e,planning}.md` and `.ai/guidelines/*`; confirm FK types and the catalogue visibility scope (marked **verify** in §3, §5, §7). | Findings appended to this doc's §3 notes.                                                        | Not started |
| B0.2 | `config/blog.php` and `.env.example` entries (§10).                                                                                                             | `config('blog.enabled')` false by default.                                                       | Not started |
| B0.3 | Migration for all tables in §5.1; `BlogPostStatus` enum; models, factories.                                                                                     | `migrate:fresh` and rollback work; factory states `draft`, `published`, `scheduled`, `archived`. | Not started |
| B0.4 | Feature-flag middleware or controller guard so every public blog route 404s when disabled.                                                                      | Test: each route returns 404 with flag off.                                                      | Not started |

### Phase 1 — Admin authoring (no public pages yet)

| Task | Description                                                                                                                                           | Acceptance                                                                                             | Status      |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------- |
| B1.1 | `RenderBlogBody` (Markdown → html, toc, counts, product tokens) with the config in §7.                                                                | Unit tests incl. hostile-input suite; one `h1` guaranteed; ids de-duplicated.                          | Not started |
| B1.2 | Admin categories: controller, requests, actions, page `admin/blog/categories.tsx`, audit logging.                                                     | CRUD feature tests; delete blocked when posts exist; non-admin gets 404.                               | Not started |
| B1.3 | Admin posts: create/update/delete actions, requests, slug generation + history, tag sync, `blog_post_products` sync, cover upload (`StoreBlogCover`). | Feature tests incl. slug change creates history row; cover rules (type, size, dimensions, alt).        | Not started |
| B1.4 | `ValidateBlogPostForPublish` + `PublishBlogPost` / `ArchiveBlogPost`; scheduled = future `published_at`.                                              | Tests for each blocking rule and each warning; scheduled post is not live until its time (`travelTo`). | Not started |
| B1.5 | Admin pages `posts.tsx`, `post-form.tsx` with Markdown editor, live preview endpoint, checklist panel; admin nav item in `workspaces.ts`.             | `workspaces.test.mjs` passes; preview matches public render byte-for-byte (shared renderer).           | Not started |
| B1.6 | Audit log actions (§4.4) via `RecordAuditLog`.                                                                                                        | Test asserts audit row per mutation.                                                                   | Not started |

### Phase 2 — Public blog

| Task | Description                                                                                                           | Acceptance                                                                  | Status      |
| ---- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------- |
| B2.1 | Routes (§4.2) with correct ordering, route-binding override (live only, slug-history 301), reserved-slug guard.       | Tests: draft/scheduled/archived 404; old slug 301; reserved slug rejected.  | Not started |
| B2.2 | `ListBlogIndex`, category/tag actions, search, pagination, caching and `InvalidateBlogCache` observers.               | Feature test with query-count ceiling; cache cleared on publish.            | Not started |
| B2.3 | Index and category pages: hero, chips, grid, popular rail, search, empty states.                                      | Inertia prop assertions; empty state renders 200.                           | Not started |
| B2.4 | Post page: byline, cover, TOC, body segments, related posts, CTA, breadcrumb.                                         | Props test; exactly one `h1` in server HTML.                                | Not started |
| B2.5 | `BlogSegments` + `blog-product-card.tsx` with halal badge, live price/stock, UTM links; unavailable products skipped. | Tests: hidden/out-of-moderation product omitted; one batched product query. | Not started |
| B2.6 | Footer link, optional home "From the blog" strip, flag gating.                                                        | Home hides strip with fewer than 3 posts; footer link only when enabled.    | Not started |
| B2.7 | `RecordBlogPostView` (bot-excluded, once per session/post/day).                                                       | Tests: bot UA ignored, second view same day ignored.                        | Not started |
| B2.8 | Share bar (resolve F9).                                                                                               | No request to `products.shares.store` from a blog page.                     | Not started |

### Phase 3 — SEO and GEO

| Task | Description                                                                                                               | Acceptance                                                                        | Status      |
| ---- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------- |
| B3.1 | `BuildBlogIndexSeoData`, `BuildBlogCategorySeoData`, `BuildBlogPostSeoData` and `BuildBlogNode` / `BuildBlogPostingNode`. | Policy test passes through `JsonLdValidator`; `@id`s resolve; XSS test on title.  | Not started |
| B3.2 | Open Graph/Twitter article tags; `GenerateSocialImage` `blog` type fallback; `PreWarmSocialImageJob` on publish.          | `SeoSocialTagsTest` extended; no post without `og:image`.                         | Not started |
| B3.3 | `BuildBlogSitemap`, index entry, cache invalidation, `lastmod`.                                                           | Sitemap lists only live posts; no static-file shadowing (`.gitignore` unchanged). | Not started |
| B3.4 | `llms.txt` blog section; `seo:audit` blog samples; `config/seo.php` noindex param for blog search.                        | Existing `SeoGeoTest` / `SeoAuditTest` extended and green.                        | Not started |
| B3.5 | Extend `JsonLdValidator` + Node twin + fixtures for `BlogPosting` / `Blog`.                                               | `npm run check` green.                                                            | Not started |
| B3.6 | FAQ block (admin form, `faq-list.tsx`, `FAQPage` via `BuildFaqNode`) with visible-equals-markup parity test.              | Parity test; posts without FAQs emit no FAQ markup.                               | Not started |

### Phase 4 — Polish and growth (optional, order flexible)

| Task | Description                                                                                           | Status      |
| ---- | ----------------------------------------------------------------------------------------------------- | ----------- |
| B4.1 | RSS feed `/blog/feed.xml` and `<link rel="alternate">` in the head.                                   | Not started |
| B4.2 | Thirty-day popularity (`blog_post_daily_views`) replacing all-time `view_count` for the rail.         | Not started |
| B4.3 | "Featured in" block on product pages driven by `blog_post_products`.                                  | Not started |
| B4.4 | Body image upload endpoint with the same validation as covers.                                        | Not started |
| B4.5 | GA4 events for blog product-card clicks (reuse `GoogleAnalyticsService`).                             | Not started |
| B4.6 | `[[fact:…]]` tokens backed by `TrustFacts` so policy statements can never drift from the real values. | Not started |

### Phase 5 — Verification and rollout

| Task | Description                                                                                                                                                                                                                   | Status      |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| B5.1 | Playwright spec `tests/e2e/specs/blog.spec.ts` (admin creates and publishes a post with a product embed; public index, category, post, search; draft hidden) registered in `tests/e2e/scenarios.json` per `.ai/rules/e2e.md`. | Not started |
| B5.2 | Manual validation per [`14a-seo-validation-runbook.md`](./14a-seo-validation-runbook.md) §2 (Rich Results Test for `BlogPosting`, Facebook/LinkedIn/X debuggers, Viber/WhatsApp previews).                                    | Not started |
| B5.3 | Seed 6–10 launch posts in at least 3 categories before enabling the flag; submit `sitemap-blog.xml` in Search Console.                                                                                                        | Not started |
| B5.4 | Enable `BLOG_ENABLED=true` on staging, run `php artisan seo:audit --require-ssr`, then production.                                                                                                                            | Not started |

---

## 12. Test plan

Pest (feature unless noted); files under `tests/Feature/Blog/` and `tests/Unit/`.

| File                                  | Covers                                                                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `Unit/RenderBlogBodyTest.php`         | Heading offset, ids, TOC, word count, product tokens, hostile Markdown (script, `javascript:`, event attributes, nested HTML) |
| `Feature/Blog/BlogFlagTest.php`       | Every public route 404s when disabled; sitemap/llms/footer omit blog                                                          |
| `Feature/Blog/BlogVisibilityTest.php` | Draft, scheduled (`travelTo`), archived, soft-deleted are 404; slug history 301; reserved slugs                               |
| `Feature/Blog/BlogIndexTest.php`      | Hero, chips only for categories with posts, pagination, search, empty state, query-count ceiling                              |
| `Feature/Blog/BlogPostPageTest.php`   | Props, related posts, product segments, unavailable product omitted, UTM on links, bot view ignored                           |
| `Feature/Admin/Blog/*Test.php`        | Authorization (guest, buyer, seller, admin), CRUD, publish checks, cover rules, audit rows, tag and product sync              |
| `Feature/Blog/BlogSeoTest.php`        | Canonicals, robots, OG article tags, `og:image` fallback, JSON-LD through `JsonLdValidator`, sitemap, `llms.txt`              |
| `Unit/jsonld-validator.test.mjs`      | Blog fixtures                                                                                                                 |
| `tests/e2e/specs/blog.spec.ts`        | Authoring-to-reading happy path (B5.1)                                                                                        |

Run before merging: `php artisan test --compact --filter=Blog`, the existing `--filter=Seo` suites, `vendor/bin/pint`, `vendor/bin/phpstan`, and `npm run check`.

---

## 13. Risks and mitigations

| Risk                                                              | Mitigation                                                                                                |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Thin or duplicated content hurts SEO                              | Publish gate (≥150 words, unique excerpt), tags noindex until 3 posts, launch with 6–10 real posts (B5.3) |
| Unverified halal or health claims create trust and legal exposure | Editorial rules (§4.6), flagged-phrase warnings, embeds source halal data from real product records       |
| Stored XSS through the body                                       | Markdown-only, HTML stripped, hostile-input unit tests, JSON-LD hex-escaped                               |
| Stale product embeds break pages                                  | Embeds resolve at request time and are skipped when unavailable; publish warning for unavailable products |
| Cache serves unpublished or removed content                       | Observers call `InvalidateBlogCache`; short 5-minute TTL as a backstop                                    |
| View counter inflated by bots or refresh                          | UA/human-pass filter, once per session/post/day                                                           |
| CI does not run on pushes to `production` (F11)                   | Work through pull requests so `pull_request` CI runs                                                      |
| Route collisions (`/blog/category`, a post titled "Tag")          | Reserved-slug validation and route ordering tests                                                         |
| All-time popularity favours old posts                             | Accepted for v1; B4.2 introduces a 30-day window                                                          |

---

## 14. Open questions (need a human decision)

1. **Editors:** admin-only is assumed. Is a dedicated `editor` role wanted, and should it live in the Admin workspace or get its own? (This changes `User::role` handling and `Workspace::accessibleBy`.)
2. **Authors:** keep the organization byline ("HalalBenta Editorial") or add named author profiles? Named authors improve E-E-A-T signals but need real bios and a privacy decision.
3. **Seller content:** should shops be able to submit posts (moderated through the existing moderation queue) in a later phase?
4. **Body images:** cover-only in v1, or body image uploads from day one (B4.4 pulled forward)?
5. **Upload scanning:** should blog covers go through the same ClamAV job as `media` uploads, or is the product-image path (no scan) the accepted standard?
6. **Brand voice and categories:** confirm the launch category set (suggestion: Shopping guides, Halal food and pantry, Recipes, Ramadan and Eid, Lifestyle, Seller stories) and who writes the first posts.
7. **AI-crawler policy:** blog content is the most likely target for training crawlers. Doc 14 T4.1 left the allow/block decision open; confirm before launch that it is acceptable for blog content.
8. **Tracking:** are UTM parameters on blog product links acceptable for the existing GA4 setup, and is a blog content group wanted?
9. **Domain placement:** `/blog` on the main domain (assumed, best for SEO) versus a subdomain.
