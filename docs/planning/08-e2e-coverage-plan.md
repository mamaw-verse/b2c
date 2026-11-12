# E2E Coverage Audit & Spec Plan

Audited: 2026-11-10. Companion to `07-wave-3-implementation-tasks.md` §4.

This document is the **live spec plan** for the e2e coverage gaps found after waves 2 and 3a–3e shipped. When a spec is written and passes on all four projects, tick it here and record it in `scenarios.json`.

---

## 1. What is currently covered

| Spec file                     | Surfaces exercised                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| `smoke.spec.ts`               | Home, login, register forms; visitor registration; bad-credentials rejection                |
| `seller-registration.spec.ts` | Seller application form → admin approval → seller workspace entry; seller terms             |
| `storefront.spec.ts`          | Product card states, category nav, WCAG contrast, footer                                    |
| `order-lifecycle.spec.ts`     | Buyer checkout, seller fulfilment (ship), buyer receives + reviews, admin moderation        |
| `seller-finance.spec.ts`      | Finance page balance cards + ledger, payout account setup, payout request, admin marks paid |
| `admin-console.spec.ts`       | User list/search, suspend/lift, category create + commission edit, voucher CRUD, audit log  |
| `admin-shell.spec.ts`         | Admin shell isolation; buyer/seller surface redirects for admins                            |
| `accessibility.spec.ts`       | WCAG AA axe scans of public, buyer, seller (9 routes), admin (9 routes) in light and dark   |
| `focus.spec.ts`               | Header search ring, quantity stepper ring, styleguide focus page                            |

---

## 2. Coverage gaps

### HIGH — zero functional e2e coverage

| Gap                 | Routes missing                                                                                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Seller product CRUD | `GET /seller/products`, `GET /seller/products/create`, `POST /seller/products`, `GET /seller/products/{id}/edit`, `PUT /seller/products/{id}`, `DELETE /seller/products/{id}` |
| Search              | `GET /search?q=…`                                                                                                                                                             |

### MEDIUM — incidentally visited or not functionally tested

| Gap                         | Notes                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Product detail page (buyer) | Visited in `order-lifecycle` and `focus` only in passing; variation picker, report dialog, sold-out state, chat redirect not asserted |
| Buyer address CRUD          | Only `POST` (seed) is used; `PUT`, `DELETE`, set-default untested                                                                     |
| Order cancellation          | `POST /account/orders/{order}/cancel` route exists but untested                                                                       |
| Seller vouchers             | `/seller/vouchers` only in accessibility scan; seller creating/editing/deleting their own shop vouchers not tested                    |
| Seller settings             | `/seller/settings` only in accessibility scan                                                                                         |
| Seller customers            | `/seller/customers` only in accessibility scan; list content, chat button not asserted                                                |
| Content pages               | W3-01 shipped; `smoke.spec.ts` never extended with `/pages/returns` etc.                                                              |

### LOW — deferred or infrastructure gaps

| Gap                         | Notes                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------ |
| Partial fulfilment          | Deferred per `07-wave-3-implementation-tasks.md` (W3-40 dependency)                  |
| Chat functionality          | Buyer/seller message send/read; conversation start from product page                 |
| Notifications (functional)  | Only shell + a11y checks; no test that an action produces a notification             |
| Admin settings (functional) | `/admin/settings` only in a11y scan                                                  |
| Suspended-user login block  | Suspension is set in `admin-console.spec.ts` but no assertion that login is rejected |

---

## 3. Spec plan

Implement in this order. Each spec must pass on all four projects (`desktop-1280`, `tablet-768`, `mobile-360`, `iphone-safari`) before the row is ticked.

### 3.1 `seller-products.spec.ts` — NEW (HIGH)

Serial flow for the authenticated seller (`seller@example.com`):

1. **Product list** — navigate `/seller/products`. Assert `Add product` button, data table caption, search input.
    - Screenshots: `products-01-list`

