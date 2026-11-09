# Wave 3 — Gap assessment and open deliverables

Assessment date: 2026-11-09. Baseline: `main` @ `388ef3e` (wave 2 stabilization verified: 163 Pest tests, PHPStan L7, e2e 114 pass across Chromium/Firefox/WebKit + `iphone-safari`).

This document inventories what is **missing, stubbed, or undecided** relative to `04-roadmap.md` (M0–M8). It is a scoping input for the next implementation wave, not a ticket list. Sources: roadmap, `05-wave-2-next-milestone.md`, `dead-links.md`, route/controller/action listing, `workspaces.ts` feature flags.

## Status snapshot vs roadmap

| Milestone | Scope                                          | Status                                                                                                                                                |
| --------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0        | Foundation, tokens, shells, i18n, PWA manifest | Largely done; announcement bar still a TODO (`site-header.tsx:94`); **i18n scaffold absent** (no `lang/`, no `resources/js/locales`, no `t()` helper) |
| M1        | Catalog + seller basics                        | Done: categories, products/variations, shop onboarding, listing moderation, search (DB-backed)                                                        |
| M2        | Cart + checkout                                | Done incl. vouchers at checkout, per-shop split, stock revalidation                                                                                   |
| M3        | Orders + seller center                         | Orders/fulfillment done; **customers page, commission, payout ledger, finance screens missing**                                                       |
| M4        | Chat                                           | Core chat done; **report/block, product/order context cards, realtime delivery unverified**                                                           |
| M5        | Moderation                                     | Queue + decisions done; **reason templates, autoflag config UI, audit log viewer missing**                                                            |
| M6        | Reviews + vouchers + notifications + returns   | Reviews, vouchers (redeem side), in-app notifications, return request done; **seller voucher CRUD, dispute handling, returns admin missing**          |
| M7        | API hardening                                  | **Not started** — no `routes/api.php`, no `/api/v1`, no Sanctum token surface                                                                         |
| M8        | Launch                                         | **Not started** — demo seed, white-label verification, deploy, runbook                                                                                |

## A. Product decisions blocking scope

| #   | Question                                                                                                                                                           | Needed by                                                  | Current state                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| D1  | COD scope: roadmap (D20/A1) defers all payment collection incl. COD; the app implements `PaymentMethod::Cod` + `cod_fee`                                           | Seller finance/payouts                                     | **Owner sign-off required** — reconcile `04-roadmap.md` vs implementation before designing commission settlement |
| D2  | Payment gateway (Xendit vs PayMongo) + refund method                                                                                                               | Post-MVP payment layer                                     | Still open (Q1/Q5); `payments` table + `Payment` model exist, gateway contract status unverified                 |
| D3  | Two-brand sweep: `data-brand="demo"` tokens exist but no live route exercises them                                                                                 | White-label / M8                                           | Decide: build a demo-brand route or drop the second brand                                                        |
| D4  | Seller voucher management: vouchers are redeemable (cart/checkout, platform + shop `voucher_id`) but there is no seller/admin UI to create them — seeded data only | Seller marketing                                           | Decide whether voucher CRUD is in seller Marketing scope or admin                                                |
| D5  | Guest-facing content pages (help, legal, returns policy, `/sell` landing): build pages vs config-driven links vs hide links                                        | Dead-link cleanup                                          | Decide per `dead-links.md`                                                                                       |
| D6  | Fulfillment model: keep single-parcel status flip (Shopee-style) vs introduce a `fulfillments` schema (Shopify-style, partial/multi-shipment)                      | Seller finance — ledger crediting keys off delivered state | Currently single-parcel only; see §B Fulfillment                                                                 |

## B. Missing features by domain

### Seller operations & finance (recommended next milestone)

- **Customers page** — owner-mandated for v1 (A3); no route, action, or page exists.
- **Category-level commission** — no commission column/calculation anywhere; needed before any ledger.
- **Payout ledger** — `payout_ledger` table from the roadmap schema was **not** created (no migration); confirm-received does not credit a ledger.
- **Finance screens** — `seller.finance` flag is `false`; no routes.
- **Marketing screens** — `seller.marketing` flag is `false`; intended home for voucher CRUD (D4).
- **Auto-confirm receipt job** — `auto_confirm=7d` config default exists (A2) but no scheduled job advances `to_receive` orders; only `moderation:flag-expiring-certificates` is scheduled.
- **Seller-initiated chat** — `chat.store` is buyer-workspace only; seller order "Chat with buyer" cannot start a conversation (see C3).

### Fulfillment model — not Shopify-style

The app has **no fulfillment entity**. `FulfillSellerOrder` flips `orders.status` to `to_receive` and records courier/tracking only inside an `OrderEvent` `metadata` JSON blob — there is no `shipments`/`fulfillments` table, and `orders` has no tracking columns. Consequences vs a Shopify-like flow:

- **No partial fulfillment** — cannot ship a subset of `order_items`; one order = one parcel = one status.
- **No multiple shipments** — a second courier/tracking call on the same order is impossible (`CreateSellerShipmentRequest` requires `ToShip`, which is consumed by the first ship).
- **No separate fulfillment status** — fulfillment state is conflated with `orders.status` (`to_ship` → `to_receive`); no unfulfilled/partially-fulfilled/fulfilled axis.
- **No first-class tracking** — `courier_name`/`tracking_number` live in event metadata, so they are not queryable, editable, or surfaced as structured data to the buyer; no delivery-status updates or carrier webhook hook point.
- **No fulfillment service abstraction** — courier is a free-text field; `shipping_options` covers buyer-selected shipping, not the outbound carrier.

