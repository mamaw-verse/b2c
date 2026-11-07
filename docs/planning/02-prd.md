# 02 — Product Requirements Document

White-label multi-vendor marketplace for the Philippines. Mobile-first web app; backend reusable by a future native app. All decisions referenced by ID from `01-decisions.md`.

## 1. Goals

- Let Filipino buyers browse, search, buy, pay (online or COD), chat with sellers, track orders, and review purchases — in flows they already know from Shopee.
- Let approved sellers run a shop: list products with variations, fulfill orders, set shipping, chat with buyers, receive payouts minus commission.
- Let moderators and admins keep the marketplace safe through a unified moderation queue, configurable auto-flagging, and an immutable audit trail.
- Keep the product white-label: brand name, logo, colors, copy, and emails come from config/DB and CSS variables; no brand hardcoded anywhere.
- Ship an API-ready backend so a native app later needs no rewrite.

## 2. Non-goals (MVP)

- Subscriptions, listing/insertion fees, advertising/sponsored listings.
- Flash sales and campaign modules (v2).
- Courier API booking/label printing; seller ships manually with a tracking number.
- Automated payouts (manual payout process in MVP; ledger exists).
- Multi-language UI (English only) — but all copy lives in translation files from day one.
- Multi-tenancy (one brand per deployment) — schema must not block it.
- Native app (v2); seller-to-seller or buyer-to-buyer chat; ML moderation; seller appeals (v2).
- Social login / phone OTP (v2, unless trivially free via Fortify).

## 3. Personas

| Persona   | Who                                       | Core jobs                                                                                                                                         |
| --------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guest     | Unauthenticated shopper                   | Browse, search, view products/shops; must register to cart/checkout/chat                                                                          |
| Buyer     | Registered shopper (may also be a seller) | Cart, checkout, pay/COD, track, confirm receipt, review, return, chat, save addresses, wishlist, "Start selling"                                  |
| Seller    | Approved shop owner                       | List products w/ variations + stock, process orders, set shipping fee, mark shipped, chat, see earnings, shop settings                            |
| Moderator | Staff, queue-only permissions             | Work the moderation queue: applications, flagged/reported listings, reviews, chat reports, disputes                                               |
| Admin     | Staff, full permissions                   | Everything a moderator can do + settings, commission config, payouts, roles, badges, reason templates, auto-flag rules, reverse moderator actions |

One account can hold buyer + seller capability simultaneously (D4).

## 4. Page inventory — status & scope

Visual template reference: see `docs/design-system/styleguide/` for the design system styleguide and `docs/design-system/src/tokens.css` for design tokens (phase 1 asset package committed at `docs/design-system/`). **Repo state** column reflects today's codebase (auth/settings/dashboard only).

### Public storefront

| Page                                               | Source   | Scope                              | Repo state |
| -------------------------------------------------- | -------- | ---------------------------------- | ---------- |
| Home                                               | template | MVP                                | missing    |
| Products (browse/all)                              | template | MVP                                | missing    |
| Product detail                                     | template | MVP                                | missing    |
| Categories index                                   | template | MVP                                | missing    |
| Category page                                      | template | MVP                                | missing    |
| Shops index                                        | template | MVP                                | missing    |
| Shop profile                                       | template | MVP                                | missing    |
| Search results (suggestions, recent, filters/sort) | addition | MVP                                | missing    |
| Cart                                               | template | MVP                                | missing    |
| Checkout                                           | template | MVP                                | missing    |
| Chat (buyer view)                                  | template | MVP                                | missing    |
| Notifications                                      | addition | MVP                                | missing    |
| Wishlist / followed shops                          | addition | MVP (basic)                        | missing    |
| Vouchers                                           | addition | MVP (basic: fixed/% off, per-shop) | missing    |
| Report-content flow (product, review, chat, shop)  | addition | MVP                                | missing    |
| Flash-sale/campaign blocks                         | —        | v2                                 | —          |

### Buyer account

| Page                        | Source   | Scope | Repo state                                              |
| --------------------------- | -------- | ----- | ------------------------------------------------------- |
| Dashboard                   | template | MVP   | `dashboard` exists as placeholder — rebuild             |
| Orders (status tabs)        | template | MVP   | missing                                                 |
| Order detail w/ tracking    | addition | MVP   | missing                                                 |
| Return/refund request       | addition | MVP   | missing                                                 |
| Write review                | addition | MVP   | missing                                                 |
| Addresses                   | template | MVP   | missing                                                 |
| Settings                    | template | MVP   | partially exists (profile/security/appearance) — extend |
| Start selling (application) | template | MVP   | missing                                                 |

### Seller center