2. **Create (simple, no variants)** — click `Add product`, fill:
    - `input[name="name"]` — unique product name
    - `select[name="category_id"]` — first option
    - `textarea[name="description"]`
    - `input[name="halal_status"][value="not_ingestible"]` radio
    - `input[name="price"]`, `input[name="stock"]`, `input[name="weight"]`
    - Click `button[name="published"][value="1"]` (Publish)
    - Assert redirect back to `/seller/products`; row with product name visible
    - Screenshots: `products-02-create-form`, `products-03-created`

3. **Halal certified fields** — repeat create, select `certified` radio, assert the certifying body / certificate number / valid_until / no-pork declaration section appears. Save as draft (`button[name="published"][value="0"]`).
    - Screenshots: `products-04-halal-fields`

4. **Filter on list** — type name in the search input, press Enter. Assert filtered row visible.
    - Screenshots: `products-05-filtered`

5. **Edit** — click `Edit` link (`a[href*="/seller/products/"][href*="/edit"]`). Change name, click Save draft. Assert updated name + Draft badge in list.
    - Screenshots: `products-06-edit`, `products-07-updated`

6. **Delete** — `page.once('dialog', d => d.accept())`, click Delete link. Assert row disappears.
    - Screenshots: `products-08-deleted`

Accessibility additions: add `/seller/products` and `/seller/products/create` to the seller surface in `accessibility.spec.ts`.

---

### 3.2 `search.spec.ts` — NEW (HIGH)

1. **Results** — `GET /search?q=dates`. Assert `h1` contains `"dates"`, result count > 0, `#sr-grid article` present.
    - Screenshots: `search-01-results`

2. **Halal filter chip** — click `Halal certified` chip. Assert URL contains `halal=`. Results re-render.
    - Screenshots: `search-02-halal-filter`

3. **Sort** — change `SortControl` to a non-default option. Assert URL updates.
    - Screenshots: `search-03-sorted`

4. **Empty state** — `GET /search?q=xyzzy-no-match-9999`. Assert "No products match" text, Clear filters link pointing to `/search`.
    - Screenshots: `search-04-empty`

5. **Navigate to product** — from `/search?q=dates`, click first product card link. Assert URL matches `/products/…`.
    - Screenshots: `search-05-product-landed`

Accessibility additions: add `/search?q=dates` to the public surface in `accessibility.spec.ts`.

---

### 3.3 `product-detail.spec.ts` — NEW (MEDIUM)

1. **Page renders** — `/products/quran-with-english-translation-hardcover`. Assert `h1`, price block (`div.rounded-panel.bg-surface-cta`), reviews section `#pd-rev`.
    - Screenshots: `pdp-01-detail`, `pdp-02-reviews`

2. **Halal certified product** — `/products/ajwa-dates-500g-premium-grade-resealable-tub`. Assert `HalalFacts` / certifying body text visible.
    - Screenshots: `pdp-03-halal`

3. **Variation picker** — on the Ajwa dates product, click Add to cart. Assert `dialog[aria-label="Select variation"]` opens, options present. Close (Escape).
    - Screenshots: `pdp-04-variation-picker`

4. **Report dialog** — log in as buyer, click Report button, assert `ReportDialog` opens (form with reason field). Close.
    - Screenshots: `pdp-05-report-dialog`

5. **Chat → login redirect** — not logged in, click Chat button. Assert redirect to `/login`.
    - Screenshots: `pdp-06-chat-login-redirect`

6. **Sold-out state** — navigate to `halal-certified-beef-tapa` (seeded out-of-stock). Assert `Buy now` button disabled / shows "Out of stock".
    - Screenshots: `pdp-07-sold-out`

---

### 3.4 `seller-vouchers.spec.ts` — NEW (MEDIUM)

Serial flow for the authenticated seller:

1. Navigate `/seller/vouchers`. Assert `h1` "Marketing", `details[data-test="new-voucher"]` present.
    - Screenshots: `sv-01-list`

2. **Create** — open New voucher details, fill code (unique), fixed discount ₱50, min spend ₱300, click Create voucher. Assert `[data-test="voucher-row"]` with code appears.
    - Screenshots: `sv-02-created`