If Shopify-like fulfillment is wanted later, that means a `fulfillments`/`shipment_items` schema (order → many fulfillments → many items + quantity), a `fulfillment_status` on orders, and tracking as columns — a schema change, so decide before the finance wave (ledger crediting keys off delivered state).

### Admin console

- **Users management** — `admin.users` disabled; no user list/role/suspend surface. Admin cannot manage buyers/sellers.
- **Audit log viewer** — `admin.audit-log` disabled; `ModerationEvent` rows exist but no UI.
- **Platform settings** — `admin.settings` disabled; `settings` table/`config('marketplace')` defaults (A2) have no editing surface.
- **Category CRUD** — T5 promised admin category management; no `Admin/CategoryController` exists. Categories are seeder-only.
- **Voucher management** — no admin voucher CRUD (related to D4).
- **Returns/disputes console** — `OrderReturnController` records a buyer request; no admin/seller resolution flow, no dispute states.

### Storefront & buyer

- **Content pages** — header/footer links are now config-driven (`config/marketplace.php` `nav`/`footer`) and hide when unset, so no `href="#"` remains. Still missing: the destination pages themselves (help, returns policy, about/terms/privacy, halal verification policy) — `nav.help` and `footer.company`/`trust` are empty until pages or URLs exist. Footer "Vouchers" points at `/categories/vouchers`, which has no backing route/category unless seeded.
- **Announcement bar** — `site-header.tsx:94` TODO, not wired to backend.
- **Wishlist / shop follows** — `wishlists`/`follows` tables were never migrated; `shops.followers_count` is a plain column with no follow action behind it, so the number displayed is not backed by data.
- **Halal verification policy page** — content exists in `docs/halal.md`; no public page.
- **Email notifications** — only `OrderStatusNotification` exists; no mail for registration, application decisions, chat activity, etc. (A9 says Mailpit is fine — just not built).
- **Review moderation** — `ModerationItemType` coverage of reviews unverified; no report→review takedown path confirmed.

### Chat

- **Report/block in chat** — `Report` model + `reports.store` exist; block-user behavior and chat-context report UX unimplemented/unclear.
- **Realtime** — no Reverb/Echo in `composer.json`/`package.json`; chat is polling. Roadmap allows the polling fallback, but a decision should be recorded.
- **Wayfinder migration** — verify `pages/chat.tsx` literal URLs (`dead-links.md` §cleanup); chat routes moved under `/account/chat` and `/seller/chat`.

### Platform / cross-cutting

- **Public API (`/api/v1`)** — no `routes/api.php`; only `/api/psgc/*` address lookups exist. Entire M7 surface (Sanctum tokens, idempotency keys, upload policy) is unbuilt.
- **Idempotency** — `PlaceOrder` revalidates stock but no idempotency-key handling; roadmap T8 DoD called for idempotent place-order.
- **Structured PH addresses** — PSGC region/province/city/barangay tables + API exist (done beyond A5 free-text); verify checkout actually uses them end-to-end.
- **Payment layer** — deferred per D20; `payments` migration exists, but `payment_webhooks` and `payout_ledger` migrations do not (roadmap said schema should ship early).
- **Typesense/Scout** — not installed (`laravel/scout` absent from `composer.json`); search is DB-only. Roadmap D27 is unmet; decide keep-DB vs add Scout.
- **PWA depth** — manifest only per A8; confirm manifest is actually served.

## C. Known defects / cleanup

1. `seller/orders/show.tsx:280` — `/seller/chat?buyer=` param is ignored by the chat index; expose `conversation_id`/`chat_url` from `GetSellerOrder`, decide no-conversation behavior (seller cannot start conversations: `chat.store` is buyer-only).
2. `pages/chat.tsx` — literal URLs → Wayfinder.
3. `resources/js/pages/cart.tsx:109` — `(g as any).availableVouchers` cast; tighten typing.
4. Footer `/categories/vouchers` link has no backing route unless seeded.
5. COD/roadmap reconciliation (D1) — docs currently contradict the implementation.

## D. Suggested wave-3 packaging

Expanded into implementable tasks (IDs `W3-xx`, acceptance criteria, gates) in `07-wave-3-implementation-tasks.md`, which is the live tracker.

| Wave | Contents                                                                                                             | Blocked by   |
| ---- | -------------------------------------------------------------------------------------------------------------------- | ------------ |
| 3a   | Dead-link cleanup + D5 content decisions (help/legal/`/sell`), chat link fixes, announcement bar                     | D5           |
| 3b   | Seller Operations & Finance: customers page, category commission, `payout_ledger`, finance screens, auto-confirm job | D1           |
| 3c   | Admin: users, audit log viewer, settings, category CRUD, voucher management (with D4)                                | D4           |
| 3d   | Chat hardening: report/block, context cards, seller-initiated conversations, Reverb-or-polling decision              | —            |
| 3e   | Returns/disputes flow (seller + admin resolution)                                                                    | —            |
| 3f   | `/api/v1` + Sanctum + idempotency sweep (M7)                                                                         | 3b–3e mostly |
| 3g   | Launch (M8): demo seed, brand decision (D3), deploy, monitoring, runbook                                             | all above    |

## E. Verification gates still open

- Physical-device checks remain manual (no device lab).
- `demo` brand has no live route (D3).
- i18n `t()` helper / `lang/en` usage not audited in this pass — confirm no hardcoded copy per T3 DoD.
