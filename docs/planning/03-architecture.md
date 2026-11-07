# 03 — Architecture (delta-based)

Written as a **delta against `00-repo-audit.md`**, not a greenfield design. Everything not listed as an addition stays untouched. Decisions referenced by ID from `01-decisions.md`.

## 1. Existing structure we build on (no changes)

| Exists today                                    | Role in marketplace                                                              |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| `User` (ULID PK, `HasUlids`, `final`)           | Gains role helpers + relationships; no schema-breaking change                    |
| Fortify auth (session, 2FA, passkeys)           | Unchanged for web; Sanctum added for `/api/v1` tokens                            |
| `app/Actions` + thin CRUD controllers (D25)     | All marketplace logic lives in Actions, shared by web + API                      |
| FormRequest-only authorization (D23)            | Every endpoint authorized in its own `*Request`                                  |
| React 19 + Inertia v3 + Tailwind v4 + Wayfinder | Unchanged; Wayfinder generates API client functions too                          |
| Sail: Postgres, Redis, Mailpit, **Typesense**   | Postgres = app DB; Redis = queue/cache/broadcast; Typesense = search             |
| `jobs`/`cache`/`sessions` tables                | Queue driver moves to **Redis** (queued jobs for flags, notifications, webhooks) |
| Pest, Pint, Larastan L7, `vp check`             | Unchanged quality gates                                                          |

## 2. Domain model / ERD

New tables (ULID PKs, matching `users`; up-only migrations). `*` = configurable via `settings`/config.

### Identity & shops

| Table              | Key columns / relations                                                                                | Notes                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `users` (existing) | + `role` enum-ish string (`buyer`/`seller`/`moderator`/`admin`, default `buyer`), + `suspended_at`     | Buyer+seller coexistence via `shops.user_id`, not the role |
| `shops`            | `user_id`, name, slug, logo, banner, description, `status` (`pending`/`live`/`suspended`), pickup addr | One shop per seller (unique `user_id`)                     |
| `seller_profiles`  | `user_id`, application payload (business info, doc refs), `reviewed_by`, `reviewed_at`, reject reason  | Application record; approval flips shop `live`             |
| `badges`           | name, slug, icon, description, `is_active`                                                             | Generic badge module (D6)                                  |
| `badge_shop`       | `badge_id`, `shop_id`, `granted_by`, `granted_at`, `expires_at`                                        | Badges visible only while shop verified                    |
| `addresses`        | `user_id`, label, recipient, phone, line1/2, region, province, city, barangay, postal, `is_default`    | PH fields free text MVP; structured region dataset is v2   |
| `follows`          | `user_id`, `shop_id`                                                                                   | Shop followers                                             |
| `wishlist_items`   | `user_id`, `product_id`                                                                                |                                                            |

### Catalog

| Table                   | Key columns / relations                                                                           | Notes                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `categories`            | name, slug, `parent_id`, icon, `commission_pct` (nullable → falls back to shop/platform default)  | Self-nesting, one level used in MVP UI                 |
| `products`              | `shop_id`, `category_id`, name, slug, description, `status`, `is_flagged`, counters (sold/rating) | `status`: `draft`/`pending`/`live`/`hidden`/`rejected` |
| `product_images`        | `product_id`, path, sort                                                                          |                                                        |
| `product_variants`      | `product_id`, sku, option payload (JSON: `{size,color}`), price, stock, `is_active`               | SKU = variant; single-variant products get 1 row       |
| `product_option_groups` | `product_id`, name (e.g. "Size"), values (JSON)                                                   | Drives the variation picker                            |

### Cart / checkout / orders

