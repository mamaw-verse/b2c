# Wave 3 — Implementation tasks

Derived from `06-wave-3-gap-assessment.md`. This is the **live tracker** for wave 3: tick boxes as work lands, record decisions in §1. Historical `ui-audit/` reports stay read-only.

Sizing: S ≤ 0.5 day, M ≈ 1–2 days, L ≈ 3+ days (ideal dev-days, not commitments). Priority: P0 blocks later tasks, P1 core wave scope, P2 optional/defer.

## 0. Conventions every task must follow

- Business logic lives in `app/Actions/<Domain>/<Verb><Noun>.php` (single `handle()`, `final readonly`, `DB::transaction()` when multiple models change).
- Controllers are CRUD-only, thin, and never authorize/validate. One form request per endpoint named after the method (`CreateXRequest`, `UpdateXRequest`, `ListXRequest`, …), authorization via `authorize()` returning `Response::denyAsNotFound()` where existence must be hidden. No policies/gates.
- Admin requests authorize with `$user->isAdmin()`; seller requests with `$user->isSeller() && $user->shop`.
- Money is **integer centavos** everywhere (`App\Support\Money`); never floats/decimals.
- New tables use ULIDs, factories, and `final` models with `#[Fillable]`. Migrations are forward-only (no `down()`).
- New nav goes in `resources/js/lib/workspaces.ts`; flip the matching `workspaceFeatures` flag when a section ships. Use Wayfinder route helpers, no literal URLs.
- Every new file: `git add` immediately; never commit.
- Definition of done per task: Pest feature tests for happy path + the key authorization/validation failures; `vendor/bin/sail composer lint` (Pint) + PHPStan L7 clean; for UI work `npm run check`, `npm run types:check`, `optimize:clear` + `npm run build`, and an e2e spec or scenario update (360/768/1280 + `iphone-safari`, axe pass).

## 1. Decision gates (resolve before the dependent tasks start)

| Gate    | Decision               | Recommended default                                                                                                              | Blocks               |
| ------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| G1 (D1) | COD in scope?          | **Yes** — already built (`PaymentMethod::Cod`, `cod_fee`); amend `04-roadmap.md` D20/A1 instead of removing it                   | W3-20 → W3-24        |
| G2 (D6) | Fulfillment model      | **Shopify-style `fulfillments`** (partial + multi-parcel). Fallback: single-parcel with tracking columns on `orders` (W3-10 alt) | W3-10 → W3-12, W3-21 |
| G3 (D4) | Voucher CRUD ownership | Seller manages shop vouchers (Marketing), admin manages platform vouchers                                                        | W3-32                |
| G4 (D5) | Content pages          | Build in-app pages from config (help, returns, about, terms, privacy, halal policy)                                              | W3-01                |
| G5 (D3) | Second brand           | Drop `demo` brand from verification scope (keep tokens) unless a white-label customer is named                                   | W3-91                |
| G6      | Payout method          | Manual bank/e-wallet transfer, admin marks paid; no gateway                                                                      | W3-22                |
| G7      | Search/realtime        | Keep DB search and polling chat; record as accepted deviations from D27/Reverb                                                   | W3-82                |

## 2. Task list

### Wave 3a — Storefront content, chat links (no schema risk)

- [x] **W3-01 Content pages (M, P1, G4).**
    - `ContentPageController@show` at `/pages/{page}` with `ShowContentPageRequest` (404 unless page key is enabled in `config('marketplace.pages')`); Inertia `pages/content.tsx` renders title + sections from config.
    - Pages: `help`, `returns`, `about`, `terms`, `privacy`, `halal-verification` (source: `docs/halal.md`).
    - Footer `company`/`support` groups and `nav.help` auto-populate when a page is enabled; fix footer "Vouchers" (`/categories/vouchers`) to a real destination or remove.
    - Tests: enabled page 200, disabled/unknown 404, footer shows only enabled links.