3. **Edit** — open Edit details on the row, change discount value to ₱75, click Save. Assert row summary updates.
    - Screenshots: `sv-03-updated`

4. **Delete** — click Delete button. Assert voucher row disappears.
    - Screenshots: `sv-04-deleted`

---

### 3.5 `smoke.spec.ts` extension — content pages (LOW→MEDIUM)

Add a new `test.describe('content pages')` block:

- `GET /pages/returns` — assert `h1` present, response 200.
- `GET /pages/nonexistent` — assert `response.status() === 404`.
- Screenshots: `smoke-content-01`

---

### 3.6 `order-lifecycle.spec.ts` extension — order cancellation (MEDIUM)

Add a sub-test after the checkout test using a fresh buyer + fresh order:

- Seed address, add to cart, place order.
- Navigate to order detail, click Cancel, accept confirm dialog.
- Assert order shows Cancelled status.
- Screenshots: `buyer-cancel-01`

> Partial fulfilment flow (parcels) stays deferred — depends on W3-40.

---

## 4. `scenarios.json` entries to add

| New `id`          | `spec`                          |
| ----------------- | ------------------------------- |
| `seller-products` | `specs/seller-products.spec.ts` |
| `search`          | `specs/search.spec.ts`          |
| `product-detail`  | `specs/product-detail.spec.ts`  |
| `seller-vouchers` | `specs/seller-vouchers.spec.ts` |

Existing `smoke`, `order-lifecycle`, and `accessibility` entries get their `steps` arrays extended.

---

## 5. Progress tracker

- [x] `seller-products.spec.ts` — written and passing (all 4 projects)
- [x] `search.spec.ts` — written and passing (all 4 projects)
- [x] `product-detail.spec.ts` — written and passing (all 4 projects)
- [x] `seller-vouchers.spec.ts` — written and passing (all 4 projects)
- [x] `smoke.spec.ts` content pages extension — passing
- [x] `order-lifecycle.spec.ts` cancellation extension — passing
- [x] `accessibility.spec.ts` — updated with new routes from above specs
- [x] `scenarios.json` — all new entries registered

### QA1 revision pass (2026-11-12)

Specs updated for the qa1.md changes (halal section removed from the seller
product form, certifier name removed from the PDP, moderation request-changes
flow, shop follow/chat gating):

- [x] `seller-products.spec.ts` — halal-fields test replaced with a
      variations generation/apply-to-all test; asserts no halal section
- [x] `product-detail.spec.ts` — halal facts assert badge + validity, no
      certifier name
- [x] `seller-registration.spec.ts` — added admin "Request changes" → seller
      resubmit → admin approve round; approve now confirms a dialog
- [x] `order-lifecycle.spec.ts` — admin approve confirms the dialog
- [x] `shop.spec.ts` — NEW: follow/unfollow, chat start, admin/owner gating;
      registered in `scenarios.json`
- [x] `accessibility.spec.ts` — added `/shops/barakah-pantry` to public paths

### QA2 revision pass (2026-11-12)

Specs updated for the qa2.md changes (return/refund resolution, unified
orders tables, fulfillment cards with courier tracking, seller customer
detail, homepage benefits section):

- [x] `order-lifecycle.spec.ts` — order lists now use the shared orders
      table (`View` links, no status tabs); buyer tracking asserts the
      `Track parcel` link from the configured J&T template; NEW serial
      round covers buyer return request → seller decline with required
      note → buyer declined outcome → re-request → seller approve →
      `Refunded` status and buyer approved outcome
- [x] `seller-customers.spec.ts` — NEW: `/seller/customers` list and the
      customer detail page (contact, stat tiles, order history); registered
      in `scenarios.json`
- [x] `smoke.spec.ts` — home page asserts the "Why Choose Our Marketplace?"
      benefits section and its four audience blocks
- [x] `accessibility.spec.ts` — `/seller/customers` already covered