| Page                                                | Source   | Scope                  | Repo state                                         |
| --------------------------------------------------- | -------- | ---------------------- | -------------------------------------------------- |
| Dashboard (orders to ship, low stock, unread chats) | template | MVP                    | missing                                            |
| Orders                                              | template | MVP                    | missing                                            |
| Products (list + fast listing form)                 | template | MVP                    | missing                                            |
| Messages                                            | template | MVP                    | missing                                            |
| Customers                                           | template | v2                     | missing — cut from MVP (order history covers need) |
| Shop settings                                       | template | MVP                    | missing                                            |
| Earnings / payout statement                         | implicit | MVP (read-only ledger) | missing                                            |

### Admin & moderation console

| Page                                                        | Source   | Scope | Repo state                                   |
| ----------------------------------------------------------- | -------- | ----- | -------------------------------------------- |
| Admin dashboard (queue stats, time-to-resolve, top reasons) | addition | MVP   | missing                                      |
| Moderation queue + item detail                              | addition | MVP   | missing                                      |
| Seller applications list/detail                             | addition | MVP   | missing (part of queue, plus dedicated view) |
| User/shop management (suspend/restore)                      | addition | MVP   | missing                                      |
| Reason templates + auto-flag rules                          | addition | MVP   | missing                                      |
| Payouts (manual release/mark-paid)                          | addition | MVP   | missing                                      |
| Audit log                                                   | addition | MVP   | missing                                      |
| Commission & marketplace settings                           | addition | MVP   | missing                                      |

## 5. Core flows & user stories

Acceptance criteria abbreviations: **P** = phone 360–639px, **T** = tablet 640–1023px, **D** = desktop 1024px+. Every story is verified at 360/768/1280px (D17). All copy via translation files (D2).

### 5.1 Browse & discovery

- **US-1** As a guest/buyer I browse home (banner carousel, category grid, voucher strip, infinite recommended grid).
    - P: bottom tab bar visible; sticky top search; grid 2 cols; banner swipable; infinite scroll loads next page without jank.
    - T: grid 3 cols; bottom bar or rail nav. D: full header+nav, no bottom bar; grid 4–5 cols; max-width 1240px container.
- **US-2** As a guest/buyer I search with suggestions and recent searches, then filter/sort results.
    - P: search input focused view w/ recent+suggestions; filters in bottom sheet; empty/no-results state with suggestions.
    - T/D: filters inline or side panel.
- **US-3** As a shopper I open a product detail: gallery, price, variations, stock, shop card, ratings w/ photos, description, similar products.
    - P: swipeable gallery; variation picker in bottom sheet; sticky bar Chat | Add to cart | Buy now (44px targets).
    - T/D: gallery + info side by side; actions inline.
- **US-4** As a shopper I view a shop profile: logo, rating, followers, response rate, Chat button; tabs Home/All products/Categories.
- **US-5** As a shopper I follow a shop / wishlist a product and find them in account.

### 5.2 Cart & checkout

- **US-6** As a buyer I manage a cart grouped by shop: per-item/shop/all checkboxes, quantity stepper, per-shop voucher entry.
    - P: sticky total + Checkout bar; stepper ≥44px. T/D: same grouping in table-like layout.
- **US-7** As a buyer I check out on one page: address picker, items per shop, per-shop shipping + note, voucher, payment method (gateway or COD), itemized breakdown.
    - Cart with N shops → N orders under one checkout (D10). Idempotent submit — no double orders on retry/tap.
    - P: sticky "Place order" bar.
- **US-8** As a buyer I pay online (e-wallet/card via gateway redirect/SDK) or choose COD; I see clear pending/failed/success states.
    - Failed/cancelled gateway return leaves orders payable again, not duplicated.

### 5.3 Post-purchase

- **US-9** As a buyer I see My Orders with tabs To Pay / To Ship / To Receive / Completed / Cancelled / Return-Refund; one clear action per state (Pay now, Track, Confirm received, Rate, Buy again).
- **US-10** As a buyer I confirm receipt → funds released to seller ledger minus commission (D8). Auto-confirm after configurable days if no dispute.
- **US-11** As a buyer I request return/refund within the configured window w/ reason + photos; seller resolves; if unresolved it escalates to moderation as a dispute (D13).
- **US-12** As a buyer I review only completed, delivered orders: stars + text + photos; one review per purchased item (D12).
- **US-13** As a buyer I get notifications (order events, chat, promo/moderation outcomes) in a notifications page; unread badge on tab bar.

### 5.4 Chat

- **US-14** As a buyer/seller I exchange text + images and product/order cards in a thread; I can report or block (D11).
    - P: list screen → thread screen. T/D: 300px list + thread split.
    - Realtime delivery; optimistic send; image upload w/ progress.
- **US-15** As a buyer I start a chat from product detail or shop ("Chat now") with the product attached as a card.

### 5.5 Seller

- **US-16** As a buyer I apply via "Start selling" (shop info + documents); status visible (pending/approved/rejected w/ reason); shop goes live on approval (D5).
- **US-17** As a seller I list a product fast: photos first, title, category, price, variations w/ per-variant SKU/stock/price, shipping fee.
    - First N listings hold for approval (config, D7); approved seller listings publish immediately.
