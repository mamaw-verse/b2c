# 15 — Blog (Shopee-style editorial hub): plan, spec and implementation tasks

**Repo:** `mamaw-verse/b2c` (HalalBenta, Laravel + Inertia/React 19 + Tailwind 4, Pest tests, Playwright e2e)
**Branch audited:** `production` (the repo has no `main` branch; `production` is the default, `develop` also exists)
**Scope:** public blog (`/blog`), invited editors and author profiles (Admin workspace), image pipeline, product embeds, SEO/GEO integration with [`14`](./14-seo-geo-optimization.md), seller stories (Phase 6)
**Date written:** 2026-11-25 · **Revision 2:** same day, open questions answered and folded in (§14) · **Revision 3:** same day, the remaining defaults accepted and made concrete; consent copy drafted (Appendix A)

---

## 0. Status

**Planning only.** Nothing in this document is implemented. No application code was written or run while producing it, and no file outside `docs/planning/` was touched. Every task in §11 starts as _Not started_. Per `.ai/rules/planning.md`, tick a task only when a passing test or e2e run proves it, and record deviations in the task's notes column.

The repo findings in §3 come from reading the `production` branch. Items marked **(verify)** were inferred and must be confirmed in code before building on them (task B0.1).

**Shopee reference note.** "Shopee-style" here means the common marketplace-blog patterns in §1 (featured hero, category navigation, card grid, article page with table of contents, shoppable product cards, related reads). The live Shopee blog was not re-audited for this document, so treat §1 as a design brief rather than a pixel spec. We copy the _pattern_, never Shopee's content, copy, imagery or branding.

**Progress (2026-11-25):** Phase 1: B1.1 to B1.3 are done (tested locally, see the Phase 1 notes). B1.4 to B1.9 are done (Pest green locally, build succeeds). B1.10 stays "Written, not run" until image upload/delete audit rows exist. Phase 0 is implemented and tested (B0.1–B0.5; B0.4 is partial by design, see the Phase 0 notes under §11). **Phase 2: B2.1 to B2.4 are done** (Pest green locally). **Phase 3: B3.1 to B3.6 are done** (Pest green locally: `tests/Feature/Blog`, `tests/Feature/SeoStructuredDataPolicyTest.php`, `tests/Unit/JsonLdValidatorTest.php` — 213 tests); B2.5 to B2.8 and Phases 4–6 are not started. The "Planning only" statement above describes the original document; the blog is still dark (`BLOG_ENABLED=false`); the public routes and pages now exist behind that flag.