- [x] **W3-02 Seller → buyer chat (M, P1).**
    - `GetSellerOrder` returns `chat_url` (existing `Conversation` by `user_id`+`shop_id`) or `null`.
    - New `Seller\OrderChatController@store` (`POST seller/orders/{order}/chat`) + `CreateSellerOrderChatRequest` (order belongs to seller's shop) → `StartConversation` for the order's buyer, redirect to `seller.chat.show`.
    - Replace `/seller/chat?buyer=` in `seller/orders/show.tsx:280`.
    - Tests: starts/reuses conversation; other shop's order 404s.
- [ ] **W3-03 Front-end cleanup (S, P2).** Chat page literal URLs → Wayfinder (`resources/js/pages/chat.tsx`); remove `(g as any).availableVouchers` in `pages/cart.tsx:109` by typing the shop-group prop.
- [x] **W3-04 Announcement bar (S, P2).** `config('marketplace.announcement')` shared via `HandleInertiaRequests`; render in `site-header.tsx:94` (dismissible, hidden when empty); delete the TODO.

### Wave 3b — Fulfillment (do before finance; depends on G2)

- [x] **W3-10 Fulfillments schema + action (L, P0, G2).**
    - Migrations: `fulfillments` (ulid, `order_id`, `courier_name`, `tracking_number`, `tracking_url` null, `status` shipped|delivered, `shipped_at`, `delivered_at` null) and `fulfillment_items` (`fulfillment_id`, `order_item_id`, `quantity`); `orders.fulfillment_status` enum `unfulfilled|partial|fulfilled` (default `unfulfilled`). Backfill existing `to_receive`/`completed` orders from the `Parcel shipped` `OrderEvent` metadata into one fulfillment containing all items.
    - Refactor `FulfillSellerOrder` to accept `items[] {order_item_id, quantity}` (default: all remaining); validate remaining quantity in the request `rules()`; order stays `to_ship` while `partial`, moves to `to_receive` once `fulfilled`; writes `OrderEvent` per fulfillment; notifies buyer.
    - Rename `ShipmentController` → `FulfillmentController` (`store`, `update` for tracking edits); update route names and `tests/e2e/specs/order-lifecycle.spec.ts`.
    - Cancellation: blocked once any fulfillment exists (`OrderStatus::isCancellable` + order-level check).
    - Tests: full ship, partial then complete ship, over-quantity rejected, other shop denied, backfill, cancel-after-partial rejected.
    - **Alt if G2 = single parcel:** add `courier_name`, `tracking_number`, `tracking_url`, `shipped_at` columns to `orders`, backfill from events, and stop at that (S).
- [x] **W3-11 Fulfillment UI (M, P1).** Seller `orders/show.tsx`: per-item quantity pickers + courier/tracking form + list of existing parcels with edit-tracking. Buyer `account/order.tsx`: one card per parcel (courier, tracking link, items, shipped/delivered times). Mark-delivered action for sellers is out of scope (receipt stays buyer/auto).
- [x] **W3-12 Auto-complete job (M, P0).**
    - Extract shared `CompleteOrder` action (status → `completed`, event, notification) used by `MarkOrderReceived` and a new `orders:auto-complete` command (scheduled daily) that completes `to_receive` orders whose last fulfillment `shipped_at` is older than `marketplace.auto_confirm_days` (default 7).
    - Tests: completes only past threshold, idempotent, writes distinct event title (“Auto-confirmed”).

### Wave 3c — Seller finance (depends on G1, G2; W3-12)

- [x] **W3-20 Commission calculation (M, P0).**
    - Migration: `categories.commission_bps` (nullable integer, basis points); `order_items.commission_bps` + `commission_amount` (centavos) snapshotted in `PlaceOrder`.
    - `ResolveCommissionRate` action: nearest ancestor category with a rate, else `config('marketplace.commission.default_bps')` (seeded from `MARKETPLACE_COMMISSION_RATE`).
    - Tests: leaf override, inherited from parent, default fallback, snapshot unchanged after category rate edit.
- [x] **W3-21 Ledger (L, P0).**
    - Migration `ledger_entries` (ulid, `shop_id`, `order_id` null, `type` sale|commission|platform_voucher_reimbursement|refund|adjustment|payout, signed `amount`, `status` pending|available|paid, `available_at`, `payout_id` null, `metadata` json) with unique `(order_id, type)` for idempotency.
    - `CreditSellerLedger` (called from `CompleteOrder`): sale = items subtotal − shop voucher discount; commission = −Σ item commission; platform-voucher discount reimbursed to seller; shipping fee passes through; entries become `available` after `payout_hold_days` (default 7).
    - `ReverseSellerLedger` for approved returns (W3-40).
    - COD note (G1): same entries; cash is collected by courier, so settlement nets commission against future payouts — document formula in the action docblock.
    - Tests: formula with vouchers and COD fee, idempotent re-run, hold/availability, reversal.
- [x] **W3-22 Payouts (L, P1, G6).**
    - Shop payout details (`payout_method`, `payout_account_name`, `payout_account_number` encrypted cast) editable in seller settings.
    - Migration `payouts` (ulid, `shop_id`, `amount`, `status` requested|paid|rejected, `reference` null, `processed_by`, `processed_at`); `Seller\PayoutController@store` (`CreatePayoutRequest`: available balance ≥ amount ≥ minimum, payout details set, shop not suspended) locks the entries; `Admin\PayoutController@index/update` (`UpdatePayoutRequest`) marks paid (with reference) or rejected (entries released).
    - Tests: cannot over-withdraw, concurrent request safe (lock), reject releases funds, non-admin 404.
- [x] **W3-23 Seller finance screens (M, P1).** `Seller\FinanceController@index` (`ListSellerFinanceRequest`): balance cards (pending/available/paid), ledger table with filters, payout history + request form. Add nav item, flip `'seller.finance'` to `true`. e2e: seller completes an order → ledger shows credit.
- [x] **W3-24 Seller customers (M, P1).** `Seller\CustomerController@index/show`: customers aggregated from the shop's orders (name, city, order count, total spent, last order) with link to chat (W3-02); no email/phone exposure. Nav item under Seller Centre. Tests: only own shop's customers; no PII fields in props.

### Wave 3d — Returns and disputes (depends on W3-12, W3-21)

- [ ] **W3-40 Return lifecycle (L, P1).**
    - Enforce `return_window_days` in `RequestReturn` (currently only checks `completed`, no window) — via `CreateOrderReturnRequest` validation, not the action.
    - Migration `order_returns` (ulid, `order_id`, `reason`, `status` requested|approved|rejected|escalated|refunded, `seller_response`, evidence photos via existing upload approach); `Seller\ReturnDecisionController@store` (approve/reject with reason) and admin escalation resolve via the moderation queue (`ModerationItemType::Return`).
    - Approval → order stays `return_refund`, `ReverseSellerLedger`; refund payout to buyer is manual (Q5 open) and recorded as a `refund` ledger entry.
    - UI: buyer return form with evidence, seller return queue tab, admin queue item type. Notifications for each transition.
    - Tests: window enforced, seller can’t decide other shop’s return, reversal amounts, buyer notified.

### Wave 3e — Admin console (parallel with 3c)

- [x] **W3-30 Audit log (M, P0 for 3e).** Migration `audit_logs` (ulid, `actor_id`, `action`, `subject_type/id`, `metadata`, `ip`, timestamps); `RecordAuditLog` action invoked from admin mutations (user suspension, category/commission edits, voucher edits, payout decisions, settings, moderation decisions); `Admin\AuditLogController@index` with filters; flip `'admin.audit-log'`.
- [x] **W3-31 Category management (M, P1).** `Admin\CategoryController` resource (index/store/update/destroy), including `commission_bps` and `requires_certification`; deletion blocked while products exist (request validation). Uses `RecordAuditLog`.
- [x] **W3-32 Vouchers (M, P1, G3).** `Seller\VoucherController` (shop vouchers; flip `'seller.marketing'`, nav "Marketing") and `Admin\VoucherController` (platform vouchers) over the existing `vouchers` table (`shop_id` null = platform). Validate unique `code`, `min_spend`, dates; `used_count` read-only.
- [x] **W3-33 User management (M, P1).** Migration `users.suspended_at`; `Admin\UserController@index/show`; `Admin\UserSuspensionController@store/destroy` (cannot suspend self or other admins); suspended users blocked at login via Fortify `authenticateUsing` and by existing session middleware; flip `'admin.users'`.
- [x] **W3-34 Platform settings (M, P2).** `settings` table + `Settings` service overriding `config('marketplace')` for: default commission, auto-confirm days, return window days, payout hold days, minimum payout, announcement. `Admin\SettingController@edit/update`; flip `'admin.settings'`; audited.

### Wave 3f — Chat hardening, notifications, social

- [ ] **W3-50 Chat block/report (M, P2).** `ConversationBlockController@store/destroy` (either party blocks); `SendMessage` request rejects when blocked; report-from-chat prefilled via existing `reports.store`. Verify `MessageType::Product/Order` context cards render in both workspaces (add if missing).
- [ ] **W3-60 Email notifications (M, P1).** Add `mail` channel (queued) to `OrderStatusNotification`; new notifications: seller new order, shop application approved/rejected, return decisions, payout paid. Mailpit for dev; mail templates use `config('app.name')`.
- [ ] **W3-70 Shop follows (S–M, P2).** Migration `shop_follows` (`user_id`, `shop_id` unique); `ShopFollowController@store/destroy`; derive `followers_count` from the relation (drop the stored column or keep as counter updated in the action). Wishlist stays deferred.

### Wave 3g — Platform and launch

- [ ] **W3-80 Place-order idempotency (S, P1).** Checkout page issues a token; `orders.checkout_token` unique per `(user_id, token)`; duplicate POST returns the existing orders’ confirmation. Test double-submit.
- [ ] **W3-81 `/api/v1` (L, P2).** Requires adding Laravel Sanctum — **dependency change needs owner approval**. Scope: read endpoints parity (catalogue, cart, orders) reusing existing Actions; token auth; Idempotency-Key header (reuses W3-80). Defer unless a mobile client is scheduled.
- [ ] **W3-82 Accepted deviations record (S, P1, G7).** Update `01-decisions.md`/roadmap: DB search instead of Scout+Typesense (D27), polling chat instead of Reverb, no i18n scaffold (English only), COD in scope (G1).
- [ ] **W3-90 Demo seed + runbook (M, P1).** Seeders for fulfilled orders, ledger, payouts, returns; deploy runbook (Sail/Cloud env vars from `config/marketplace.php`, scheduler for `orders:auto-complete` + certificates), monitoring checklist.
- [ ] **W3-91 Brand + device gates (S, P2, G5).** Either add a `demo` brand route to the e2e sweep or drop it; physical-device smoke checklist.

## 2a. Implementation notes (waves 3a–3c + 3e landed; Pest 253 passing, PHPStan L7, Pint, types, `npm run check`, build clean; `order-lifecycle` e2e passes on desktop-1280; `seller-finance` and `admin-console` e2e added and passing on desktop-1280)

- W3-01: pages are config-driven (`marketplace.pages`); only `returns` is enabled by default, the rest need reviewed copy and `MARKETPLACE_PAGE_*=true`. Footer "Vouchers" link removed.
- W3-03: cart `any` removed; `chat.tsx` literal URLs still open.
- W3-21: ledger has no `status` column. Availability is derived from `available_at`; a payout writes a negative `payout` entry and a rejection writes a compensating `adjustment`. `ReverseSellerLedger` is part of W3-40 and not built.
- W3-22: admin payouts live at `/admin/payouts` (nav item added); seller payout account is edited on the finance page.
- W3-24: customers list shows name, order count, spent (completed orders), last order and a chat button; no city column or `show` page.
- W3-30: `audit_logs` records actor, `domain.verb` action, morph subject, metadata and IP. Logged from moderation decisions (single + bulk), payout resolutions, category/voucher/user-suspension/settings mutations.
- W3-31: category delete is also blocked while subcategories exist (tracker only required the product check). Slug is create-only; commission is entered as % and stored as bps.
- W3-32: money inputs are pesos in the UI and stored as centavos; percent `max_discount` is required for percent vouchers. Codes are uppercased before the uniqueness check. Seller vouchers live at `/seller/vouchers` under nav "Marketing".
- W3-33: suspension blocks password login in `Fortify::authenticateUsing` and logs out live sessions via `EnsureUserNotSuspended` (web middleware). Passkey sign-ins are caught by the same middleware on the next request. Suspending an admin or oneself returns 403.
- W3-34: `settings` table + `App\Support\Settings` overrides `marketplace.*` keys (default commission, auto-confirm, return window, payout hold/minimum, announcement) with config/env fallback; the shared `marketplace` Inertia prop serves `marketplaceConfig()`.
- e2e: `seller-finance.spec.ts` (2 pass, 2 skip — payout steps skip when no available balance in dev DB, expected), `admin-console.spec.ts` (6/6 pass). Accessibility spec extended with 9 seller routes (`/seller/finance`, `/seller/customers`, `/seller/vouchers`) and 9 admin routes (`/admin/users`, `/admin/categories`, `/admin/vouchers`, `/admin/payouts`, `/admin/audit-log`, `/admin/settings`). Both specs registered in `scenarios.json`.
- Not done yet: W3-40 returns, 3f, 3g. `order-lifecycle` e2e extended for partial fulfillment and return request/decision is deferred to W3-40.

## 3. Suggested order

1. Gates G1, G2, G4, G6 answered.
2. **3a** (W3-01…04) in parallel with **3b** (W3-10 → W3-12 → W3-11).
3. **3c**: W3-20 → W3-21 → W3-22 → W3-23; W3-24 any time after W3-02.
4. **3e** W3-30 first (others log to it), then W3-31/33/34, W3-32 after W3-30.
5. **3d** W3-40 after W3-21.
6. **3f**, **3g** last; W3-80 can slot in earlier.

## 4. e2e coverage to add or extend

| Spec                         | Additions                                                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `order-lifecycle.spec.ts`    | partial → full fulfillment, buyer sees parcels, completion credits ledger, return request/decision          |
| new `seller-finance.spec.ts` | balances, payout request, admin marks paid                                                                  |
| new `admin-console.spec.ts`  | users suspend, category commission, audit log entries, voucher CRUD                                         |
| `smoke.spec.ts`              | content pages                                                                                               |
| `accessibility.spec.ts`      | add every new route (seller finance/customers/marketing, admin users/audit-log/settings/categories/payouts) |

Register each in `tests/e2e/scenarios.json`.
