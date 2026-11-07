# Phase 4 — Roadmap

Sequenced delivery plan for the multi-vendor marketplace. All decisions trace to `00-repo-audit.md` (C-findings), `01-decisions.md` (D#), `02-prd.md` (US#, pages) and `03-architecture.md` (§schema/flows).

**Owner amendments:** (1) the entire payment layer is **deferred** — no gateway, no COD in MVP; orders are placed unpaid (`to_pay`) and the `PaymentGateway` contract, `payments`/`payment_webhooks`/`payout_ledger` schema, and `NullPaymentGateway` still ship so payments slot in later without schema changes. Gateway choice stays open (Xendit vs PayMongo). (2) Seller **Customers** page is in **v1** (M3). (3) Commission override is **category-level only** for now. (4) **Login required to add to cart** — no guest cart. (5) AI tools: configure **Kiro, Antigravity, OpenCode** in M0.

## 1. Milestones

Estimates are ideal dev-days for a team of 1–3 (ranges, not commitments). Dependencies shown per milestone.

| #   | Milestone                                    | Scope (PRD US#)                                                                                                    | Est. (dev-days) | Depends on    |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------- | ------------- |
| M0  | Foundation + theme + responsive shell        | Tokens, Manrope, i18n, roles, `config/marketplace.php`, shells, PWA manifest, AI tools (Kiro/Antigravity/OpenCode) | 5–8             | —             |
| M1  | Catalog + seller basics                      | Categories, products/variants, shop onboarding, listing approval, search                                           | 10–15           | M0            |
| M2  | Cart + checkout (unpaid)                     | Auth-required cart, addresses, checkout, per-shop order split, `to_pay` orders, tracking                           | 8–12            | M1            |
| M3  | Orders + seller center                       | Order lifecycle, seller fulfill/ship, customers page, ledger, category commission, manual payout admin             | 10–14           | M2            |
| M4  | Chat                                         | Buyer↔seller threads, product/order cards, report/block, Reverb                                                    | 6–9             | M1, M3        |
| M5  | Moderation console                           | Queue, detail, actions, reason templates, auto-flags, audit log, dashboard                                         | 8–12            | M1–M4 (items) |
| M6  | Reviews + vouchers + notifications + returns | Verified reviews, basic vouchers, in-app + email notifications, returns/disputes                                   | 8–12            | M3, M5        |
| M7  | API hardening + mobile readiness             | `/api/v1` parity sweep, Sanctum polish, idempotency, uploads, perf pass                                            | 6–9             | all above     |
| M8  | Launch                                       | Seed/demo data, white-label config, deploy (Cloud/Sail), monitoring, runbook                                       | 3–5             | M7            |

**Deferred milestones (post-MVP):** the whole payment layer — gateway (Xendit/PayMongo, still open) + COD handling + refunds — behind the contract; courier APIs, automated payouts, multi-language UI, per-shop commission override, seller appeals, ML moderation, native app (React Native/Expo), PWA offline depth.

**Total MVP (M0–M8):** ~64–96 dev-days ≈ **4.5–7 months solo, ~2–2.5 months at 3 devs**.

## 2. Critical path & sequencing notes

- **M0 gates everything** — tokens/shell/roles/i18n are prerequisites for every page.
- **M1 → M2 → M3** is the critical path (catalog → checkout → fulfillment). M4 chat and M6 reviews can parallelize after M1/M3 respectively.
- **M5 moderation** needs item sources (products from M1, reports from M4/M6) — build the queue skeleton early, wire reporters as they land.
- **Schema for deferred payments ships in M2/M3** (`payments`, `payment_webhooks`, `payout_ledger`) — cheap now, painful to retrofit.
- Every milestone ends with the **360/768/1280 verification pass** for its pages plus `vp check`, `tsc`, `phpstan`, Pest green.

## 3. First 10 implementation tickets

Each ticket lists what it extends and its definition of done (DoD). Every DoD includes: `vp check`, `tsc --noEmit`, `phpstan` L7, Pest green; page tickets add the three-width check.

| #   | Ticket                                                                                                                                                                                                                        | Extends / adds                                                                                                                | DoD                                                                                                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T1  | **Design tokens + Manrope port** — import `tokens.css`/`tokens.json` from `design-system-phase1`, wire into `@theme`, swap Instrument Sans → Manrope, status + moderation tokens                                              | `resources/css/app.css`; adds `resources/css/tokens.css`, `resources/js/lib/tokens.json`, `@fontsource-variable/manrope`      | Tokens resolve in `@theme`; Manrope renders; AA contrast spot-check on muted small text; no template CDN/assets                                                          |
| T2  | **Roles + staff authz + slim shared props** — `role` enum on `users`, `AuthorizesStaff` trait, role helpers; `HandleInertiaRequests` shares `UserResource` not the model                                                      | `users` migration, `app/Models/User.php`; adds `app/Http/Resources/UserResource.php`, `app/Concerns/AuthorizesStaff.php`      | buyer/seller/moderator/admin helpers; FormRequests authorize via trait; no whole-model prop leak; Pest role tests                                                        |
| T3  | **Marketplace config + settings + i18n scaffold** — `config/marketplace.php` defaults, `settings` table, `lang/en`, `resources/js/locales/en.json` + `t()` helper                                                             | adds config, migration, `resources/js/lib/i18n.ts`                                                                            | All defaults from Phase 3 §8 readable + overridable; no hardcoded copy in new code; `t()` works in React                                                                 |
| T4  | **Responsive shells + PWA manifest** — public header + bottom tab bar, account/seller/admin drawer→rail→sidebar shells; `manifest.webmanifest`, `viewport-fit=cover`, `config/inertia.php` `.vue` cleanup                     | `resources/js/layouts/*`, `app.blade.php`; adds `BottomTabBar`, `StickyActionBar`, `BottomSheet`, `manifest`                  | Nav correct at 360/768/1280 (bottom bar phone, full header desktop); 44px targets; safe-area; manifest served; skeleton/toast primitives in place                        |
| T5  | **Categories + catalog schema** — `categories` (nested), `shops`, `products`, `product_variants`, `product_images`, `wishlists`, `follows` migrations + models; admin category CRUD                                           | adds ~7 migrations + models (`final`, `HasUlids`, `PublishedScope`)                                                           | Nested categories seedable; ULIDs; visibility scope excludes non-live; category admin CRUD at 3 widths                                                                   |
| T6  | **Seller onboarding + product listing flow** — `shops` application → review → live; product create/edit form (photos, variations, stock); first-N-pending rule                                                                | `app/Actions/Seller/*`, FormRequests, React seller pages; extends T5 models                                                   | Apply → pending → approve → shop live; first `first_listings_pending` products held; listing form works one-handed at 360; Feature tests for the flow                    |
| T7  | **Storefront browse + search** — home (banner, category grid, voucher strip, recommended grid), category/products listing, product detail w/ variation bottom-sheet; Scout+Typesense                                          | adds `Searchable` models, Scout config, storefront React pages, `SearchProducts` action                                       | Infinite feed cursor-paginated; 2/3/4-col grid by tier; search + filters in bottom sheet on phone; `SCOUT_DRIVER` fallback to DB works                                   |
| T8  | **Cart + checkout + order split (unpaid)** — `carts`/`cart_items`, `addresses`, `orders`/`order_items`, `checkouts`; `PlaceOrder` action (transactional, splits per shop, creates `to_pay` orders); add-to-cart requires auth | adds schema + `app/Actions/Checkout/PlaceOrder.php`, FormRequests, cart/checkout React pages, `NullPaymentGateway` + contract | 3-shop cart → 3 `to_pay` orders under one checkout; guest redirected to login on add-to-cart; idempotent place-order; optimistic add-to-cart; sticky checkout bar at 360 |
| T9  | **Order lifecycle + seller fulfillment** — order status tabs (To Pay…Return-Refund), seller orders list/detail, mark-shipped w/ tracking, buyer confirm-received → ledger credit                                              | adds `app/Actions/Orders/*`, `payout_ledger`, commission calc, seller/buyer React order pages                                 | Full state machine enforced; confirm (and auto-confirm job) credits ledger net of commission; seller ships w/ tracking; per-state action buttons; tests                  |
| T10 | **Moderation schema + queue skeleton** — `moderation_items`, `moderation_actions`, `reason_templates`, `autoflag_rules`, `audit_log`, `moderation_accesses`; queue list/detail UI shell + reporter endpoints                  | adds schema + `app/Actions/Moderation/*`, queue React pages, `EvaluateAutoflagRules` job                                      | Polymorphic queue lists items w/ type/status/age; assign-to-self; approve/reject records immutable action + audit row; reported-chat access logged                       |

Tickets T11+ (chat, reviews, vouchers, notifications, returns UI, payouts admin, API sweep, launch) get detailed in the next planning pass once M0–M3 land.

## 4. Testing & verification strategy

- **Per ticket:** Pest feature tests for each Action endpoint (web + API parity), unit tests for money/commission/state transitions; `vp check`, `tsc`, `phpstan` L7 green.
- **Responsive (browser tests allowed, D24):** automated 360/768/1280 checks on the critical flows — checkout, product detail, moderation queue, cart. Other pages via a manual width-checklist in DoD.
- **Idempotency:** place-order and webhook handlers tested for duplicate submission.
- **Pre-launch (M8):** seed realistic PH demo data, verify white-label config end-to-end (name/logo/colors/copy/emails), load spot-check on a mid-range profile, DPA export/delete flow exercised.

## 5. Risks on the path

| Risk                                                     | Mitigation                                                                  |
| -------------------------------------------------------- | --------------------------------------------------------------------------- |
| Deferred payments: unpaid checkout may disappoint buyers | Contract + schema ready; payment milestone is drop-in                       |
| Typesense sync drift vs DB                               | Fallback driver behind same method; queued reindex; count-reconcile command |
| Reverb ops burden                                        | Polling fallback on chat; Reverb is swappable via `BROADCAST_DRIVER`        |
| ULID/scope regressions                                   | `PublishedScope` enforced at model level; `preventLazyLoading` in dev       |
| Scope creep into v2 items                                | v2 list is explicit; anything not in M0–M8 requires owner sign-off          |