**Revision 3:** the five remaining defaults (editor permission scope, editors' workspaces, seller-story permissions, consent wording, admin authorship) are now accepted decisions (§14 #10–14), the consent copy is drafted in Appendix A (pending legal review before launch), and the editor workspace label and admin author-on-demand behaviour are specified in B1.5 and B1.9.

**Revision 2 decisions (all baked into the sections below; full log in §14):** editors are invited by an admin and work inside the Admin namespace · posts are credited to **author profiles** and an editor can write on behalf of another author · seller stories are a later phase · cover, thumbnail and body images are all in v1 · no antivirus scanning · launch categories and AI-crawler policy accepted · tracking follows the recommendation in §7.3 · the blog lives at `/blog` on the main domain.

---

## 1. What "like Shopee's blog" means for HalalBenta

| Pattern (marketplace-blog convention)           | HalalBenta decision                                                                                             |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Featured hero / carousel of top stories         | `is_featured` posts, max 5, rendered with the existing `carousel.tsx`                                           |
| Category navigation (tabs / chips)              | `blog_categories` with chip row on the index (`chip.tsx`); each category has its own URL                        |
| Card grid of latest stories (cover, tag, title) | 12 per page, numbered pagination (`pagination.tsx`), self-canonical pages, cards use the post's **thumbnail**   |
| "Popular / trending" rail                       | Top posts by `view_count`; upgrade path to a 30-day window in Phase 4                                           |
| Search within the blog                          | `?q=` on `/blog`, `noindex,follow`                                                                              |
| Article page: breadcrumb, byline, read time     | Breadcrumb, category chip, **author byline linking to the author profile**, date, reading minutes, last-updated |
| In-article table of contents                    | Generated from `h2`/`h3`, sticky on desktop, collapsible on mobile                                              |
| Share buttons                                   | Reuse `share-buttons.tsx` (see §6.4: it is coupled to product share tracking today)                             |
| Shoppable products inside the article           | `[[product:slug]]` embeds render live product cards with halal badge, price, stock                              |
| Related articles                                | Same category first, then shared tags, 3 cards                                                                  |
| CTA banner back into the shop                   | Category-linked CTA at the end of each post (configurable)                                                      |
| Content calendar / scheduling                   | `published_at` in the future = scheduled; no queue job needed (query-time filter)                               |
| Seller education / stories                      | "Seller stories" category, submitted by sellers and moderated (Phase 6)                                         |

**HalalBenta-specific additions** (not in a generic marketplace blog): halal-claim editorial rules (§4.6), consent-gated author credits (§4.7), seasonal categories such as Ramadan and Eid, and blog-to-product click attribution through GA4 events rather than UTM links (§7.3).

---

## 2. Goals and non-goals

**Goals**

1. A public blog at `/blog` on the main domain that drives organic search and AI-answer traffic and funnels readers into product pages.
2. An editorial workflow (draft → schedule → publish → archive) inside the existing Admin workspace, with **editors invited by an admin**, audit logging, and posts credited to **author profiles** that need not be the logged-in user.
3. Safe rich content: Markdown only, server-rendered and sanitized, with a controlled set of embeds and an image pipeline for cover, thumbnail, body and avatar images.
4. First-class SEO/GEO: `BlogPosting` JSON-LD with a `Person` author, article Open Graph tags, blog sitemap, `llms.txt` entries, validator coverage.
5. Ships dark behind a feature flag and degrades cleanly (empty states, hidden UI blocks) per the repo's "never render an unbacked placeholder" rule in `config/marketplace.php`.

**Non-goals (v1, Phases 0–5)**

- Seller-submitted stories. They are planned (Phase 6) but not part of the first release.
- Comments, reactions, reader accounts on the blog, newsletter capture, push notifications.
- WYSIWYG / block editor. Markdown textarea with live preview is enough.
- External image CDN, video, GIF or SVG uploads.
- Multi-language content or hreflang (single `en-PH` site, same as doc 14).
- Per-view analytics beyond a simple counter, existing GA4 page views and the click event in §7.3.
- Antivirus scanning of uploads (decision in §14).

---

## 3. Repo findings that shape the design

| #   | Finding                                                                                                                                                                                                                                                                      | Consequence for the blog                                                                                                                                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | Controllers are thin `final class`es that take a `FormRequest` and an `Action` (`app/Actions/**`, `handle()` method), e.g. `Admin\CategoryController`. Actions are `final readonly` where stateless.                                                                         | Follow the same split. No business logic in controllers.                                                                                                                                                       |
| F2  | Admin routes live under `Route::prefix('admin')->middleware('workspace:admin')` and every admin request authorizes with `$this->user()?->isAdmin() ? Response::allow() : Response::denyAsNotFound()`. `.ai/rules/workspaces.md` requires this and forbids hardcoded nav.     | Blog admin goes under `admin/blog/*`. Because editors are not admins, the route group must be split (§4.4, §6.5) so editors reach **only** blog routes. Nav is added only in `resources/js/lib/workspaces.ts`. |
| F3  | Admin mutations call `RecordAuditLog::handle($actor, $action, $subject, $metadata, $ip)`.                                                                                                                                                                                    | Every create/update/publish/archive/delete/invite writes an audit row; on-behalf posts record both creator and author.                                                                                         |
| F4  | Public content pages are config-gated (`marketplace.pages.{key}.enabled`), 404 when off, and listed in `BuildPagesSitemap`.                                                                                                                                                  | Blog gets `config('blog.enabled')`; when off every blog route 404s and sitemap/llms/footer omit it.                                                                                                            |
| F5  | SEO is built by `Action → SeoData → Seo::set() → app.blade.php`, JSON-LD is composed through `SchemaGraph` + `app/Actions/Seo/Schema/Build*Node`. `JsonLdValidator` has per-type required-property rules and `SeoStructuredDataPolicyTest` renders pages in-process.         | Add `BuildBlogPostSeoData` etc. and `BuildBlogPostingNode`/`BuildPersonNode`; extend the validator and policy test.                                                                                            |
| F6  | Doc 14 notes the template supports `article:*` tags but "no content page has real published/modified dates yet".                                                                                                                                                             | Blog posts are the first content with real dates; wire `article:published_time` / `modified_time` from `published_at` / `updated_at`.                                                                          |
| F7  | Product images are stored with `$file->store('product-images', 'public')` and a public URL. The `media` table is for private docs/videos served through a short-lived signed redirect, unsuitable for `og:image`.                                                            | Blog images use the `public` disk (configurable), never `media.view`.                                                                                                                                          |
| F8  | No HTML sanitizer package is in `composer.json`; existing code uses `strip_tags` on plain-text-ish fields. `laravel/framework` already depends on `league/commonmark`.                                                                                                       | Store Markdown, render with CommonMark configured to strip raw HTML and block unsafe links. No new dependency **(verify `league/commonmark` version)**.                                                        |
| F9  | `share-buttons.tsx` takes `slug`, `count`, `enabled` and records shares via `products.shares.store`.                                                                                                                                                                         | Needs `enabled={false}` for blog or a small extraction so blog sharing does not hit the product endpoint **(verify)**.                                                                                         |
| F10 | `docs/design-system/` is frozen; UI work uses components in `resources/js/` (`.ai/rules/js.md`). After UI changes the rule is `optimize:clear` + `npm run build`.                                                                                                            | Reuse `carousel`, `chip`, `pagination`, `breadcrumb`, `faq-list`, `halal-badge`; do not consult the styleguide.                                                                                                |
| F11 | CI (`.github/workflows/tests.yml`) triggers `push` on `main` and on every `pull_request`; the default branch is `production`.                                                                                                                                                | Already flagged in doc 14a. Open a PR for blog work so CI runs; do not rely on push-triggered CI.                                                                                                              |
| F12 | `ProductSlugHistory` exists for slug-change redirects.                                                                                                                                                                                                                       | Mirror it as `blog_post_slug_histories`.                                                                                                                                                                       |
| F13 | `users.role` is a plain string holding `admin` or `buyer`; seller access is derived from shop membership (migration `2026_11_08_041600_change_seller_role_to_buyer_on_users`). `User::isAdmin()` is `role === 'admin'`.                                                      | `editor` can be a third role value without touching shop logic. Search the codebase for other `role ===` / `isAdmin()` uses that would mis-handle an unknown role **(verify, B0.1)**.                          |
| F14 | `Workspace::accessibleBy(Admin)` is `isAdmin()`; `Workspace::allowedFor` gives admins only `[Admin]`; `Workspace::home(Admin)` is `/admin/dashboard`. `workspace:admin` middleware gates the whole admin route group.                                                        | Editors need a controlled opening into the Admin workspace (§6.5) and a different home (`/admin/blog/posts`).                                                                                                  |
| F15 | Staff invitations already exist: `ShopStaffInvitationController`, `InviteShopStaff` / `AcceptShopStaffInvitation` actions, `ShopStaffInvitationNotification`, route `staff-invitations/{id}` that sends guests to login or register (with `url.intended` and a session key). | Editor invitations mirror this flow instead of inventing a new one.                                                                                                                                            |
| F16 | `ModerationItemType` has `General, Halal, Report, Keyword, Expiry, ShopApplication, Manual`; moderation routes are admin-only.                                                                                                                                               | Seller stories (Phase 6) add a `BlogStory` type to the existing queue and are reviewed by admins **(verify queue item shape)**.                                                                                |
| F17 | The GA4 snippet lives in `resources/views/app.blade.php`; `GoogleAnalyticsService` is the server-side _reporting_ client (Data API) for the admin dashboard. There is no client event helper in `resources/js` yet.                                                          | Blog click tracking needs a tiny guarded `trackEvent` helper (§7.3) **(verify consent/gtag availability)**.                                                                                                    |
| F18 | GD is already used (`GenerateSocialImage`, bundled fonts).                                                                                                                                                                                                                   | Image variants are generated with GD **(verify `imagewebp`, `imagejpeg` support in the Docker image and CI)**.                                                                                                 |

### B0.1 findings (2026-11-25, read from `production` at `b00611a`)

Resolves the **(verify)** items above. Anything not proven is marked as such and carried to the named task.

- **Key types (F-FK):** `users`, `products` and `categories` all use ULID primary keys, so every blog foreign key uses `foreignUlid`. Confirmed by the migrations and by the blog migration running.
- **F13 `users.role`:** it is `string('role')->default('buyer')->index()` (migration `2026_11_06_104723`), with no check constraint, so adding `editor` needs no schema change. Code that reads the role: `User::isAdmin()`, `Workspace::allowedFor/accessibleBy`, `ListAdminUsers` (filters by role), `ShowAdminUser`, `SubmitShopApplication` (`where('role', 'admin')`), `CreateAdminUser`, `RevokeAdminAccess` (sets `buyer`). Nothing special-cases unknown values, and `Workspace::accessibleBy(Buyer)` is `! isAdmin()`, so an editor keeps buyer access. The admin user list may want an `editor` filter option (B1.4).
- **F9/B1.9 role in the client:** Inertia shares `auth.user` as the full user model and `User` only hides `password`, `google_id`, the 2FA fields and `remember_token`, so `role` already reaches the frontend. B1.9 can switch the shell title to "Editorial" without a new shared prop.
- **Catalogue visibility (§7.2):** `Product::visible()` (`published = true` and a `halal_status` that is visible to buyers) is the one public scope used by the home feed, category feed, shop products, sitemap and SEO audit. Blog embeds must use it. The scope body does **not** filter on `hidden` or shop approval even though a `hidden` cast exists; confirm in B2.5 whether other layers cover that before relying on it.
- **F17 GA4:** `app.blade.php` loads `gtag.js` only when a measurement id is configured and the path is a public storefront path. `/blog` is not excluded, so `gtag` will exist there. The template has no consent mode or opt-out handling, so the helper in B2.5 only needs the `window.gtag` guard.
- **F18 image support:** the Sail PHP 8.5 image installs `php8.5-gd`. WebP/JPEG encoding was **not** confirmed (the sandbox PHP has no GD). Run `gd_info()` inside Sail before B1.2 and keep the JPEG fallback from §13.
- **Cache driver (§6.3):** `.env.example` uses `CACHE_STORE=database`, which has no tags, so plain keys are correct. Tests use the `array` store.
- **F16 moderation shape:** `ModerationQueueItem` has a polymorphic target (`target_type`, `target_id`) plus `type`, `state`, `reason_code`, flagger and resolver columns, so a blog post can be a target. Phase 6 only needs a new `ModerationItemType::BlogStory` case.
- **Not read in depth:** `RememberWorkspace` and `LoginResponse` (editor landing page), revisit in B1.3.
- **Test environment:** the suite needs **PostgreSQL**, not SQLite (migration `2026_11_12_135318` runs `ALTER TABLE ... DROP CONSTRAINT IF EXISTS`), and any test that renders an error view needs a built frontend (`public/build/manifest.json`). Run Pest with more than the default 128 MB of PHP memory.
- **Baseline:** on a clean `production` checkout the full Pest run is 29 failed, 703 passed. After Phase 0 it is the same 29 failures (identical set) and 717 passed (the 14 new tests). Those 29 are pre-existing and their cause was not investigated.

---

## 4. Product spec

### 4.1 Audiences and roles

- **Shoppers / searchers:** discover recipes, buying guides, seasonal content, then click through to products.
- **Answer engines and crawlers:** need server-rendered, well-structured, dated articles with a real author entity.
- **Editors:** users with `role = editor`, **invited by an admin**. They write and publish posts in the Admin workspace (blog screens only).
- **Admins:** full control, including invitations, author profiles, categories and featuring.
- **Sellers (Phase 6):** submit moderated "seller stories" from the Seller Centre.

### 4.2 Public routes

| Route                                  | Name                        | Notes                                                                                                           |
| -------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `GET /blog`                            | `blog.index`                | Hero, category chips, latest grid, popular rail. `?page=`, `?q=`                                                |
| `GET /blog/category/{category}`        | `blog.categories.show`      | Category intro, grid, pagination. Binds `blog_categories.slug`                                                  |
| `GET /blog/tag/{tag}`                  | `blog.tags.show`            | Tag grid. `noindex,follow` until a tag has at least 3 posts (thin-content guard)                                |
| `GET /blog/author/{author}`            | `blog.authors.show`         | Author profile and their posts. `noindex,follow` until the author has a live post. The house author has no page |
| `GET /blog/feed.xml`                   | `blog.feed`                 | RSS 2.0, latest 20. Phase 4                                                                                     |
| `GET /blog/{post}`                     | `blog.show`                 | Binds `blog_posts.slug`, live posts only. Old slugs 301 to the current one                                      |
| `GET /editor-invitations/{invitation}` | `editor-invitations.show`   | Invitation landing (mirrors `staff-invitations.show`); guests go to login or register with the email prefilled  |
| `PUT /editor-invitations/{invitation}` | `editor-invitations.update` | Accept (auth, verified, email must match); sets `role = editor` and creates the author profile                  |

Route order matters: register `category/*`, `tag/*`, `author/*` and `feed.xml` before `blog/{post}`. Post slugs must not equal reserved words (`category`, `tag`, `author`, `feed.xml`, `search`, `page`); enforce in the slug rule and in a test.

Place them with the other public routes in `routes/web.php`. The invitation routes sit next to `staff-invitations`.

### 4.3 Page specs

**Index (`resources/js/pages/blog/index.tsx`)**

- `h1` "HalalBenta Blog" plus one-sentence intro (config-driven).
- Hero carousel: up to 5 featured posts (cover, category chip, title, excerpt on desktop). Hidden when none are featured.
- Category chip row: "All" plus each category that has at least one live post, in `sort_order`.
- Latest grid: 12 cards per page. Card = thumbnail (fixed 16:9, `srcset` from variants, `loading="lazy"` except first row), category chip, title (2-line clamp), excerpt (3-line clamp, hidden on small phones), date, reading minutes.
- Popular rail: top 5 by `view_count`; hidden on page 2+ and when search is active.
- Search box: `GET ?q=`; results replace the grid; empty state "No stories match 'x'" with a link back to all posts.
- Empty state (no posts at all): short message and link to the shop. In production with the flag on and zero posts, return 200 with `noindex`.

**Category page:** same grid, category name as `h1`, `description` as intro paragraph (real copy only, same rule as `CategoryIntro`; blank at launch until copy exists), breadcrumb Home › Blog › Category.

**Author page (`resources/js/pages/blog/author.tsx`):** avatar, display name, job title, bio, up to 4 https links, grid of their live posts with pagination. Breadcrumb Home › Blog › Author.

**Post page (`resources/js/pages/blog/show.tsx`)**

- Breadcrumb Home › Blog › Category › Title.
- Category chip, single `h1`, excerpt as standfirst, byline (**author avatar and name linking to the author page**, never the creating user unless they are the author), published date, "Updated" date only when materially later than published, reading minutes.
- Cover image with alt text (required), width/height set to avoid layout shift, eager-loaded with `srcset` (it is the LCP image).
- Share bar (copy link, native share on touch, Facebook/Messenger/Viber/X links; see F9).
- Table of contents (≥3 headings only).
- Body: server-rendered HTML segments, body images as `<figure>` with `srcset`, and product-card components (§7).
- Optional FAQ block (stored as structured Q&A, rendered with `faq-list.tsx` and emitted as `FAQPage` JSON-LD with the same parity guarantee as doc 14 T4.4). Phase 3.
- Author box at the end (avatar, name, job title, short bio, link to profile). Omitted for the house author.
- End-of-post CTA: "Shop {category cta label}" linking to the mapped storefront category (`blog_categories.shop_category_id`, nullable; hidden when null).
- Related posts: 3 cards.

**Home page:** optional "From the blog" strip with the 3 latest posts, rendered only when the flag is on and at least 3 posts exist. Footer gets a "Blog" link via `config/marketplace.php` (gated by the flag).

### 4.4 Admin and editor spec (Admin workspace)

**Permission matrix**

| Capability                                                           | Admin | Editor                               |
| -------------------------------------------------------------------- | ----- | ------------------------------------ |
| Create a post, choosing **any active author** to credit              | Yes   | Yes                                  |
| Edit, schedule, publish, archive posts                               | All   | Only posts they created              |
| Delete a post                                                        | Any   | Only their own drafts                |
| Mark a post featured                                                 | Yes   | No                                   |
| Upload and reuse images                                              | All   | Own uploads (library scoped to them) |
| Manage categories                                                    | Yes   | No                                   |
| Create, edit, deactivate author profiles                             | Yes   | Edit their own linked profile only   |
| Invite or revoke editors                                             | Yes   | No                                   |
| See other people's drafts, the dashboard and all other admin screens | Yes   | No (404)                             |

This scope is accepted (§14 #10). Editors publish their own posts directly; an approval step stays an optional later task (B4.6).

**Screens**

| Screen                            | Behaviour                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin/blog/posts` (list)         | Filter by status, category, author, free-text; columns: title, **author**, **created by**, category, status (+ "Scheduled for …"), published date, views, featured. Editors see only their own posts. Uses `data-table.tsx`.                                                                                                                                                              |
| `admin/blog/posts/create`, `edit` | Title, slug (auto, editable), category, **Author ("Write on behalf of")**, tags (free-text combobox), excerpt (with counter), **cover**, **thumbnail** (optional; falls back to the cover), Markdown body with **insert-image** button and live preview, FAQs, SEO overrides, featured toggle (admin), status/schedule. Author defaults to the editor's own profile, else must be chosen. |
| Preview                           | `admin/blog/posts/{post}/preview` renders the public page for any status, always `noindex`; editors can preview only their own posts.                                                                                                                                                                                                                                                     |
| Image upload dialog               | Pick file, enter alt text (required for cover and body images), optional caption. Returns an image id; the editor inserts `![alt](blog-image:ID)`.                                                                                                                                                                                                                                        |
| `admin/blog/categories` (admin)   | Create/update/delete (blocked while posts exist; system categories cannot be deleted). Name, slug, description, sort order, optional shop category link.                                                                                                                                                                                                                                  |
| `admin/blog/authors` (admin)      | List, create guest author (name, job title, bio, avatar, links, **consent checkbox**), link/unlink a user, deactivate. The house author ("HalalBenta Editorial") is seeded and cannot be deleted.                                                                                                                                                                                         |
| `admin/blog/profile` (editor)     | Editors edit their own linked author profile (bio, job title, avatar, links).                                                                                                                                                                                                                                                                                                             |
| `admin/blog/editors` (admin)      | Invite by email, list pending invitations and active editors, resend, revoke an invitation, remove an editor (role returns to `buyer`, profile deactivated, posts stay credited).                                                                                                                                                                                                         |
| Publish gate                      | Server-side checks (§5.3). The UI lists failing checks next to the publish button.                                                                                                                                                                                                                                                                                                        |
| Audit                             | `blog.post.created`, `.updated`, `.published`, `.unpublished`, `.archived`, `.deleted`, `.featured`, `blog.editor.invited`, `.accepted`, `.revoked`, `.removed`, `blog.author.created`, `.updated`, `.deactivated`. Post events carry `author_id` **and** `created_by_id`.                                                                                                                |

**Navigation:** admins get a "Blog" group (Posts, Categories, Authors, Editors). Editors get only "Blog › Posts" and "Blog › My profile". `Workspace::home` returns `/admin/blog/posts` for editors. `tests/Unit/workspaces.test.mjs` and `.ai/rules/workspaces.md` are updated for the editor case (task B1.8).

**Invitation flow (mirrors F15)**

1. Admin enters an email. `InviteBlogEditor` creates a `blog_editor_invitations` row (expires after 7 days) and sends `BlogEditorInvitationNotification` with the link to `editor-invitations/{id}`.
2. Guests are sent to login (existing account with that email) or register (email prefilled); `url.intended` brings them back.
3. On the invitation page the invitee confirms they agree to be credited publicly as an author (this sets `consent_confirmed_at`) and accepts. `AcceptBlogEditorInvitation` requires an authenticated, verified, non-suspended user whose email matches (case-insensitive), sets `role = editor`, creates or links their author profile, and audits.
4. Rules: admins and existing editors cannot be invited; max 25 pending invitations; invitations throttled per admin; an invitation can be revoked until accepted; expired or revoked links show a neutral "no longer valid" page.

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
4. Delivery, escrow and return statements must come from `TrustFacts` values (do not hardcode "7 days"), consistent with doc 14 T4.3.

### 4.7 Authorship and consent rules

1. The **author** (public byline, schema `author`) and the **creator** (`created_by_id`, internal) are separate. The creator is never exposed publicly unless they are also the author.
2. Any active author profile can be chosen when creating a post, which is how an editor writes on behalf of someone else (a guest expert, a seller, a colleague). Changing the author after publishing is allowed for admins only and is audited.
3. Crediting a real person requires `consent_confirmed_at` on their profile: set by the person themselves when accepting an editor invitation, or ticked by an admin ("this person agreed to be credited") for guest authors. A post cannot be published while its author lacks consent, is inactive, or is deactivated.
4. The house author "HalalBenta Editorial" (`is_house`) needs no consent, has no author page and maps to the Organization in schema.
5. Deactivating an author hides the profile page and author box but keeps existing posts credited (the schema still names them); an admin can reassign posts in bulk.

---

## 5. Data model

All new tables use ULID primary keys (like `media`, `product_images`). Foreign keys to `users`, `products` and `categories` must match the existing key types **(verify in the migrations before writing ours)**.

### 5.1 Tables

**`blog_categories`**

| Column             | Type                     | Notes                                                       |
| ------------------ | ------------------------ | ----------------------------------------------------------- |
| `id`               | ulid PK                  |                                                             |
| `name`             | string(80)               |                                                             |
| `slug`             | string(100) unique       | not a reserved word                                         |
| `description`      | text nullable            | real intro copy; rendered on category page                  |
| `sort_order`       | unsignedSmallInteger     | default 0                                                   |
| `is_system`        | boolean                  | default false; true for `seller-stories`, cannot be deleted |
| `shop_category_id` | FK `categories` nullable | `nullOnDelete`; drives the end-of-post CTA                  |
| timestamps         |                          |                                                             |

**`blog_authors`**

| Column                    | Type                        | Notes                                                                        |
| ------------------------- | --------------------------- | ---------------------------------------------------------------------------- |
| `id`                      | ulid PK                     |                                                                              |
| `user_id`                 | FK `users` nullable, unique | `nullOnDelete`; set for editors and admins who write; null for guest authors |
| `display_name`            | string(80)                  | public name                                                                  |
| `slug`                    | string(100) unique          | not a reserved word                                                          |
| `job_title`               | string(80) nullable         | shown in the byline and `Person.jobTitle`                                    |
| `bio`                     | string(600) nullable        | plain text                                                                   |
| `avatar_image_id`         | FK `blog_images` nullable   | `nullOnDelete`; 256×256 variant                                              |
| `links`                   | json nullable               | `[{label, url}]`, max 4, https only; feeds `Person.sameAs`                   |
| `is_house`                | boolean                     | exactly one row true ("HalalBenta Editorial")                                |
| `is_active`               | boolean                     | default true                                                                 |
| `consent_confirmed_at`    | timestamp nullable          | required before any post by this author can publish (house author exempt)    |
| `consent_confirmed_by_id` | FK `users` nullable         | who recorded the consent (the person themselves, or the admin)               |
| `consent_version`         | string(16) nullable         | version of the Appendix A copy the person accepted                           |
| timestamps                |                             | Phase 6 adds a nullable unique `shop_id`                                     |

**`blog_images`**

| Column           | Type                    | Notes                                                                                          |
| ---------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| `id`             | ulid PK                 |                                                                                                |
| `uploaded_by_id` | FK `users` nullable     | `nullOnDelete`; scopes an editor's library                                                     |
| `purpose`        | string(16)              | `cover`, `thumbnail`, `body`, `avatar`                                                         |
| `disk`           | string(20)              | `config('blog.images.disk')`, default `public`                                                 |
| `original_path`  | string                  | re-encoded original (EXIF stripped, longest side ≤ 2400 px)                                    |
| `variants`       | json                    | `{thumb, medium, large, og?, avatar?}` each `{path, width, height}`                            |
| `width`,`height` | unsignedSmallInteger    | of the re-encoded original                                                                     |
| `bytes`,`mime`   | unsignedInteger, string | of the upload before re-encoding (audit/debug)                                                 |
| `alt`            | string(200) nullable    | required for `cover` and `body`; `thumbnail` may be empty (decorative, the card link names it) |
| `caption`        | string(200) nullable    | rendered as `<figcaption>` for body images                                                     |
| timestamps       |                         |                                                                                                |

**`blog_posts`**

| Column                   | Type                      | Notes                                                                     |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------- |
| `id`                     | ulid PK                   |                                                                           |
| `blog_category_id`       | FK `blog_categories`      | `restrictOnDelete`                                                        |
| `blog_author_id`         | FK `blog_authors`         | `restrictOnDelete`; **public byline**                                     |
| `created_by_id`          | FK `users` nullable       | `nullOnDelete`; **internal creator**, immutable                           |
| `title`                  | string(160)               |                                                                           |
| `slug`                   | string(160) unique        |                                                                           |
| `excerpt`                | string(300)               | standfirst and meta-description fallback                                  |
| `body_markdown`          | longText                  | source of truth                                                           |
| `body_html`              | longText                  | rendered and sanitized on save; contains product markers (§7)             |
| `toc`                    | json nullable             | `[{id, text, level}]`                                                     |
| `word_count`             | unsignedInteger           | for reading time and `wordCount` in JSON-LD                               |
| `reading_minutes`        | unsignedTinyInteger       | `max(1, ceil(words / 200))`                                               |
| `cover_image_id`         | FK `blog_images` nullable | `nullOnDelete`; required to publish                                       |
| `thumbnail_image_id`     | FK `blog_images` nullable | `nullOnDelete`; optional, cards fall back to the cover's `medium` variant |
| `faqs`                   | json nullable             | `[{question, answer}]` (Phase 3)                                          |
| `status`                 | string(16)                | `BlogPostStatus`, default `draft`, indexed                                |
| `published_at`           | timestamp nullable        | indexed with `status`                                                     |
| `is_featured`            | boolean                   | default false (admin only)                                                |
| `view_count`             | unsignedInteger           | default 0                                                                 |
| `seo_title`              | string(70) nullable       | optional override                                                         |
| `seo_description`        | string(170) nullable      | optional override                                                         |
| timestamps, `deleted_at` |                           | soft deletes. Phase 6 adds `source`, `shop_id`, `submitted_at`            |

Indexes: `(status, published_at)`, `(blog_category_id, status, published_at)`, `(blog_author_id, status, published_at)`, `(is_featured, status, published_at)`, unique `slug`.

**Supporting tables**

- `blog_tags` (`id`, `name` string(60), `slug` string(80) unique, timestamps) and pivot `blog_post_tag` (`blog_post_id`, `blog_tag_id`, composite PK, cascade).
- `blog_post_products` (`blog_post_id`, `product_id`, `sort_order`, composite PK, cascade), rebuilt from `[[product:…]]` tokens on every save; powers a later "Featured in" block on product pages.
- `blog_post_images` (`blog_post_id`, `blog_image_id`, composite PK, cascade), rebuilt on every save from the cover, thumbnail and `blog-image:` references; used for library usage counts and orphan pruning.
- `blog_post_slug_histories` (`id`, `blog_post_id`, `slug` unique, timestamps), mirroring `product_slug_histories`.
- `blog_editor_invitations` (`id`, `email`, `invited_by_id`, `user_id` nullable, `expires_at`, `accepted_at` nullable, `revoked_at` nullable, timestamps). Partial unique index on lower(`email`) where `accepted_at` and `revoked_at` are null, so one pending invitation per email.

### 5.2 Models

`BlogPost`, `BlogCategory`, `BlogTag`, `BlogAuthor`, `BlogImage`, `BlogEditorInvitation` under `app/Models`, `final`, `#[Fillable([...])]` attribute style as in `Media`, `HasUlids`, `HasFactory` (factories in `database/factories`). `BlogPost` scopes: `live()`, `featured()`, `inCategory()`, `byAuthor()`, `search(string)`. Route binding for `blog.show` is overridden to resolve live posts only and fall back to `blog_post_slug_histories` (301). User additions: `isEditor()` and `canManageBlog()` (admin or editor), plus a single `canEditBlogPost(BlogPost)` that holds the ownership rule from §4.4 so it exists in one place.

### 5.3 Publish checks (server-side, `ValidateBlogPostForPublish`)

Blocking: title; slug valid and unique; category set; excerpt 50–300 chars; **author set, active and consented (§4.7)**; **cover present with alt text**; body ≥ 150 words; every `[[product:x]]` resolves to an existing product; **every `blog-image:ID` resolves and has alt text**; `published_at` set (defaults to now).
Warning only: no `h2`; flagged phrases (§4.6); embedded products currently unavailable; cover smaller than 1200×630; no thumbnail (falls back to cover); duplicate `seo_title`; more than 30 body images.

---

## 6. Architecture

### 6.1 Backend files (new)

```
app/Enums/BlogPostStatus.php
app/Models/{BlogPost,BlogCategory,BlogTag,BlogAuthor,BlogImage,BlogEditorInvitation}.php
app/Http/Middleware/{EnsureAdminOnly,EnsureCanManageBlog}.php
app/Http/Controllers/
    Blog/BlogController.php                    // index (+ ?q=)
    Blog/BlogCategoryController.php            // show
    Blog/BlogTagController.php                 // show
    Blog/BlogAuthorController.php              // show
    Blog/BlogPostController.php                // show
    Blog/BlogFeedController.php                // RSS (Phase 4)
    Blog/EditorInvitationController.php        // show, update (accept)
    Admin/Blog/PostController.php              // resource
    Admin/Blog/PostPreviewController.php       // preview + markdown preview POST
    Admin/Blog/ImageController.php             // store, index (library), destroy
    Admin/Blog/CategoryController.php          // resource (admin only)
    Admin/Blog/AuthorController.php            // resource (admin only)
    Admin/Blog/ProfileController.php           // edit/update own profile (editor)
    Admin/Blog/EditorController.php            // index, store (invite), destroy (revoke/remove)
app/Http/Requests/
    Blog/ShowBlogIndexRequest.php              // validates page, q
    Admin/Blog/{Create,Update,Delete}BlogPostRequest.php
    Admin/Blog/StoreBlogImageRequest.php
    Admin/Blog/{Create,Update,Delete}BlogCategoryRequest.php
    Admin/Blog/{Create,Update,Deactivate}BlogAuthorRequest.php
    Admin/Blog/{Invite,Remove}BlogEditorRequest.php
    Admin/Blog/PreviewMarkdownRequest.php
    Blog/AcceptEditorInvitationRequest.php
app/Actions/Blog/
    ListBlogIndex.php  ListBlogCategoryPosts.php  ListBlogTagPosts.php  ShowBlogAuthor.php
    ShowBlogPost.php   RecordBlogPostView.php     ListRelatedPosts.php
    RenderBlogBody.php        // markdown → sanitized html + toc + counts + product/image tokens
    SyncBlogPostRelations.php // tags, blog_post_products, blog_post_images, slug history
    InvalidateBlogCache.php
    Admin/{CreateBlogPost,UpdateBlogPost,PublishBlogPost,ArchiveBlogPost,DeleteBlogPost}.php
    Admin/{Create,Update,Delete}BlogCategory.php
    Admin/{Create,Update,Deactivate}BlogAuthor.php
    Admin/StoreBlogImage.php           // validate, decode, re-encode, generate variants
    Admin/ValidateBlogPostForPublish.php
    Admin/{InviteBlogEditor,AcceptBlogEditorInvitation,RevokeBlogEditorInvitation,RemoveBlogEditor}.php
app/Notifications/BlogEditorInvitationNotification.php
app/Jobs/ReconcileBlogImageOrphansJob.php      // mirrors ReconcileMediaOrphansJob
app/Actions/Seo/
    BuildBlogIndexSeoData.php  BuildBlogCategorySeoData.php  BuildBlogPostSeoData.php  BuildBlogAuthorSeoData.php
    BuildBlogSitemap.php
    Schema/{BuildBlogNode,BuildBlogPostingNode,BuildPersonNode}.php
app/Support/BlogSegments.php   // splits body_html on product markers
config/blog.php
database/migrations/…_create_blog_tables.php   // + a separate migration for users.role = editor support if a check constraint exists
database/factories/{BlogPost,BlogCategory,BlogTag,BlogAuthor,BlogImage}Factory.php
database/seeders/BlogBaselineSeeder.php        // idempotent: launch categories + house author (runs in production)
database/seeders/BlogSeeder.php                // local/dev sample posts only
```

Controllers stay `final class` with the request + action signature used by `Admin\CategoryController` (F1).

### 6.2 Frontend files (new)

```
resources/js/pages/blog/{index,show,author}.tsx
resources/js/pages/admin/blog/{posts,post-form,categories,authors,editors,profile}.tsx
resources/js/pages/account/editor-invitation.tsx     // mirrors staff-invitation.tsx
resources/js/components/blog/
    blog-card.tsx  blog-hero.tsx  blog-category-chips.tsx  blog-toc.tsx
    blog-body.tsx           // renders segments: sanitized HTML + <BlogProductCard>
    blog-product-card.tsx   // uses halal-badge.tsx, price formatting from lib/format.ts
    blog-image.tsx          // <img srcset sizes width height> from variants
    blog-author-byline.tsx  blog-author-box.tsx
    blog-related.tsx  blog-share-bar.tsx
    image-upload-dialog.tsx // admin: file, alt, caption → image id
resources/js/lib/analytics.ts   // guarded trackEvent (§7.3)
```

Edit: `resources/js/lib/workspaces.ts` (admin and editor nav), `app/Enums/Workspace.php` (editor access and home), `site-footer.tsx` / `config/marketplace.php` (footer link), `pages/home.tsx` and `ListHomeFeed` (optional "From the blog" strip), `components/share-buttons.tsx` (F9), `.ai/rules/workspaces.md` and `tests/Unit/workspaces.test.mjs`.

Per the repo's JS rule, after UI changes run `vendor/bin/sail artisan optimize:clear` and `vendor/bin/sail npm run build`, and run `npm run check` (includes `scan-violations.mjs`, contrast, workspaces and JSON-LD tests).

### 6.3 Caching

- Index data (hero, popular, category chips) cached 5 minutes under `blog:index:*` keys. Use plain keys, not tags, because the cache driver may not support tags **(verify)**.
- `InvalidateBlogCache` runs on post, category and author save/delete (observer, same pattern as the sitemap invalidation hooks) and also clears `sitemap:blog` and `llms:txt`.
- `body_html` is stored, so a post view does no Markdown parsing.
- Lists select only card columns (never `body_*`), and eager load `category`, `author` (with avatar image), thumbnail/cover images and `tags`. No queries in loops; add a query-count assertion in the index feature test.

### 6.4 Share bar

`ShareButtons` currently posts to `products.shares.store` when `slug`/`enabled` are set (F9). For the blog, pass `enabled={false}` and no `slug`, or extract a presentational `ShareMenu` used by both. Decide in B2.8 after reading the component; do not add a blog share-tracking endpoint in v1.

### 6.5 Letting editors in without opening the admin area

Today every admin route trusts `workspace:admin` plus per-request `isAdmin()` checks (F2, F14). Editors must reach blog screens and nothing else, so the design is deny-by-default:

1. `Workspace::accessibleBy(Admin)` becomes `isAdmin() || isEditor()`. `allowedFor` keeps `[Admin]` for admins and returns the editor's normal workspaces plus Admin for editors. `home(Admin)` returns `/admin/blog/posts` for editors.
2. The existing admin route group is wrapped in a child group with `EnsureAdminOnly` (404 unless `isAdmin()`), containing every current admin route. A second child group with `EnsureCanManageBlog` holds only the editor-visible blog routes (`admin.blog.posts.*`, `admin.blog.images.*`, `admin.blog.preview`, `admin.blog.profile.*`). Admin-only blog routes (`categories`, `authors`, `editors`) live in the first group.
3. A **route-list-driven test** loops over every route named `admin.*`, requests it as an editor, and asserts 404 for everything outside the editor allow-list. This keeps future admin routes safe by default.
4. Nav items in `workspaces.ts` carry an audience flag so editors see only their two entries; `workspaces.test.mjs` covers it.

---

## 7. Markdown, images and embeds

### 7.1 Renderer (`RenderBlogBody`)

CommonMark with:

- `html_input: strip` (no raw HTML from authors), `allow_unsafe_links: false`.
- Heading offset: `#` becomes `h2`, so the page has exactly one `h1` (the title). Anything deeper than `h4` is flattened.
- Heading ids (slugified, de-duplicated) for anchors and the TOC.
- External links get `rel="noopener noreferrer"` and `target="_blank"`; `nofollow` is controlled by `config('blog.nofollow_external')` (default true).
- **Images** only through the `blog-image:` scheme: `![Alt text](blog-image:01H…)` with an optional title as caption. The renderer resolves the id from `blog_images` in one batched query and outputs `<figure><img srcset sizes width height loading="lazy" decoding="async" alt><figcaption>`. Any other image source (remote URL, `data:`, relative path) is dropped. An unknown id renders nothing and is a blocking publish error.
- Output is plain HTML (no scripts, iframes or inline styles). A unit test feeds hostile Markdown (`<script>`, `javascript:` links, `onerror=` attributes, nested HTML, remote and `data:` images) and asserts none survives.

### 7.2 Product embeds

```
[[product:halal-beef-tapa-500g]]
```

On a line by itself, replaced with a marker element `<div data-blog-product="halal-beef-tapa-500g"></div>`. Inline use inside a sentence is ignored and flagged as a warning.

`SyncBlogPostRelations` extracts slugs into `blog_post_products`. At request time `BlogSegments` splits `body_html` on the markers into `[{type:'html', html}, {type:'product', product}]`, where `product` is looked up in one batched query using the catalogue's public-visibility rules (approved shop, not hidden or moderated, same scope the category and home feeds use **(verify the exact scope)**). Unavailable products are skipped silently so a stale embed never breaks the page. `blog-body.tsx` maps segments to HTML blocks and `<BlogProductCard>`, which keeps SSR intact and the card data live (price, stock, halal badge).

### 7.3 Attribution (decision: events, not UTM links)

The first draft of this plan appended `utm_*` parameters to blog product links. That is **dropped**: UTM parameters on _internal_ links make GA4 start a new campaign touch and can overwrite the visit's real traffic source, which would corrupt the very reports we want.

Instead:

- Clicking a blog product card fires the standard GA4 `select_item` event with `item_list_id: "blog:{post-slug}"`, `item_list_name: "Blog: {post title}"` and the product as the item, through a guarded helper in `resources/js/lib/analytics.ts` (no-op when `gtag` is absent or the user opted out). Links stay clean, so canonicals and doc 14 T3.5 are unaffected.
- Blog traffic is reported by filtering page paths that start with `/blog`; **no custom content group** is created (zero setup, nothing to maintain).
- Server-side attribution of orders to posts is out of scope for v1.
- Verify in B0.1 how and whether `gtag` is initialised and whether any consent handling exists (F17).

### 7.4 Image pipeline (cover, thumbnail, body, avatar)

All four purposes share one action, `StoreBlogImage`, so there is one validation and processing path.

- **Accepted:** `image/jpeg`, `image/png`, `image/webp`, detected by content (not extension), ≤ 3 MB, longest side ≤ 6000 px and ≤ 25 megapixels. GIF, SVG and animated images are rejected.
- **No antivirus scan** (decision, §14). As hardening that costs nothing: the file must decode with GD, is then **re-encoded** (this discards any trailing or polyglot payload) and **EXIF/GPS metadata is stripped** after applying orientation.
- **Variants (GD):** `thumb` 480 px wide webp, `medium` 960 px, `large` 1600 px; for covers also `og` 1200×630 JPEG (center-cropped; JPEG because older scrapers such as Viber and WhatsApp handle it most reliably); for avatars a 256×256 square. Files get random names under `blog-images/{yyyy}/{mm}/`.
- **Minimums:** covers at least 1200×630 (blocking); thumbnails at least 480×270; avatars at least 256×256.
- **Library and cleanup:** admins see all images, editors only their own. An image cannot be deleted while `blog_post_images` or an author avatar references it. `ReconcileBlogImageOrphansJob` (daily, `routes/console.php`) removes images unreferenced for 7 days, modelled on `ReconcileMediaOrphansJob`.
- **Limits:** 30 body images per post; upload endpoint throttled per user.

---

## 8. SEO and GEO integration (builds on doc 14)

| Surface            | Spec                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Title              | Post: `{seo_title ?? title} \| HalalBenta Blog`. Index: `HalalBenta Blog – halal shopping guides, recipes and tips`. Category: `{name} \| HalalBenta Blog`. Author: `{display_name} \| HalalBenta Blog`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Description        | Post: `seo_description ?? excerpt`, trimmed to the repo's meta length. Category: `description` or a generated sentence from real counts. Author: bio or a generated sentence from real post counts.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Canonical / robots | Self-canonical per page, `?page=` pages self-canonical with prev/next (as category pages). `?q=` and `?page` beyond the last are `noindex,follow` (add `q` to the noindex query-param list in `config/seo.php`, **verify the key name**). Preview and draft routes `noindex`. Private-path rules unchanged. The `/blog` section lives on the main domain, so it inherits site authority.                                                                                                                                                                                                                                                                                                   |
| JSON-LD            | One `@graph` per page via `SchemaGraph`. Post: `WebPage` wrapper → `BlogPosting` (`@id` `/blog/{slug}#article`, `headline`, `description`, `image[]` absolute, `datePublished`, `dateModified`, **`author` → `Person` `@id` `/blog/author/{slug}#person`** (or the Organization `@id` for the house author), `publisher` → Organization `@id`, `mainEntityOfPage`, `articleSection`, `keywords`, `wordCount`, `inLanguage: en-PH`) + `BreadcrumbList` (+ `FAQPage` when FAQs exist). Author page: `ProfilePage` → `Person` (`name`, `jobTitle`, `description`, `image`, `sameAs` from links, `url`). Index: `Blog` node with `blogPost` stubs sharing post `@id`s via `BuildItemListNode`. |
| Open Graph         | `og:type=article`, `article:published_time`, `article:modified_time`, `article:section`, `article:tag`, `article:author` (author page URL), `og:image` = the cover's `og` variant (absolute https, with `og:image:width/height/alt`). A post cannot publish without a cover, so `GenerateSocialImage` needs no blog fallback; it is only used if the cover file goes missing.                                                                                                                                                                                                                                                                                                              |
| Sitemap            | New `sitemap-blog.xml` (`BuildBlogSitemap`) linked from `BuildSitemapIndex`, only live posts, `lastmod = updated_at`, cached `sitemap:blog` 1 h, cleared by `InvalidateBlogCache`. Categories with posts and author pages with posts included; tags only when indexable.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `llms.txt`         | `BuildLlmsTxt` gains a "Blog" section with the 10 latest posts (title, URL, one-line excerpt). Omitted when the flag is off or no posts exist. Same production-only 404 rule already in place.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| AI crawlers        | **No blog-specific rule.** Blog content follows the doc 14 T4.1 policy (search/answer and training bots allowed by default; `SEO_BLOCK_AI_TRAINING=true` blocks training crawlers site-wide). Decision confirmed in §14.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Validator and CI   | `JsonLdValidator` (PHP) and `scripts/validate-jsonld.mjs` (Node twin) learn `BlogPosting` (required: `headline`, `image`, `datePublished`, `author`), `Blog` and `ProfilePage`/`Person`. `SeoStructuredDataPolicyTest` renders a post, the index, a category and an author page. `tests/Unit/jsonld-validator.test.mjs` gets blog fixtures.                                                                                                                                                                                                                                                                                                                                                |
| Audit command      | `seo:audit` samples the 2 latest posts, one author page and the blog index and includes `sitemap-blog.xml`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Entity honesty     | Named authors are real people who consented (§4.7). The house author maps to the Organization. No invented bios, ratings, review counts or dates.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

---

## 9. Security, privacy, performance, accessibility

**Security**

- **Authorization is deny-by-default** (§6.5): every blog admin request authorizes in its FormRequest (`canManageBlog()` plus `canEditBlogPost()` for ownership), non-permitted users get 404 not 403, and a route-list-driven test proves editors cannot reach any other `admin.*` route.
- Invitations: unguessable ULID link, email-match on accept, expiry, revocation, throttled sends, no admin/editor invitations, suspended users refused. The invitation page never reveals whether an email has an account.
- Markdown is the only input format; HTML is stripped (§7.1). The rendered `body_html` is trusted by the frontend only because it is produced by `RenderBlogBody`; never render `body_markdown` or user-supplied HTML directly.
- Images: content sniffing, decode-and-re-encode, metadata stripped, size and pixel caps, random file names, throttled endpoint (§7.4). No antivirus scan by decision.
- The Markdown preview endpoint is auth-gated, throttled, and returns rendered HTML from the same renderer (no second code path).
- JSON-LD output goes through `SchemaGraph::encode()` (`JSON_HEX_TAG|JSON_HEX_AMP`), so titles and bios cannot break out of the script tag. Author links are https-only.
- View counting ignores bots (common crawler user-agents and `HumanPass` failures) and counts at most once per session per post per day, via a cache key. It never writes on HEAD/prefetch requests.

**Privacy:** the blog collects nothing about readers beyond existing GA4 page views and the `select_item` click event. Author profiles are public by design, so a real person is only published with recorded consent (§4.7). The creating user's identity is internal (audit and admin lists) unless they are the author. Uploaded image EXIF (including GPS) is stripped.

**Performance budget:** post page server time under 100 ms warm (one post query with author and images, one batched product query, one related-posts query); LCP cover eager with `srcset` and fixed dimensions; no new client JS dependency (TOC highlighting uses `IntersectionObserver`).

**Accessibility:** one `h1`; heading order preserved by the renderer; TOC is a `nav` with `aria-label`; carousel respects reduced motion and has visible controls (reuse `carousel.tsx` checks); cover and body image alt text required; card links are whole-card anchors with a single accessible name; focus-visible styles; contrast verified by `tests/Unit/contrast.test.mjs` for any new tokens.

---

## 10. Configuration (`config/blog.php`, all optional env)

| Key                           | Env                        | Default                                         | Purpose                                          |
| ----------------------------- | -------------------------- | ----------------------------------------------- | ------------------------------------------------ |
| `enabled`                     | `BLOG_ENABLED`             | `false`                                         | Master flag: routes, sitemap, llms, footer, home |
| `title`                       | `BLOG_TITLE`               | `HalalBenta Blog`                               | Index `h1` and titles                            |
| `intro`                       | `BLOG_INTRO`               | _(empty, block hidden)_                         | Index standfirst                                 |
| `per_page`                    | `BLOG_PER_PAGE`            | `12`                                            | Grid size                                        |
| `hero_count`                  | –                          | `5`                                             | Featured slots                                   |
| `popular_count`               | –                          | `5`                                             | Popular rail size                                |
| `related_count`               | –                          | `3`                                             | Related posts                                    |
| `house_author_name`           | `BLOG_HOUSE_AUTHOR`        | `HalalBenta Editorial`                          | Name of the seeded house author                  |
| `nofollow_external`           | `BLOG_NOFOLLOW_EXTERNAL`   | `true`                                          | `rel` on external body links                     |
| `reserved_slugs`              | –                          | `category, tag, author, feed.xml, search, page` | Slug validation (posts and authors)              |
| `flagged_phrases`             | –                          | small starter list                              | Publish warnings (§4.6)                          |
| `editors.max_pending`         | –                          | `25`                                            | Pending invitation cap                           |
| `editors.invitation_ttl_days` | `BLOG_INVITATION_TTL_DAYS` | `7`                                             | Invitation expiry                                |
| `images.disk`                 | `BLOG_IMAGE_DISK`          | `public`                                        | Storage disk for blog images                     |
| `images.max_kb`               | –                          | `3072`                                          | Upload size cap                                  |
| `images.max_dimension`        | –                          | `6000`                                          | Longest side accepted                            |
| `images.max_pixels`           | –                          | `25000000`                                      | Decode cap                                       |
| `images.cover_min`            | –                          | `1200x630`                                      | Cover minimum                                    |
| `images.per_post_max`         | –                          | `30`                                            | Body images per post                             |
| `images.orphan_days`          | –                          | `7`                                             | Unreferenced images pruned after                 |

Document every env var in `.env.example` (the repo does this for SEO and marketplace vars).

---

## 11. Implementation plan and tasks

Ship in phases; each phase is mergeable on its own because everything stays dark behind `BLOG_ENABLED=false`. Phase 6 starts only after Phases 0–5 are live.

### Phase 0 — Foundations

| Task | Description                                                                                                                                                                                                                                                                                                        | Acceptance                                                                                                           | Status     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ---------- |
| B0.1 | Read `.ai/rules/{js,workspaces,e2e,planning}.md` and `.ai/guidelines/*`; resolve every **(verify)** in §3, §5, §7 (FK types, `role` uses, catalogue visibility scope, `gtag`/consent, GD webp/jpeg support, queue item shape, cache driver, Workspace/RememberWorkspace behaviour).                                | Findings appended to this doc's §3 notes.                                                                            | Done       |
| B0.2 | `config/blog.php` and `.env.example` entries (§10).                                                                                                                                                                                                                                                                | `config('blog.enabled')` false by default.                                                                           | Done       |
| B0.3 | Migration for all tables in §5.1; `BlogPostStatus` enum; models, factories (states `draft`, `published`, `scheduled`, `archived`).                                                                                                                                                                                 | `migrate:fresh` and rollback work.                                                                                   | Done       |
| B0.4 | Feature-flag guard so every public blog route 404s when disabled.                                                                                                                                                                                                                                                  | Test: each route returns 404 with flag off.                                                                          | Guard only |
| B0.5 | `BlogBaselineSeeder` (idempotent `updateOrCreate` by slug): launch categories `shopping-guides`, `halal-food-and-pantry`, `recipes`, `ramadan-and-eid`, `lifestyle`, and system category `seller-stories`; plus the house author. Run in production with `php artisan db:seed --class=BlogBaselineSeeder --force`. | Running it twice changes nothing; exactly one house author; category descriptions left empty until real copy exists. | Done       |

**Phase 0 notes (2026-11-25).** Proven by `tests/Feature/Blog/BlogFoundationTest.php` (14 tests, 75 assertions, PostgreSQL), plus `pint` and `phpstan` clean for the new files.

- **B0.2:** `config/blog.php` and the `BLOG_*` variables in `.env.example`. A test asserts `blog.enabled` is false by default.
- **B0.3:** one migration, `2026_11_25_000000_create_blog_tables.php`, for all ten tables in §5.1 (plus a PostgreSQL/SQLite partial unique index for one pending invitation per email, case-insensitive). Rollback and re-apply are tested. Six models from §5.2 plus `BlogPostSlugHistory` (needed for the slug-history table, not in the §6.1 list), five factories (post states `draft`, `published`, `scheduled`, `archived`, `featured`) and the `BlogPostStatus` enum. No separate `users.role` migration was needed (see B0.1 findings). `BlogPost::scopeSearch` is case-insensitive (`ILIKE` on PostgreSQL); a test caught that `LIKE` was not.
- **B0.4 (partial):** the guard is the `blog` middleware alias (`EnsureBlogEnabled`, 404 when `blog.enabled` is false), tested against a probe route. The acceptance says every public blog route 404s with the flag off, but those routes do not exist until B2.1. **Finish this task in B2.1** by applying the middleware to the whole public group and testing each route.
- **B0.5:** `BlogBaselineSeeder` seeds the six categories and the house author idempotently by slug; it never overwrites admin edits, and category descriptions stay empty. Tested twice-run and edit-preservation. Running it in production is B5.3.
- **Model additions beyond the plan:** `BlogAuthor::canBeCredited()` encodes the §4.7 rule (active, and either house or consented); `BlogPost::isLive()` / `isScheduled()` mirror the `live()` scope.

### Phase 1 — Admin authoring, editors, authors and images (no public pages yet)

| Task  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Acceptance                                                                                                                                                                                                                              | Status           |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| B1.1  | `RenderBlogBody` (Markdown → html, toc, counts, product and image tokens) with the config in §7.1.                                                                                                                                                                                                                                                                                                                                                                      | Unit tests incl. hostile-input suite; one `h1` guaranteed; ids de-duplicated; unknown image id is an error.                                                                                                                             | Done             |
| B1.2  | `StoreBlogImage` pipeline (§7.4), upload controller and request, library listing, usage pivot, `ReconcileBlogImageOrphansJob` scheduled daily.                                                                                                                                                                                                                                                                                                                          | Tests: non-image with `.jpg` name rejected; GIF/SVG rejected; oversize/over-megapixel rejected; GPS EXIF gone from output; variants exist with expected sizes; referenced image not deletable; orphan pruned after 7 days (`travelTo`). | Done             |
| B1.3  | Editor role plumbing: `User::isEditor()/canManageBlog()/canEditBlogPost()`, `Workspace` changes, `EnsureAdminOnly` / `EnsureCanManageBlog`, route-group split (§6.5), `Workspace::home` for editors. Editors keep their buyer (and any seller) workspace access and gain the limited Admin workspace (§14 #11).                                                                                                                                                         | **Route-list-driven test:** an editor gets 404 on every `admin.*` route outside the allow-list; admins unaffected; existing admin tests green.                                                                                          | Done             |
| B1.4  | Editor invitations: `InviteBlogEditor`, notification, public `editor-invitations` routes and page, `AcceptBlogEditorInvitation`, revoke/remove, admin page `admin/blog/editors.tsx`.                                                                                                                                                                                                                                                                                    | Tests for every rule in §4.4 (expiry, revoke, email mismatch, existing admin/editor, suspended, pending cap, guest → login/register → back); removal returns role to `buyer`.                                                           | Done             |
| B1.5  | Author profiles: `blog_authors` CRUD (admin), `admin/blog/authors.tsx`, editor self-profile page, consent capture, deactivation, house-author protections. **Admin authorship on demand (§14 #14):** when an admin opens the post form without a linked profile, the author select offers "Create my author profile", which creates a profile linked to them and requires them to tick the self-consent text from Appendix A.2; nothing is auto-created.                | Tests: consent required to publish; house author undeletable; slug reserved-word rule; editor can edit only their own profile.                                                                                                          | Done             |
| B1.6  | Admin categories: controller, requests, actions, page, audit logging; system categories undeletable.                                                                                                                                                                                                                                                                                                                                                                    | CRUD feature tests; delete blocked when posts exist; non-admin and editor get 404.                                                                                                                                                      | Done             |
| B1.7  | Admin posts: create/update/delete actions, requests, **author selection (write on behalf of)**, `created_by_id` immutability, slug generation + history, tag/product/image sync, cover and thumbnail assignment.                                                                                                                                                                                                                                                        | Tests: editor creates post for another author → public byline is the author, `created_by_id` is the editor, audit has both; editor cannot edit others' posts; slug change creates history row.                                          | Done             |
| B1.8  | `ValidateBlogPostForPublish` + `PublishBlogPost` / `ArchiveBlogPost`; scheduled = future `published_at`.                                                                                                                                                                                                                                                                                                                                                                | Tests for each blocking rule and each warning (incl. author consent, cover alt, image refs); scheduled post not live until its time.                                                                                                    | Done             |
| B1.9  | Admin pages `posts.tsx`, `post-form.tsx` (Markdown editor, insert-image dialog, author select, live preview endpoint, checklist panel); nav items and audience flags in `workspaces.ts`; update `.ai/rules/workspaces.md` and `workspaces.test.mjs`. The shell title reads "Editorial" instead of "Admin" when the signed-in user is an editor (frontend change in `workspaces.ts` / the shared auth props **(verify the role is exposed)**); admins still see "Admin". | `workspaces.test.mjs` passes with editor cases; preview matches the public render byte-for-byte (shared renderer).                                                                                                                      | Done             |
| B1.10 | Audit log actions (§4.4) via `RecordAuditLog`.                                                                                                                                                                                                                                                                                                                                                                                                                          | Test asserts an audit row per mutation, including invitation events.                                                                                                                                                                    | Written, not run |

**Phase 1 notes (2026-11-25).**

- **B1.1 (written, not run):** `app/Actions/Blog/RenderBlogBody.php` returns a `RenderedBlogBody` (html, toc, word count, reading minutes, image ids, product slugs, errors, warnings). Helper classes `BlogTrustedHtml` and `BlogTrustedHtmlRenderer` carry the figure and product-marker HTML; author raw HTML never reaches them because CommonMark strips it at parse time. 17 Pest tests are in `tests/Feature/Blog/RenderBlogBodyTest.php`. **They have not been run**: the authoring sandbox has no PHP, so the status stays "Written, not run" until `vendor/bin/pest tests/Feature/Blog/RenderBlogBodyTest.php` passes (PostgreSQL, see the Phase 0 test-environment note). Decisions made while writing it:
    - The table of contents lists `h2` and `h3` only (source `#` and `##`); deeper headings still get ids. Headings with no text are skipped in the TOC.
    - Links with a scheme other than `http`, `https`, `mailto` or `tel` are blanked, on top of CommonMark's own `allow_unsafe_links: false`. Protocol-relative `//host` links count as external; absolute links to the app's own host (`app.url`) are left plain.
    - A paragraph that is only an image becomes a figure. An image inside a sentence or link, or one that does not use `blog-image:`, is removed with a **warning**. An unknown or malformed `blog-image:` id is an **error** (blocks publish in B1.8).
    - Caption order: the Markdown title, then the stored `blog_images.caption`. Alt order: the Markdown alt text, then the stored `alt`.
    - Only core CommonMark is enabled (no tables or strikethrough). Say so if you want either.
    - Not covered yet by tests: an image whose `variants` JSON lacks `large` (falls back to `medium`, then the original).
- **B1.2 (written, not run):** the processing half is written: `ValidateBlogImageFile` (content-based checks, headers only), `StoreBlogImage` (GD decode, re-encode, variants), `DeleteBlogImage`, `ListBlogImages` (admins all, others own), the `BlogImage::unreferenced()` scope, `ReconcileBlogImageOrphansJob` and its `04:15` daily schedule in `routes/console.php`. 18 Pest tests are in `tests/Feature/Blog/BlogImagePipelineTest.php` (skipped when GD is missing). **Not run**, same reason as B1.1. The HTTP half landed with B1.3 (below). Decisions and deviations:
    - Failures are `ValidationException`s on the `image` key from the action, so the future form request and any other caller get the same 422 shape.
    - Originals are always re-encoded as JPEG (transparency flattened onto white); variants are WebP, or JPEG when `imagewebp` is missing. Variants are never upscaled, so a 1300 px cover has no `large`; the renderer already falls back to `medium`. If the source is narrower than 480 px a single `thumb` at its own width is kept.
    - Orphan age is measured from `created_at` (like the media job), not from "unreferenced since", because nothing records when a reference was dropped. An image used once and later released is therefore removed on the next run after its first 7 days. Say if you want an `unreferenced_at` column instead.
    - The over-megapixel test uses a header-only PNG so no 25 MP bitmap is allocated; it relies on `getimagesize` reading the header without validating CRCs.
    - The metadata test injects an APP1 "Exif" segment with a sentinel string and a trailing `<?php`, and asserts none of it appears in any stored file. It proves re-encoding strips segments; it does not parse real GPS tags.
- **B1.3 (written, not run):** `User::isEditor()`, `canManageBlog()`, `canEditBlogPost()` and `canDeleteBlogPost()` (editors: own posts; delete only own drafts). `Workspace::accessibleBy(Admin)` is now `canManageBlog()`, so editors keep Buyer (and Seller if they have a shop) and gain Admin; `home(Admin)` is `/admin/blog/posts` for editors. `EnsureWorkspaceAccess` lets editors through `workspace:admin`. New middleware `admin.only` (`EnsureAdminOnly`) and `blog.manage` (`EnsureCanManageBlog`). In `routes/web.php` every existing admin route now sits in an `admin.only` child group and the editor-visible `admin/blog/*` routes sit in a `blog.manage` group (deny by default). That group currently holds the image routes (JSON): `GET admin/blog/images`, `POST admin/blog/images` (throttled 30/min per user), `DELETE admin/blog/images/{blogImage}`, via `Admin\BlogImageController` and three form requests (the upload request runs `ValidateBlogImageFile` in `after()`). Tests: `tests/Feature/Blog/BlogEditorAccessTest.php`. **Not run.** Notes:
    - The acceptance test is written as a route-list loop over middleware (every `admin.*` route outside `admin.blog.` must carry `admin.only`), plus 404 checks on eight concrete admin screens. A status-code-only loop was rejected because routes with model bindings return 404 for a dummy id even when they are reachable.
    - **Please run the existing suites too**: `tests/Feature/Admin/*` and `tests/Feature/Workspace/WorkspaceAccessTest.php` exercise the code I regrouped and changed (admin routes were re-indented into a child group; no route name or URL changed). Run `npm run build` (or the Wayfinder generator) afterwards so the TS route helpers include `admin.blog.images.*`.
    - Not done in B1.3 and left to the named tasks: the "Editorial" shell title and editor nav (B1.9), audit rows for image upload/delete (B1.10), the editor landing after accepting an invitation (B1.4). `LoginResponse` is unchanged: an editor still lands on the buyer account unless the last visited workspace was Admin.
- **First local run (2026-11-25, `blog/phase-1`).** `tests/Feature/Admin` 74 passed and `WorkspaceAccessTest` 19 passed, so the admin route regrouping did not regress existing behaviour. `tests/Feature/Blog`: 49 passed, 2 failed, 19 errors. Causes and fixes (all in code I wrote):
    - 18 errors in `RenderBlogBodyTest`: wrong import. `CommonMarkCoreExtension` lives in `League\CommonMark\Extension\CommonMark\`. Fixed.
    - 1 error in `BlogImagePipelineTest`: a fake upload was garbage-collected before its file was read. The test now holds the upload in a variable.
    - `BlogEditorAccessTest` route-list loop: Pest's `toContain()` treats a second argument as another needle, not a message, so it checked for the message text. Rewritten with `in_array(...)->toBeTrue($message)`.
    - `BlogEditorAccessTest` guest check: the "guest" request ran after `actingAs($buyer)` in the same test, so it was still the buyer (404). This was a test bug, not a routing one; the check is split into a buyer test and a guest test (redirect to login for HTML, 401 for JSON).
    - `Cannot redeclare function adminUser()` when Blog and Admin tests run in one process: my test helpers are renamed `blogAdmin()`, `blogEditor()`, `blogEditorUpload()`.
    - Pint (5 files) and the 11 new PHPStan findings in blog code are fixed: byte-safe `mb_*(..., '8bit')` calls for binary data, `max(1, …)` for GD sizes, `finfo` object API, concrete paginator type, `storedPaths()` docblock. Pint `--test` is clean on every changed file. PHPStan was not re-run here; the 85 findings in unrelated `app/` files predate this branch (also present on `production`).
    - **Second local run:** Pest 162 of 163 passed; the one failure was the guest test above. B1.1 to B1.3 are marked **Done** on that basis; the split guest test is the only code not yet re-run.
- **B1.4 to B1.10 (second Phase 1 push).** Authored without a runnable PHP stack, then run locally by the owner: Pest green after fixing one real bug (`UpdateBlogPostRequest::post()` collided with `Request::post()`, renamed `blogPost()`) and four test bugs; `npm run build` succeeds. The React pages have been built but not clicked through. Commands used: `vendor/bin/pest tests/Feature/Blog tests/Feature/Admin tests/Feature/Workspace`, `vendor/bin/pint`, `vendor/bin/phpstan`, then `vendor/bin/sail npm run build` (Wayfinder generates the `@/routes/admin/blog/*` and `@/routes/editor-invitations` helpers the pages import) and `npm run check`. New tests: `BlogEditorInvitationTest`, `BlogAuthorAndCategoryTest`, `BlogPostAuthoringTest`; `BlogEditorAccessTest`'s route-list test now uses an explicit editor allow-list (every other `admin.*` route, including the new admin-only blog ones, must carry `admin.only`, and a typo in the allow-list fails the test).
    - **B1.4:** invitation link is the ULID (no signed URL), valid until `expires_at`; unusable links (expired, revoked, other account, admin/editor, suspended) all render the same neutral page with no detail. Resend restarts the expiry. The partial unique index means an _expired but unrevoked_ invitation still blocks a new one for that email: the admin must resend or revoke it (the error says so). A guest invitee is sent to log in or register; registering with the invited address through `CreateNewUser` marks the email verified (same trust model as staff invitations) and `url.intended` brings them back to accept. **Unverified:** that Fortify's register response honours `url.intended` here; if it does not, the new editor lands on their account and must reopen the email link. Accepting without ticking consent is refused. Admin controllers are `Admin\BlogEditor*Controller` (not an `Admin\Blog` namespace, matching the B1.3 image controller).
    - **B1.5:** no author delete route (the house author is undeletable by construction; posts also hold a `restrictOnDelete` key). Deactivate and reactivate are `BlogAuthorDeactivationController` store and destroy. Consent is only ever recorded, never cleared, and keeps its first timestamp and version. Editors' self-service profile edits bio, job title, avatar and links only (never name or slug) and may only use avatars they uploaded. "Create my author profile" is `POST admin/blog/profile` and needs the Appendix A.2 self-consent tick. Consent copy lives in `App\Support\Blog\BlogConsentCopy`.
    - **B1.6:** categories are admin-only; the slug is fixed after creation; delete is blocked for system categories and for any category that still has posts (soft-deleted ones count).
    - **B1.7:** posts are always created as drafts; `created_by_id` is set once. Drafts may have an empty excerpt and body (columns are not null, so they store `''`); the publish gate is the strict part. Author defaults to the user's own profile. Editors may re-credit a **draft**; after publishing only admins may (validated in the update request). Slug changes write the old slug to `blog_post_slug_histories`; slugs must also be free in that table. **Deviations/omissions:** FAQs were not in the form at B1.7 (added later in B3.6); editors are not blocked from referencing another editor's uploaded body image by id (the library is scoped, ids are unguessable); the product embed picker is not built (editors type `[[product:slug]]`; `admin.products.search` is admin-only). Archiving clears `is_featured` (an addition, so an archived post cannot linger in the hero list).
    - **B1.8:** `ValidateBlogPostForPublish` re-renders the Markdown at check time. Blocking rules are the §5.3 list; the "every body image has alt text" rule is detected as `alt=""` in the rendered figures. Warnings: no `h2`, flagged phrases, unavailable embedded products, cover under 1200×630, no thumbnail, duplicate SEO title, more than 30 body images, plus renderer warnings. Publishing, unpublishing, archiving and restoring are separate CRUD controllers (`BlogPostPublication`, `BlogPostArchive`); featuring is `BlogPostFeatured` (admin only). The gate runs in `CreateBlogPostPublicationRequest::after()`, so a failure comes back as a `publish` validation error.
    - **B1.9:** pages `admin/blog/{posts,post-form,post-preview,categories,authors,editors,profile}.tsx` and `account/editor-invitation.tsx`; shared `components/blog/{image-upload-dialog,author-fields,confirm-action-button}.tsx`. The Markdown editor is a textarea with a debounced live preview from `POST admin/blog/markdown-preview` (the same `RenderBlogBody` as saving). The preview route renders the stored HTML in a simple admin page because the public post page does not exist until Phase 2; the "byte-for-byte" acceptance is therefore met at the renderer, and should be re-checked once B2.4 lands. Nav: items carry an `audience` flag (undefined means admins only); editors see Posts, My profile and Account settings; the shell title reads "Editorial" for `role === 'editor'` (the role already reaches the client through `auth.user`). The publish checklist reflects the **last saved** version.
    - **B1.10:** audit rows are written by the actions: `blog.post.{created,updated,published,unpublished,archived,deleted,featured}` (post events carry `author_id` and `created_by_id`), `blog.editor.{invited,accepted,revoked,removed}` (a resend logs `blog.editor.invited` with `resent: true`), `blog.author.{created,updated,deactivated}`, and `blog.category.{created,updated,deleted}`. Image upload/delete audit rows (noted as open in B1.3) are **still not written**; add them before ticking B1.10.

### Phase 2 — Public blog

| Task | Description                                                                                                                                              | Acceptance                                                                                                                       | Status      |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| B2.1 | Routes (§4.2) with correct ordering, route-binding override (live only, slug-history 301), reserved-slug guard.                                          | Tests: draft/scheduled/archived 404; old slug 301; reserved slug rejected.                                                       | Done        |
| B2.2 | `ListBlogIndex`, category/tag/author actions, search, pagination, caching and `InvalidateBlogCache` observers.                                           | Feature test with query-count ceiling; cache cleared on publish.                                                                 | Done        |
| B2.3 | Index, category and author pages: hero, chips, grid with thumbnails, popular rail, search, empty states.                                                 | Inertia prop assertions; empty state renders 200; author page `noindex` until a live post exists.                                | Done        |
| B2.4 | Post page: author byline and box, cover, TOC, body segments with figures, related posts, CTA, breadcrumb.                                                | Props test; exactly one `h1` in server HTML; house author has no box or link.                                                    | Done        |
| B2.5 | `BlogSegments` + `blog-product-card.tsx` with halal badge, live price/stock; `lib/analytics.ts` and the `select_item` click event (§7.3); no UTM params. | Tests: hidden/moderated product omitted; one batched product query; product links are clean; event helper no-ops without `gtag`. | Not started |
| B2.6 | Footer link, optional home "From the blog" strip, flag gating.                                                                                           | Home hides strip with fewer than 3 posts; footer link only when enabled.                                                         | Not started |
| B2.7 | `RecordBlogPostView` (bot-excluded, once per session/post/day).                                                                                          | Tests: bot UA ignored, second view same day ignored.                                                                             | Not started |
| B2.8 | Share bar (resolve F9).                                                                                                                                  | No request to `products.shares.store` from a blog page.                                                                          | Not started |

**Phase 2 notes (first four tasks, 2026-11-26).** Authored without Composer or a runnable Laravel app (the sandbox could not authenticate to GitHub for packages), so PHP was only linted with `php -l`; the React files typecheck and pass `oxlint`/`oxfmt` and `scan-violations`. Run: `vendor/bin/pest tests/Feature/Blog`, `vendor/bin/pint`, `vendor/bin/phpstan`, `vendor/bin/sail npm run build` (Wayfinder generates `@/routes/blog`, `/blog/categories`, `/blog/tags`, `/blog/authors`), then `npm run check`.

- **B2.1 (also finishes B0.4):** the whole public group carries the `blog` middleware, so every route 404s with the flag off (tested per route, including a retired slug). Bindings live in `AppServiceProvider::registerBlogBindings()` under their own parameter names (`blogPost`, `blogAuthor`) so the admin `{post}` / `{author}` bindings still see drafts. Routes use `:slug` so `route('blog.show', $post)` builds slug URLs. Both bindings also check the flag, so a retired slug cannot 301 while the blog is off. Author pages 404 for inactive and house authors. `/blog/feed.xml` (B4.1) must be registered above `{blogPost:slug}`; until then it 404s like the other reserved paths.
- **B2.2:** `PaginateLiveBlogPosts` is the one listing query (card columns only, shared eager loads, newest first); `ListBlogIndex`, `ListBlogCategoryPosts`, `ListBlogTagPosts`, `ShowBlogAuthor`, `ShowBlogPost`, `ListRelatedPosts` and `ListBlogCategoryChips` build on it. Hero, popular and chips are cached 5 minutes under `blog:index:{hero,chips,popular}`; `InvalidateBlogCache` (also clears `sitemap:blog` and the llms.txt key) runs from `saved`/`deleted` hooks on `BlogPost` (plus `restored`), `BlogCategory`, `BlogAuthor` and `BlogImage`. **Warning for B2.7:** `view_count` increments must not fire model events or touch `updated_at` (use a raw query update), or every view would clear the cache and make "Updated" dates misleading. The plan asks for a query-count ceiling test; it is **not written yet** because it needs a measured baseline from a real run.
- **B2.3:** one page, `pages/blog/index.tsx`, serves the index, a category and a tag (`mode` prop); `pages/blog/author.tsx` is the author page. The hero is a scroll-snap strip (`blog-hero.tsx`), not `carousel.tsx`, which is a photo-zoom gallery. SEO is a basic version (title, description, canonical, prev/next, robots, page + breadcrumb JSON-LD) through `BuildBlogIndexSeoData`, `BuildBlogCategorySeoData`, `BuildBlogTagSeoData`, `BuildBlogAuthorSeoData` and `BuildBlogPostSeoData`; Phase 3 adds `Blog`/`BlogPosting`/`Person` nodes and the validator rules. Robots rules implemented: search results, pages past the last, and empty listings are `noindex, follow`; tags under 3 posts and authors with no live post are `noindex, follow`.
- **B2.4:** `blog/show.tsx` with byline (author profile, never the creator; house author is plain text), cover (eager, high priority), TOC (only with 3+ headings; collapsible on phones, sticky on desktop), body, tags, shop CTA from the category's linked shop category, author box (omitted for house and deactivated authors), related posts and breadcrumb. **Not done here:** product embeds. `BlogBody` renders the stored HTML as one block and hides empty `data-blog-product` markers until B2.5 adds `BlogSegments`. The "exactly one `h1` in server HTML" acceptance is covered by the page owning the only `h1` and a test that the stored body has none; verify the rendered SSR output once when you click through. B1.9's "byte-for-byte" preview check can now be redone against the real post page.

### Phase 3 — SEO and GEO

| Task | Description                                                                                                                                                             | Acceptance                                                                                                              | Status           |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------- |
| B3.1 | `BuildBlogIndexSeoData`, `BuildBlogCategorySeoData`, `BuildBlogPostSeoData`, `BuildBlogAuthorSeoData` and `BuildBlogNode` / `BuildBlogPostingNode` / `BuildPersonNode`. | Policy test passes through `JsonLdValidator`; `@id`s resolve (post → person → organization); XSS test on title and bio. | Done        |
| B3.2 | Open Graph/Twitter article tags; `og` JPEG variant as `og:image`; `PreWarmSocialImageJob` kept for non-blog pages only.                                                 | `SeoSocialTagsTest` extended; every live post has a valid absolute `og:image` with dimensions.                          | Done        |
| B3.3 | `BuildBlogSitemap`, index entry, cache invalidation, `lastmod`.                                                                                                         | Sitemap lists only live posts and authors with posts; no static-file shadowing.                                         | Done        |
| B3.4 | `llms.txt` blog section; `seo:audit` blog samples; `config/seo.php` noindex param for blog search.                                                                      | Existing `SeoGeoTest` / `SeoAuditTest` extended and green.                                                              | Done        |
| B3.5 | Extend `JsonLdValidator` + Node twin + fixtures for `BlogPosting`, `Blog`, `ProfilePage`/`Person`.                                                                      | `npm run check` green.                                                                                                  | Done        |
| B3.6 | FAQ block (admin form, `faq-list.tsx`, `FAQPage` via `BuildFaqNode`) with visible-equals-markup parity test.                                                            | Parity test; posts without FAQs emit no FAQ markup.                                                                     | Done        |

**Phase 3 notes (B3.1 to B3.6, 2026-11-26).** Written without a runnable PHP stack; since run and green locally — `vendor/bin/sail pest tests/Feature/Blog tests/Feature/SeoStructuredDataPolicyTest.php tests/Unit/JsonLdValidatorTest.php` (213 tests), plus `pint`, `phpstan`, `npm run build` and `npm run check` (the last still reports pre-existing formatting/violation findings unrelated to the blog).

- **B3.1:** new nodes `BuildPersonNode`, `BuildBlogPostingNode` and `BuildBlogNode`, with `SchemaId::{blog,blogPost,person}`. Post graph: `WebPage` (`mainEntity` → article) → `BlogPosting` (author is a reference to the `Person`, or to the sitewide Organization for the house author; publisher → Organization; `mainEntityOfPage` → the page) + `BreadcrumbList` + `Person`. A deactivated author is still credited but their `Person` has no `url` because the page 404s. Index graph: `CollectionPage` (`mainEntity` → `Blog`) + `Blog` + an `ItemList` whose typed stubs share the posts' `@id`s (built with the existing `BuildItemListNode`); search results declare no posts. Author page: `ProfilePage` (`mainEntity` → `Person`) + `Person` (`sameAs` from https links only, max 4). `BuildBlogIndexSeoData` now takes the page's cards. `FAQPage` is B3.6, not emitted yet. The validator has no rules for these types until B3.5, so today it only checks structure, `@id` resolution and URL/empty-value rules.
- **B3.2:** `article:tag` (one tag per tag, via a new `tags` key in `og.article` and a loop in `app.blade.php`), `article:author` only for people with a live page, Twitter `Written by` / `Reading time` labels. `og:image` is the cover's `og` JPEG with its stored width/height (falls back to the `large` variant with its own dimensions, then to the site default image). `PreWarmSocialImageJob` is only dispatched from `Product`, so blog posts never reach it and nothing needed changing there. Tests are in the new `tests/Feature/Blog/BlogSeoTest.php` (which also covers canonicals, robots and the XSS case); the existing `SeoSocialTagsTest` and the `SeoStructuredDataPolicyTest` page list were **not** extended, because the blog needs its own fixtures. Add the blog pages to the policy test when B3.5 lands.
- **B3.3:** `BuildBlogSitemap` + `SitemapBlogController`, route `sitemap-blog.xml` behind the `blog` middleware (404 with the flag off), cached 1 h under `sitemap:blog`. It lists `/blog`, categories and active non-house authors that have a live post, tags with 3 or more live posts (`BuildBlogTagSeoData::MIN_POSTS_TO_INDEX`, the same threshold as the tag page's robots) and every live post; `lastmod` is the newest real `updated_at` behind each URL. `BuildSitemapIndex` lists it only while the blog is on **and** has a live post. `InvalidateBlogCache` now also clears `sitemap:index`. `sitemap:generate` writes the blog file too when the blog is on (the existing test still requires no static `sitemap*.xml` in `public/`). No 50,000-URL split yet; revisit if the blog ever approaches that.
- **B3.4:** `BuildLlmsTxt` gains a "Blog" section (index link plus the 10 newest live posts with a one-line excerpt), omitted when the flag is off or no posts exist. `AuditSeoPages` samples `/blog`, the 2 latest posts and one author page when the blog is on; the blog sitemap is covered through the sitemap index. The config key is `seo.disallowed_query_params`, and I added `q` there (robots `Disallow: /*?*q=`; the page itself is also `noindex, follow`). Side effect: any other `?q=` URL (`/sellers?q=`) is now disallowed in robots.txt too, which matches how `sort` is already treated. Tests: new cases in `BlogSeoTest` plus two in `SeoAuditTest`; the existing `SeoGeoTest` was not touched.
- **B3.5:** `JsonLdValidator` and `scripts/validate-jsonld.mjs` learn the blog types, rule for rule. `BlogPosting` (full node only): required `headline`, `image`, `datePublished`, `author`; errors for a `headline` over 110 characters (what `BuildBlogPostingNode` already truncates to) and for a `datePublished` / `dateModified` that is not ISO 8601 (date or date-time); warnings for a missing `dateModified`, `publisher`, `description` or `mainEntityOfPage`. A `BlogPosting` that is not a top-level node (the index's `ItemList` stubs) is not held to those rules, the same stub rule `Product` already follows. `Blog` (top level): `name` and `url`. `Person`: `name` only, because a deactivated author is still credited but has no `url`. `ProfilePage` (top level): `name`, `url` and `mainEntity`. The Node self-test (`tests/Unit/jsonld-validator.test.mjs`) **was run here and passes**; the Pest mirror in `tests/Unit/JsonLdValidatorTest.php` passes. The blog pages are now in `SeoStructuredDataPolicyTest` (index, search results, category, tag, author, a post by a person, by the house author and by a deactivated author, plus a "no warnings" check on a live post). That last check is the one most likely to need a fixture tweak on first run, since it asserts the factory post produces zero optional-property warnings. `DEFAULT_PATHS` in the Node script is unchanged on purpose: `/blog` 404s while the flag is off, so pass blog paths explicitly (`node scripts/validate-jsonld.mjs --base-url <origin> /blog /blog/<slug>`).
- **B3.6:** FAQs for posts. `App\Support\Blog\BlogFaqs` is the single source: `normalize()` trims, converts line endings, drops any row that is not a complete question plus answer, caps the list at 10 and returns `null` for none; `for($post)` is what both the post page props (`post.faqs`) and `BuildBlogPostSeoData` read, so the visible list and the `FAQPage` node cannot differ (`BuildFaqNode` returns null for an empty list, so a post without FAQs emits no FAQ markup). Plain text only: the page renders it escaped and the graph is hex-encoded by `SchemaGraph::encode()`. Admin: an optional "FAQ" section in `post-form.tsx` (add, edit, remove; fully blank rows are dropped before sending). Validation: up to 10 entries, question up to 200 and answer up to 1000 characters, both or neither per row, questions distinct ignoring case. Public: `FaqList` (the existing component) renders after the body and before the tags and shop CTA. Decisions: (1) `UpdateBlogPost` only touches `faqs` when the request carries the key, so an older client cannot wipe them, while an explicit empty list clears them; (2) FAQs are not part of the publish gate (they are optional); (3) the admin preview page does not render FAQs, it only shows the stored body. New `tests/Feature/Blog/BlogFaqTest.php` covers the normaliser, create/update/clear/keep, validation, the edit-screen props, the parity check (props equal `mainEntity`), no markup without FAQs, script-tag breakout and stale half-rows; it passes locally. The JS side (`post-form.tsx`, `show.tsx`) passes `vp fmt`, `oxlint` and the type check apart from the Wayfinder route modules, which only exist after `npm run build` generates them; `scan-violations` reports the same 33 pre-existing findings as a clean `production` checkout, none in these files.

### Phase 4 — Polish and growth (optional, order flexible)

| Task | Description                                                                                           | Status      |
| ---- | ----------------------------------------------------------------------------------------------------- | ----------- |
| B4.1 | RSS feed `/blog/feed.xml` and `<link rel="alternate">` in the head.                                   | Not started |
| B4.2 | Thirty-day popularity (`blog_post_daily_views`) replacing all-time `view_count` for the rail.         | Not started |
| B4.3 | "Featured in" block on product pages driven by `blog_post_products`.                                  | Not started |
| B4.4 | Bulk reassign posts when an author is deactivated or an editor is removed.                            | Not started |
| B4.5 | `[[fact:…]]` tokens backed by `TrustFacts` so policy statements can never drift from the real values. | Not started |
| B4.6 | Optional editorial review step (editor submits, admin approves) if the team wants one.                | Not started |

### Phase 5 — Verification and rollout

| Task | Description                                                                                                                                                                                                                                                                                                                                                                           | Status      |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| B5.1 | Playwright spec `tests/e2e/specs/blog.spec.ts` (admin invites an editor; editor accepts, writes a post on behalf of another author with cover, thumbnail, body image and a product embed; admin features it; public index, category, author page, post, search; draft hidden; editor cannot open `/admin/dashboard`) registered in `tests/e2e/scenarios.json` per `.ai/rules/e2e.md`. | Not started |
| B5.2 | Manual validation per [`14a-seo-validation-runbook.md`](./14a-seo-validation-runbook.md) §2 (Rich Results Test for `BlogPosting`, Facebook/LinkedIn/X debuggers, Viber/WhatsApp previews of the `og` image).                                                                                                                                                                          | Not started |
| B5.3 | Run `BlogBaselineSeeder` in production; invite the first editors; publish 6–10 launch posts across at least 3 categories before enabling the flag; submit `sitemap-blog.xml` in Search Console.                                                                                                                                                                                       | Not started |
| B5.4 | Enable `BLOG_ENABLED=true` on staging, run `php artisan seo:audit --require-ssr`, then production.                                                                                                                                                                                                                                                                                    | Not started |

### Phase 6 — Seller stories (after Phases 0–5 are live)

| Task | Description                                                                                                                                                                                                                                                                                                                                              | Acceptance                                                                                                                  | Status      |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------- |
| B6.1 | Schema: `blog_posts.source` (`editorial`/`seller_story`), `shop_id`, `submitted_at`; `blog_authors.shop_id` (unique, nullable). Shop author profile auto-created at first submission (display name = shop name).                                                                                                                                         | Migration reversible; one author per shop.                                                                                  | Not started |
| B6.2 | Seller Centre page `seller/stories` (seller workspace, per `.ai/rules/workspaces.md`): create/edit a draft, upload images through the same pipeline, submit for review. Category is fixed to `seller-stories`. Product embeds limited to the shop's own products. **Owner of the active shop only** (recommended default). Consent text is Appendix A.3. | Tests: staff and non-owners get 404; embeds of other shops' products rejected; suspended or unapproved shops cannot submit. | Not started |
| B6.3 | Moderation: add `ModerationItemType::BlogStory`; submission creates a queue item; admin approve (publishes now, editable later) or reject with reason; seller notified via a new `BlogStoryReviewedNotification`.                                                                                                                                        | Tests: approve and reject paths, notification content, audit rows.                                                          | Not started |
| B6.4 | Rules: one story in review per shop, max 3 submissions per 7 days; a published story is read-only for the seller (changes go through admin); consent captured as the seller accepts "Seller content terms" at submit time (sets the shop author's `consent_confirmed_at`). Uses the copy in Appendix A.3.                                                | Tests for each limit; consent timestamp recorded.                                                                           | Not started |
| B6.5 | Shop suspension/removal unpublishes the shop's stories (follow how products react to a suspended shop **(verify)**).                                                                                                                                                                                                                                     | Test: suspending a shop sets its live stories to `draft` and clears caches/sitemap.                                         | Not started |
| B6.6 | SEO: seller-story `BlogPosting` links `author` → shop `Person`/Organization and `about` → shop `Store` `@id`; post page shows "Visit the shop" CTA.                                                                                                                                                                                                      | Policy test and validator green.                                                                                            | Not started |

---

## 12. Test plan

Pest (feature unless noted); files under `tests/Feature/Blog/` and `tests/Unit/`.

| File                                           | Covers                                                                                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Unit/RenderBlogBodyTest.php`                  | Heading offset, ids, TOC, word count, product and image tokens, hostile Markdown (script, `javascript:`, event attributes, remote/`data:` images) |
| `Feature/Blog/BlogImagePipelineTest.php`       | Accept/reject matrix, re-encode, EXIF/GPS stripped, variants, orphan pruning, deletion protection                                                 |
| `Feature/Blog/BlogFlagTest.php`                | Every public route 404s when disabled; sitemap/llms/footer omit blog                                                                              |
| `Feature/Blog/BlogVisibilityTest.php`          | Draft, scheduled (`travelTo`), archived, soft-deleted are 404; slug history 301; reserved slugs                                                   |
| `Feature/Blog/BlogIndexTest.php`               | Hero, chips only for categories with posts, pagination, search, empty state, query-count ceiling                                                  |
| `Feature/Blog/BlogPostPageTest.php`            | Props, author byline vs creator, related posts, product segments, unavailable product omitted, clean product links, bot view ignored              |
| `Feature/Blog/BlogAuthorPageTest.php`          | Author page content, `noindex` until a live post, house author has no page                                                                        |
| `Feature/Admin/Blog/EditorAccessTest.php`      | **Route-list-driven:** editor 404 on every `admin.*` route outside the allow-list; admin unaffected; guest and buyer 404                          |
| `Feature/Admin/Blog/EditorInvitationTest.php`  | Invite, accept, expiry, revoke, email mismatch, existing admin/editor, suspended, pending cap, throttling, remove editor                          |
| `Feature/Admin/Blog/PostAuthoringTest.php`     | Write on behalf of, ownership rules, publish checks, consent gate, scheduling, audit rows with author and creator                                 |
| `Feature/Admin/Blog/*Test.php` (others)        | Categories, authors, images, preview authorization                                                                                                |
| `Feature/Blog/BlogSeoTest.php`                 | Canonicals, robots, OG article tags, `og:image` variant, JSON-LD through `JsonLdValidator` incl. `Person`, sitemap, `llms.txt`                    |
| `Unit/jsonld-validator.test.mjs`               | Blog and author fixtures                                                                                                                          |
| `Feature/Seller/SellerStoryTest.php` (Phase 6) | Submission rules, moderation, notifications, suspension behaviour                                                                                 |
| `tests/e2e/specs/blog.spec.ts`                 | Invitation-to-reading happy path (B5.1)                                                                                                           |

Run before merging: `php artisan test --compact --filter=Blog`, the existing `--filter=Seo` suites, the existing admin and workspace suites (editor plumbing touches them), `vendor/bin/pint`, `vendor/bin/phpstan`, and `npm run check`.

---

## 13. Risks and mitigations

| Risk                                                                       | Mitigation                                                                                                             |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| An editor reaches admin screens (financial, user, moderation data)         | Deny-by-default route split plus the route-list-driven test (§6.5); editors have no buyer-data permissions anywhere    |
| Crediting a real person who did not agree                                  | Consent gate on publish (§4.7), consent recorded with who recorded it, admin-only author creation                      |
| Thin or duplicated content hurts SEO                                       | Publish gate (≥150 words, unique excerpt), tags/authors noindex until populated, launch with 6–10 real posts (B5.3)    |
| Unverified halal or health claims create trust and legal exposure          | Editorial rules (§4.6), flagged-phrase warnings, embeds source halal data from real product records                    |
| Stored XSS through the body or author bio                                  | Markdown-only, HTML stripped, hostile-input unit tests, JSON-LD hex-escaped, bios stored and rendered as plain text    |
| Malicious or oversized image uploads (no AV scan by decision)              | Content sniffing, decode + re-encode, pixel and size caps, no SVG/GIF, random names, throttling                        |
| GD lacks webp/jpeg support in an environment                               | Verify in B0.1 for Docker, CI and production; fall back to JPEG variants if webp is missing                            |
| Stale product embeds break pages                                           | Embeds resolve at request time and are skipped when unavailable; publish warning for unavailable products              |
| Cache serves unpublished or removed content                                | Observers call `InvalidateBlogCache`; short 5-minute TTL as a backstop                                                 |
| Internal tracking links distort GA4 sources                                | No UTM on internal links; `select_item` event instead (§7.3)                                                           |
| View counter inflated by bots or refresh                                   | UA/human-pass filter, once per session/post/day                                                                        |
| CI does not run on pushes to `production` (F11)                            | Work through pull requests so `pull_request` CI runs                                                                   |
| Route collisions (`/blog/category`, a post titled "Tag", an author "Feed") | Reserved-slug validation and route ordering tests                                                                      |
| All-time popularity favours old posts                                      | Accepted for v1; B4.2 introduces a 30-day window                                                                       |
| Seller stories become a spam or SEO-abuse channel                          | Owner-only, moderated, 1 in review per shop, rate-limited, read-only after publish, own-products-only embeds (Phase 6) |

---

## 14. Decisions log

### Resolved (2026-11-25)

| #   | Question                      | Decision                                                                                                                                                                                                                                               | Where it landed                  |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| 1   | Editor role                   | Writers/editors are **invited by an admin** and work in the **Admin namespace** (`admin/blog/*`).                                                                                                                                                      | §4.1, §4.4, §6.5, B1.3, B1.4     |
| 2   | Authors                       | **Author profiles** are added. The logged-in user is not necessarily the author; when creating a post the user can **assign it to another author (write on behalf of)**.                                                                               | §4.3, §4.4, §4.7, §5, B1.5, B1.7 |
| 3   | Seller-submitted content      | Yes, **for seller stories**, as a later phase.                                                                                                                                                                                                         | Phase 6, §13                     |
| 4   | Body images                   | **Cover, thumbnail and body images** are all in v1 (plus avatars).                                                                                                                                                                                     | §5.1, §7.1, §7.4, B1.2           |
| 5   | Upload scanning               | **No antivirus scanning.** Compensating hardening is decode + re-encode, metadata stripping and strict caps (a free addition, not a scan).                                                                                                             | §7.4, §9                         |
| 6   | Launch categories and writers | Suggested set accepted: Shopping guides, Halal food and pantry, Recipes, Ramadan and Eid, Lifestyle, Seller stories. The first posts are written by the invited editors.                                                                               | B0.5, B5.3                       |
| 7   | AI-crawler policy for blog    | Acceptable; the blog follows the doc 14 T4.1 policy with no blog-specific rule.                                                                                                                                                                        | §8                               |
| 8   | Tracking (UTM, content group) | "Not sure, do what's recommended." **Recommendation adopted:** no UTM on internal links (it can overwrite GA4's real traffic source), a GA4 `select_item` click event instead, no custom content group. This reverses the UTM idea in the first draft. | §7.3, B2.5, §13                  |
| 9   | Domain placement              | `/blog` on the main domain.                                                                                                                                                                                                                            | §4.2, §8                         |

### Accepted defaults (2026-11-25, same day)

| #   | Question                  | Decision                                                                                                                                                                                                                                                                                                 | Where it landed     |
| --- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| 10  | Editor permission scope   | Accepted as in the §4.4 matrix: editors create, edit and publish **only their own posts**, directly with no approval step; they cannot delete published posts, feature posts, manage categories or authors, or see others' drafts. An approval step stays optional (B4.6).                               | §4.4, B1.3, B1.7    |
| 11  | Editors' other workspaces | Accepted: editors keep buyer (and any seller) access and gain the limited Admin workspace. The shell shows "Editorial" for editors and "Admin" for admins.                                                                                                                                               | §6.5, B1.3, B1.9    |
| 12  | Seller story permissions  | Accepted: only the active shop's **owner** submits; **admins** approve through the moderation queue (editors cannot); published stories are read-only for the seller.                                                                                                                                    | Phase 6 (B6.2–B6.4) |
| 13  | Consent wording           | Draft copy written in Appendix A for the three consent moments. It must be reviewed by whoever owns legal/privacy before `BLOG_ENABLED` is switched on; copy lives in one place (`lang`-style constants in `config/blog.php` or a dedicated support class) so changing it needs no code edits elsewhere. | Appendix A, B5.3    |
| 14  | Admin authorship          | Created **on demand** from the author select ("Create my author profile", self-consent required). No profile is auto-created for admins.                                                                                                                                                                 | B1.5                |

### Still open

None blocking. Items that will need a person at launch time rather than a decision now: legal review of Appendix A (B5.3), choosing the first editors to invite, and writing real category descriptions.

---

## Appendix A — Draft consent and terms copy (pending legal review)

Keep these strings in one place so they can be revised without touching logic, and store which version a person accepted (`consent_confirmed_at` plus `blog_authors.consent_version`, set from a version constant in config).

**A.1 Editor invitation acceptance** (shown on `editor-invitations/{id}`)

> **Be credited as an author**
> By accepting, you agree that HalalBenta may publish your display name, job title, short bio, photo and any links you add on your author page and on every article credited to you, including in search results and social previews. You can edit these details from your profile at any time, and you can ask an admin to deactivate your profile. Articles already published may remain online under your name unless you ask for them to be reassigned.
>
> [ ] I agree to be credited publicly as an author on HalalBenta.

**A.2 Admin creating a guest author, or an admin creating their own profile**

Guest author (checkbox in the admin form):

> [ ] I confirm this person has agreed to be credited by name on HalalBenta, and that the name, photo, bio and links entered here are the ones they approved.

Admin's own profile ("Create my author profile"):

> [ ] I agree to be credited publicly as an author on HalalBenta under the details above.

**A.3 Seller stories** (Seller Centre submit screen, Phase 6)

> **Seller content terms**
> By submitting this story you confirm that you own or have permission to use all text and images in it, that it does not make halal-certification or health claims that are not true and documented, and that HalalBenta may edit it for clarity, publish it on the HalalBenta blog and credit your shop by name. HalalBenta may decline or remove a story at any time, for example if your shop is suspended.
>
> [ ] I accept the Seller content terms for this story.

**Implementation notes**

- Each acceptance records user id, timestamp, IP (via the existing audit log) and the `consent_version`.
- Bumping the version does **not** invalidate existing posts; it only changes the copy shown to new acceptances. A material change (e.g. new uses of the photo) should be sent to current authors for re-confirmation as a manual process, not an automated lock.
- Publishing is blocked only when `consent_confirmed_at` is empty (§4.7), never because the version is old.