- **US-18** As a seller I process orders: confirm, mark shipped w/ courier name + tracking number; see earnings per order after commission.
- **US-19** As a seller I manage shop settings (logo, banner, description, pickup address, shipping defaults) and see the pending-badge state until verified (D6).
- **US-20** As a seller I see a dashboard: orders to ship count, low-stock SKUs, unread chats, today's sales.

### 5.6 Addresses & account

- **US-21** As a buyer I save multiple addresses w/ default flag (D9); validated PH-style fields (region/province/city/barangay as structured data or free text — decided in Phase 3).
- **US-22** Existing settings (profile, security/2FA/passkeys, appearance) keep working; extended, not rebuilt.

## 6. Admin moderation console (MVP, first-class)

### 6.1 Unified queue

- Item types: seller applications, product listings (pending approval, auto-flagged, reported), reviews (reported), chat reports, user/shop reports, return/refund disputes.
- Filters: type, status (New / In review / Resolved), priority, age/SLA, assignee; search; per-type counts.
    - P: card list (type, age, reporter, status chip). T/D: master-detail (list + detail pane).

### 6.2 Item detail & actions

- Full decision context: content preview (product page, review text/photos, reported chat messages + limited surrounding context, seller/buyer history, past reports/actions, reason counts).
- Actions: approve, reject (reason required — template + free text), request changes, hide/unpublish, warn, suspend/ban user or shop, restore, escalate to admin, assign to self. Bulk actions on T/D.
- Every action: notify affected user w/ reason, write immutable audit record (who/when/what/why), update visibility immediately.

### 6.3 Permissions & auto-flagging

- Moderators: queue only. Admins: + rules, reason templates, thresholds, review/reverse moderator actions (D4).
- Auto-flag rules (basic): prohibited-keyword + category rules on listings, first-N-listing review, report-count auto-hide threshold — all configurable (D7).
- Dashboard: open items by type, avg time-to-resolve, top report reasons.
- Privacy: moderators see reported chat context only; every access to sensitive content is logged.

## 7. Cross-cutting requirements

- **Localization:** zero hardcoded copy; `lang/en` from day one (D2).
- **White-label:** name/logo/colors/emails from config/DB + CSS variables; token swap without component changes (D14, D37).
- **Touch/accessibility:** ≥44px targets, 16px inputs, safe-area insets, AA contrast (package report already passes 64/64), keyboard/screen-reader sane.
- **Performance:** fast on mid-range Android + 4G — lazy/responsive images, small JS per route, skeleton loaders, optimistic cart.
- **States:** every page has loading skeleton, empty state, and error state; no dead ends.
- **Security/privacy:** minimal PII, consent records, deletion/export on request (D15); FormRequest authz everywhere (D23).
- **API parity:** every web flow has an `/api/v1` equivalent via shared Action classes (D22).

## 8. Success metrics

| Metric                                               | Target (post-launch) |
| ---------------------------------------------------- | -------------------- |
| Mobile page loads (p75, 4G)                          | < 3s interactive     |
| Checkout completion (checkout → paid/COD order)      | > 60%                |
| Order defect rate (disputes/orders)                  | < 5%                 |
| Moderation time-to-resolve (median)                  | < 24h                |
| Seller activation (application → first live listing) | > 50%                |
| No horizontal scroll / CLS regressions at 360px      | 0                    |

## 9. Risks

| Risk                                                            | Impact                                   | Mitigation                                                                                                               |
| --------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Gateway lacks true marketplace split-payouts                    | Held-funds flow needs manual workarounds | Phase 3 picks gateway on split-payout support (OPEN D20); ledger keeps us gateway-agnostic                               |
| Scope creep (vouchers, notifications, chat, moderation all MVP) | Timeline slip                            | MVP/v2 marks let us cut cleanly; customers page already cut                                                              |
| Post-moderation abuse (prohibited items live before flags fire) | Legal/brand risk                         | First-N approval + auto-hide threshold + keyword rules (D7)                                                              |
| Realtime chat infra new to repo                                 | Infra complexity                         | Reverb first-party (D28); degrade to polling if needed                                                                   |
| Typesense ops burden                                            | Search downtime                          | Fall back to DB search behind Scout contract (D27)                                                                       |
| FormRequest-only authz at scale                                 | Scattered permission logic               | Centralize role checks in a small `Authorizes` concern on the User model + shared base FormRequests (propose in Phase 3) |

## 10. What exists today (delta)

Repo has: auth (register/login/verify/2FA/passkeys), settings pages, ULID users, React/Inertia/Tailwind v4 shell, Pest/Pint/Larastan, Sail (Postgres/Redis/Typesense/Mailpit). Everything else in §4 is missing — this PRD is greenfield on an empty domain.