| Table                 | Key columns / relations                                                                                           | Notes                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `carts`               | `user_id` (nullable for guest-session carts later)                                                                |                                                                   |
| `cart_items`          | `cart_id`, `product_variant_id`, qty, price snapshot                                                              | Grouped by shop at read time                                      |
| `checkouts`           | `user_id`, `idempotency_key` (unique), `address_id`, payment method, totals, `status`                             | One checkout → N orders (D10); key makes submit idempotent (US-7) |
| `orders`              | `checkout_id`, `shop_id`, `user_id`, number, `status`, `payment_status`, subtotal, shipping fee, voucher discount | Per-shop order                                                    |
| `order_items`         | `order_id`, `product_variant_id`, name/variant snapshot, qty, unit price                                          | Snapshots survive product edits/deletes                           |
| `shipments`           | `order_id`, courier name, tracking no, `shipped_at`, `delivered_at`, `confirmed_at`                               | Seller-fulfilled (D9)                                             |
| `order_status_events` | `order_id`, from→to, actor (`user_id`/system), note, created_at                                                   | Immutable order history                                           |
| `vouchers`            | `shop_id` (nullable = platform), code, type (`fixed`/`pct`), value, min spend, window, usage cap                  | Basic vouchers only (D16)                                         |
| `voucher_redemptions` | `voucher_id`, `order_id`, `user_id`                                                                               |                                                                   |

### Money

| Table              | Key columns / relations                                                                                  | Notes                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `payments`         | `checkout_id`, gateway, gateway ref, method (`card`/`gcash`/`maya`/`cod`), amount, `status`              | `status`: `pending`/`paid`/`failed`/`refunded`       |
| `payment_webhooks` | gateway, event id (unique), payload JSON, `processed_at`                                                 | Idempotent webhook processing                        |
| `payout_ledger`    | `shop_id`, `order_id`, type (`credit`/`commission`/`payout`/`refund_debit`), amount, balance_after, note | Append-only; funds released on delivery confirm (D8) |
| `payouts`          | `shop_id`, amount, `status` (`requested`/`paid`), method details, `processed_by`                         | Manual in MVP (admin marks paid)                     |

### Social / trust

| Table                 | Key columns / relations                                                                               | Notes                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `conversations`       | `buyer_id`, `shop_id`, `last_message_at`                                                              | Buyer↔seller only (D11); unique pair                               |
| `messages`            | `conversation_id`, `sender_id`, type (`text`/`image`/`product_card`/`order_card`), body, payload JSON | Card payloads reference product/order IDs                          |
| `conversation_blocks` | `conversation_id`, `blocked_by`, reason                                                               | Report/block (D11)                                                 |
| `reviews`             | `order_item_id` (unique), `user_id`, `product_id`, `shop_id`, rating, body, `status`                  | Verified purchase enforced by `order_item_id` unique (D12)         |
| `review_images`       | `review_id`, path                                                                                     |                                                                    |
| `returns`             | `order_id`, `user_id`, reason, photos JSON, `status`, resolution, `resolved_by`, `resolved_at`        | `status`: `requested`/`accepted`/`rejected`/`escalated`/`resolved` |
| `notifications`       | Laravel `notifications` table (built-in)                                                              | Database + broadcast channels                                      |

### Moderation (detail in §3)

| Table                 | Key columns / relations                                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reports`             | `reporter_id`, `reportable_type`/`_id` (product/review/conversation/shop/user), reason, detail                                                           |
| `moderation_items`    | `subject_type`/`_id` (polymorphic), `type`, `status` (`new`/`in_review`/`resolved`), priority, `assigned_to`, SLA due, `resolved_by`, resolution, reason |
| `moderation_actions`  | `moderation_item_id`, `actor_id`, action, reason, payload JSON, created_at                                                                               |
| `reason_templates`    | `type`, label, body, `is_active`                                                                                                                         |
| `autoflag_rules`      | `type` (`keyword`/`category`/`first_n`/`report_threshold`), config JSON, `is_active`                                                                     |
| `audit_log`           | `actor_id`, `auditable_type`/`_id`, event, before/after JSON, ip, created_at — **append-only**                                                           |
| `moderation_accesses` | `actor_id`, `subject_type`/`_id`, context, created_at — sensitive-content access log (D-privacy)                                                         |

### Settings / white-label

| Table      | Key columns                                                              |
| ---------- | ------------------------------------------------------------------------ |
| `settings` | `key` (unique), `value` JSON — commission defaults, thresholds*, window* |
| `brand`    | single-row: name, logo path, email from-name, token overrides JSON       |

## 3. Moderation design

- **Single intake path:** anything reviewable creates a `moderation_items` row pointing polymorphically at its subject (`Product`, `Review`, `Conversation`, `Shop`, `User`, `Return`, `SellerProfile`). Reports (`reports`) attach to the item; N reports on one subject roll up into one queue item (reporter count on the item).
- **Status workflow:** `new` → `in_review` (on assign/claim) → `resolved` (action + reason required). Reopen creates a new item, preserving history.
- **Actions** (`moderation_actions`, one row each): `approve`, `reject`, `request_changes`, `hide`, `unpublish`, `warn`, `suspend`, `ban`, `restore`, `escalate`, `assign`. Each action row + audit_log entry + user notification happen in one `DB::transaction()` inside an Action class.
- **Auto-flagging:** listeners on `ProductCreated`/`ProductUpdated`/`ReportCreated` dispatch a queued `EvaluateAutoflagRules` job (Redis). Rules from `autoflag_rules`: keyword match on title/description, restricted category list, first-N-listing pre-approval, report-count auto-hide. Auto-hide sets `products.status = hidden` and enqueues a moderation item.
- **Visibility contract:** every public query scopes `status = live` (products), `status = live` shops, `status = published` reviews — enforced via model global scopes (`PublishedScope`) so Inertia, API, and Scout sync all agree.
- **Privacy:** `Conversation` content is only readable by moderators through the reported item's detail endpoint, which (a) returns reported messages ± small context window, (b) writes a `moderation_accesses` row. Moderator FormRequests deny everything outside `/admin/moderation/*`.
- **Authorization without policies (D23):** role checks live in `User::hasRole()/isStaff()/isModerator()` helpers + a shared `AuthorizesStaff` trait used by FormRequests; per-endpoint `List*Request/Update*Request` classes per repo convention. Admin-only actions (rules, templates, thresholds, reversing actions) get `admin` role checks in their FormRequests.

## 4. API & mobile readiness (D22)

- **Single brain, two skins:** `Action` classes hold all logic. Web controllers return Inertia; `App\Http\Controllers\Api\V1\*` controllers call the **same Actions** and return `JsonResource`s. No logic duplication.
- **Routes:** `routes/api.php` registered via `withRouting(api:)`; prefix `/api/v1` (route group `api/v1`), named `api.v1.*` so Wayfinder generates typed clients the native app can mirror.
- **Auth:** Sanctum personal access tokens on `api` guard; session auth stays on `web`. Same `User`; abilities map to roles (`buyer`, `seller`, `staff`).
- **Conventions:** API Resources for output, FormRequests for input+authz (shared `authorize()` logic where possible), consistent error envelope `{message, errors, code}`, HTTP status semantics, `429` on throttles.
- **Idempotency:** checkout submit + payment confirm accept `Idempotency-Key` header / `checkouts.idempotency_key` unique column; webhook handler keyed on `payment_webhooks.event id`.
- **Pagination:** cursor pagination (`cursorPaginate`) on feeds (home grid, search, chat list, moderation queue); classic pagination elsewhere.
- **Uploads:** direct-to-disk via presigned upload URLs (`POST /api/v1/uploads` → signed URL → `PUT`); images resized by a queued job (intervention/image) into thumb/card/detail sizes for responsive `srcset`.
- **Realtime:** Laravel Reverb (first-party, D28) broadcasting `MessageSent`, `OrderStatusChanged`, `NotificationSent` on private channels; web uses Laravel Echo; native connects to the same socket. Fallback: 15s polling if Reverb is unavailable.
- **Push (later):** notifications table is the single source; FCM/APNs bridge is a v2 notification channel — no schema change needed.
- **What Inertia doesn't give native:** page rendering and shared props — that's fine, everything a native client needs is data+auth, which `/api/v1` + Sanctum covers. Deep-link-friendly URLs: public resources all have canonical slugs (`/p/{slug}`, `/shop/{slug}`, `/orders/{number}`).
- **Native app framework (OPEN D30 → recommendation):**

    | Option           | Pros                                                      | Cons                                         | Verdict                                                        |
    | ---------------- | --------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------- |
    | **PWA**          | zero new stack; mobile-first web already exists           | limited push/install UX on iOS               | Adopt basics in MVP (manifest, offline shell — Q4 default: v2) |
    | **Capacitor**    | wraps existing React app; reuse ~all UI                   | web-view perf ceiling; store review friction | Cheapest path to an app-store presence                         |
    | **React Native** | native perf; shares TS types + `tokens.json` + API client | new UI codebase                              | **Recommended** when a real app is funded                      |
    | **Flutter**      | native perf, one codebase                                 | shares nothing with our React/TS stack       | Rejected — forfeits all reuse                                  |

    **Recommendation: React Native (Expo)** for the eventual app — reuse `tokens.json`, TS types generated from API Resources, and the Sanctum client. Take **Capacitor** if an app-store listing is needed sooner than a native rewrite justifies. PWA manifest shipped in the foundation milestone regardless.

## 5. Payments (OPEN D20 — integration deferred by owner)

**Model (D8):** buyer pays platform → funds held → delivery confirmed (or auto-confirm after `X` days*) → ledger credits seller net of commission → admin pays out manually.

| Gateway                  | Marketplace support                                                                      | Fit                                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Xendit (xenPlatform)** | Sub-accounts, payment splitting, platform fees, disbursement API, batch payouts          | Strongest marketplace primitive set; heavier onboarding; split-payout = less ledger risk later |
| **PayMongo (Platforms)** | Sub-accounts, API splits, platform fees; escrow-style hold possible; payouts more manual | PH-first, great GCash/Maya coverage, simpler — but payout automation thinner                   |

**Recommendation: Xendit** when integration resumes, behind a `PaymentGateway` contract (`charge()`, `refund()`, `verifyWebhook()`, `payout()`), with PayMongo as the documented fallback implementation. Reasons: disbursement/split APIs match our ledger future; COD needs no gateway anyway. **Risk hedge:** our `payout_ledger` is the source of truth — gateway only collects/settles, so switching cost stays low. This keeps MVP working even if xenPlatform onboarding is delayed (collect-to-platform + manual payout works on either).

> **Owner decision (Phase 4):** the entire payment layer is **deferred** — no gateway SDK, no COD handling in MVP. Orders are placed unpaid (`status = to_pay`) and the `PaymentGateway` contract, `payments`/`payment_webhooks` schema, and `NullPaymentGateway` still ship so the payments milestone can be added later without schema or flow changes. Gateway choice stays **open** — Xendit/xenPlatform vs PayMongo revisited when payments are scheduled.

- **Webhooks:** `POST /webhooks/{gateway}` unauthenticated + signature-verified; raw event stored in `payment_webhooks`, processed by queued job (idempotent on event id). Events: `payment.succeeded/failed`, `refund.*`.
- **MVP (payments deferred):** `PlaceOrder` creates orders directly in `to_pay`; no `payment` row is created until the payments milestone. The order lifecycle (ship → confirm → ledger credit) proceeds on unpaid orders per owner direction.
- **COD (post-MVP):** `payment` row with method `cod`, `status = pending`; marked `paid` when seller confirms delivery; commission still debited from ledger at payout.
- **Refunds (post-MVP):** approved return → gateway `refund()` for online payments → ledger `refund_debit` to the shop; COD refunds as manual payout adjustments.

## 6. Search (resolves OPEN D27)

**Scout + Typesense** (already in Sail). `Product` and `Shop` use `Searchable`; indexed fields: name, description, category, price, rating, sold, location, status (filter `status = live`). Queued sync on model events. Fallback: plain `where like`/Postgres FTS behind the same repository method — swap via config `SCOUT_DRIVER`. Meilisearch rejected: would add a second search service to Sail.

## 7. Frontend / design-system integration (resolves D38 + Q1)

| From `design-system-phase1`            | Into repo                                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------------------------- |
| `tokens/tokens.css` + `src/tokens.css` | `resources/css/tokens.css`, imported by `app.css`; values wired into Tailwind v4 `@theme` |
| `tokens/tokens.json`                   | `resources/js/lib/tokens.json` — shared with future native app                            |
| Manrope woff2 / fontsource             | `@fontsource-variable/manrope` + `@theme --font-sans`; drop bunny `Instrument Sans`       |
| `dist/sprite.svg` / lucide-static      | **skip** — repo already uses `lucide-react`                                               |
| Build scripts, styleguide, brand demo  | **not copied**                                                                            |

- Brand override: `brand.token_overrides` JSON from DB emitted as CSS variables in a `<style>` block / Inertia shared prop — palette swap without component changes (D37).
- `config/inertia.php` `.vue` cleanup, `viewport-fit=cover`, PWA manifest → all in the Phase 4 foundation ticket (Q1, Q4).

## 8. Cross-cutting

- **Queues/events:** Redis queue. Events: `OrderPaid`, `OrderShipped`, `OrderConfirmed`, `ReturnEscalated`, `ReportCreated`, `ProductCreated/Updated`, `MessageSent`. Listeners: notifications, auto-flag eval, search sync, ledger credit.
- **Cache:** Redis; cache shop/category lists + settings + brand config with tags.
- **Storage:** `public` disk MVP → S3-compatible in prod; media variants via queued `intervention/image`.
- **Config defaults (resolves Q3):** `config/marketplace.php` + `settings` table overrides: `first_listings_pending = 3`, `return_window_days = 7`, `auto_confirm_days = 7`, `commission_default_pct = 5`, `report_autohide_threshold = 3`, `chat_context_window = 5`.
- **I18n:** `lang/en/*.php` for server copy; `resources/js/locales/en.json` + tiny `t()` helper for React; no hardcoded strings in new code (D2).
- **Security:** rate limits on checkout/chat/report/search; signed webhook verification; XSS-safe message rendering; `HandleInertiaRequests` switches to a slim `UserResource` (fixes audit C-concern: whole model no longer shared); audit log for all staff actions.
- **DPA (D15):** consent timestamp on registration/newsletter; `POST /settings/data-export` queues an export; account deletion anonymizes orders but keeps ledger/audit integrity.
- **Testing:** Pest feature tests per Action endpoint (web + api parity cases), unit tests for money/commission/state transitions, Dusk/Pest-browser allowed (D24) for the 360/768/1280 critical flows (checkout, product detail, moderation queue).
- **Performance budget:** route-level code splitting via Inertia, `<img loading=lazy>` + srcset, cursor pagination, N+1 guarded by `Model::preventLazyLoading()` in dev, target <150KB JS per storefront route.

## 9. Required additions

| Addition                                                              | Reason                                            | Follows existing pattern          | MVP-critical  |
| --------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------- | ------------- |
| `laravel/sanctum`                                                     | API tokens (D22)                                  | Fortify session auth counterpart  | yes           |
| `laravel/reverb`                                                      | Realtime chat/notifications (D28)                 | first-party broadcast             | yes           |
| `laravel/scout` + `typesense/typesense` + `scout` driver              | Search (D27)                                      | Typesense already in Sail         | yes           |
| `app/Contracts/PaymentGateway` + `NullPaymentGateway`                 | Unpaid checkout now; payment layer later (D8/D20) | deferred per owner                | yes           |
| `xendit/xendit-php` (or thin HTTP client)                             | Online payments milestone                         | **deferred — not installed**      | no (deferred) |
| `intervention/image`                                                  | Responsive media variants                         | —                                 | yes           |
| `@fontsource-variable/manrope`                                        | Font (D34)                                        | replaces bunny font               | yes           |
| `routes/api.php`, `app/Http/Controllers/Api/V1`, `app/Http/Resources` | `/api/v1` surface                                 | mirrors web controller structure  | yes           |
| `app/Actions/<Domain>*`, `app/Http/Requests/*`, `app/Rules`           | Domain logic + authz                              | existing conventions exactly      | yes           |
| `app/Models/*` (~25 models), migrations                               | Domain data                                       | `User` style: `final`, `HasUlids` | yes           |
| `lang/en`, `resources/js/locales`                                     | I18n                                              | `__()` already used               | yes           |
| `config/marketplace.php`, `settings` table                            | Config knobs                                      | config + DB hybrid                | yes           |
| `resources/css/tokens.css`, `resources/js/lib/tokens.json`            | Design tokens                                     | Tailwind v4 `@theme`              | yes           |
| Public scope traits (`PublishedScope`), `AuthorizesStaff` trait       | Visibility + role authz without policies          | FormRequest convention support    | yes           |

No package upgrades; no directories renamed; existing files only extended (User role helpers, `HandleInertiaRequests` shared props, `bootstrap/app.php` api routing).

## 10. Open items carried to Phase 4

- Seller Customers page stays v2 (PRD §4) unless overridden.
- Structured PH region/province/city dataset for addresses: free text in MVP, dataset import flagged as v2 (US-21).
- PWA offline depth (Q4): manifest now, richer offline later.
