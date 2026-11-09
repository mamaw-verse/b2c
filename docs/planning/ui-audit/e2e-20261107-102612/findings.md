# UI Audit Findings — e2e-20261107-102612

Source: `ui-audit-report.md` (2026-11-07, 62 screenshots reviewed).
Previous audit: `e2e-20261107-093631/findings.md`.

Regression table: the previous audit's T-UI-01 (admin shell) was confirmed fixed. All other issues from the first audit are still open or partially addressed.

---

## Systemic findings

### S1 · Money and units are unreliable (P0)

- The same ₱780 product appears at ₱78,000 in `buyer-05-orders` and the seller views. Totals ₱156,100 (×2) and ₱468,100 (×6) flow through to the seller dashboard ("Sales today ₱2,659,940").
- `seller-03-order`: Subtotal ₱1,560 + Shipping ₱80 = ₱1,640, but Total shows ₱1,660. The ₱20 COD fee line is missing on the seller view; the buyer view shows it.
- Avg order value ₱156,467.05 uses decimals; all other peso values use none.
- Item count semantics differ: cart "(1 items)" / "(2 items)" in summary; buyer detail "(1 item)"; checkout "(2 items)".
- Related-product prices ₱3.43–₱24.94 against banner "up to ₱300 off" and "free shipping over ₱499".
- **Hypothesis:** seed stored centavo values in a peso field for some orders. Seller view builds its own total instead of sharing an `OrderTotals` object. Item count mixes line count with quantity.

### S2 · Stock is not enforced (P0)

- `buyer-01-product`: "Stock 0 units" but Add to cart and Buy now are enabled. 17 orders exist at qty 2/6.
- `buyer-02-cart`: "Only 2 left" with qty 2 and + disabled — contradicts the product page "0 units".
- **Hypothesis:** displayed stock, cart stock, and order stock come from different sources or stock is not decremented on order.

### S3 · Shipping flow fields missing (P0)

- `seller-05-shipped` modal: only "Mark order … as shipped?" — no courier or tracking-number fields.
- Buyer timeline shows only "Order placed". No shipped step with tracking.
- Seller order detail shows no payment method, so the COD collect amount is invisible.

### S4 · Framework, test and placeholder strings (P1)

- "Laravel" in the top bar, header logo, footer, "Sell on Laravel", "© Laravel", seller bar, admin bar, and all auth screens.
- "Test User", "123 E2E Street", "E2E Bot", "(e2e)" throughout order data and admin queue titles.
- Catalogue uses lorem-ipsum names; stock photos contradict products.
- Placeholder thumbnails (grey) in "You may also like".
- Seller order tabs read "All To Ship Shipped…" (raw tab labels, no styling).

### S5 · Halal vocabulary and data (P1)

- `admin-03-item`: "Halal status: na" in a red badge — raw key, danger colour for a neutral state.
- Product detail: "Authenticity: Muslim-friendly product". No certifier, certificate number, expiry, or coverage.
- Checkout offers "Cold Chain Delivery ₱220" for a book.
- Cart shows "Official Halal Store" next to a "Muslim-friendly" item while the shop is "Halal-only" — possible contradiction.
- Moderation item has no verification checklist. Dashboard shows "Halal Verifications 0 pending" and "Halal checks 0".
- Seller dashboard To-do has no certificate-expiry warning.

### S6 · Container alignment (P1/P2)

- At 1280: header, banner, and product gallery start at x≈44; section headings and product grid start at x≈20; cart/checkout cards at x≈24.
- 5-column grid has a short last row (4 cards). Admin queue rows stretch full width with content in only the left third.
- 768: phone layout used (bottom tab bar, 3-column grid, phone header) instead of a tablet layout.
- 768 product: full-bleed phone layout, no two-column split.

### S7 · Status colours and button hierarchy (P1/P2)

- "To Ship" is grey (buyer) vs blue (seller). "To Receive" is blue (buyer) vs grey (seller). Seller uses buyer-perspective status names.
- "Cancel order" is a full-width solid-red button — the most visually dominant element.
- Admin "Reject" is solid red, equal weight with "Approve".
- Order totals and discounted prices use red/orange that resembles the error colour.
- Admin "Expiring Certificates 0" card has a warning border/tint at zero.

### S8 · Toasts and success states (P1)

- After "Place order", user lands on an empty cart — no confirmation page or order number.
- Toast "Your order has been placed successfully!" is white text on light-grey (≈1.19:1 — fails WCAG AA) over the footer.
- `seller-05-shipped`: modal still open while page behind shows "To Receive".

### S9 · Truncation without recovery (P2)

- Seller list/dashboard: customer "Test Use…" at 1280.
- Admin queue: titles "REPORT check: Unverified halal clai…" at 360 with no title attribute or expand.
- Product cards: "Voluptatum…" single-line ellipsis.
- Shop name "Barakah Pantry" clipped by the banner (S10).

### S10 · Seller banner overlaps shop name (P1)

- `buyer-01-product` at 1280 and 768: dark banner clips "Barakah Pantry" and the "Official" / "Halal-only shop" badges.
- **Hypothesis:** negative margin on the avatar overlap is larger than the banner height.

---

## Contrast failures

| Element                               | Ratio   | Result                                                      |
| ------------------------------------- | ------- | ----------------------------------------------------------- |
| Order-placed toast text               | 1.19:1  | **Fail** (may be mid-fade)                                  |
| Dark mode product title               | 1.32:1  | **Fail**                                                    |
| Dark mode subtitle text               | 1.32:1  | **Fail**                                                    |
| Dark mode "Shipping/Returns" labels   | 3.06:1  | Fail (body text)                                            |
| Seller "To Receive" under modal scrim | 2.73:1  | Fail (scrim state)                                          |
| "Only 2 left"                         | 5.43:1  | Pass                                                        |
| Search placeholder                    | 5.13:1  | Pass                                                        |
| Muted labels                          | 6.46:1  | Pass                                                        |
| Price ₱780 on green strip             | 12.97:1 | Pass (contrast fine; prominence is the issue, not contrast) |

---

## Screen-by-screen findings

### Home (`01-home`)

| ID  | Sev | BP   | Finding                                                                                                                |
| --- | --- | ---- | ---------------------------------------------------------------------------------------------------------------------- |
| H1  | P1  | all  | Brand reads "Laravel" everywhere (S4).                                                                                 |
| H2  | P1  | all  | Lorem-ipsum catalogue; stock photos contradict products; prices ₱3–₱25 vs banner "₱300 off".                           |
| H3  | P2  | 1280 | Grid and headings at x≈20; hero and header at x≈44 (S6). Last row 4/5 cards.                                           |
| H4  | P2  | 768  | Phone nav (bottom tab bar, 3-column grid) instead of tablet layout. Tab bar captured mid-page (full-page capture gap). |
| H5  | P2  | 1280 | Red "-32%" ribbon and discounted prices use danger-like red.                                                           |

### Product (`buyer-01-product`)

| ID  | Sev | BP        | Finding                                                                                                 |
| --- | --- | --------- | ------------------------------------------------------------------------------------------------------- |
| P1a | P0  | 1280, 768 | "Stock 0 units" but Add to cart and Buy now enabled (S2).                                               |
| P1b | P1  | 1280, 768 | Price ₱780 is ~14px regular weight inside a pale-green strip — less prominent than the title.           |
| P1c | P1  | 1280, 768 | No certifier, certificate number, expiry, or coverage in the halal panel (S5).                          |
| P1d | P1  | 1280, 768 | Banner clips shop name and badges (S10).                                                                |
| P1e | P2  | 1280      | Rating "4.9" shown three times; "ratings" link has no count; "No reviews yet" next to 4.9 and 452 sold. |
| P1f | P2  | 1280, 768 | Related items: grey placeholders, lorem names, red discount ribbon overlaying photo.                    |
| P1g | P2  | 1280      | "Buy now" and "Add to cart" are narrow/left-aligned; Chat is a third equal-weight button.               |
| P1h | P1  | 1280 dark | Dark mode: cards and price strip stay white while page is dark. Title contrast 1.32:1.                  |

### Cart (`buyer-02-cart`)

| ID  | Sev | BP   | Finding                                                                              |
| --- | --- | ---- | ------------------------------------------------------------------------------------ |
| C1  | P1  | 1280 | "(1 items)" vs summary "(2 items)" — item count mixes line count with quantity (S1). |
| C2  | gap | 1280 | Two checkout bars visible (second is a fixed bar captured mid-page — capture gap).   |
| C3  | P2  | 1280 | "Only 2 left" with qty 2 vs product page "0 units" (S2).                             |
| C4  | P2  | 1280 | Product image is a green placeholder despite a real photo existing.                  |

### Checkout (`buyer-03-checkout`)

| ID  | Sev | BP   | Finding                                                           |
| --- | --- | ---- | ----------------------------------------------------------------- |
| K1  | P1  | 1280 | Cold Chain Delivery offered for a book (non-frozen product) (S5). |
| K2  | P1  | 1280 | Address shows "Test User", "123 E2E Street" (S4).                 |
| K3  | P2  | 1280 | Total ₱1,660 renders in a red/danger colour (S7).                 |

### Order placed (`buyer-04-order-placed`)

| ID  | Sev | BP   | Finding                                                         |
| --- | --- | ---- | --------------------------------------------------------------- |
| O1  | P1  | 1280 | Lands on empty cart; no confirmation page or order number (S8). |
| O2  | P1  | 1280 | Toast text 1.19:1 contrast, overlaps footer link (S8).          |

### Buyer orders (`buyer-05-orders`)

| ID  | Sev | BP   | Finding                                                                      |
| --- | --- | ---- | ---------------------------------------------------------------------------- |
| B1  | P0  | 1280 | ₱78,000 unit price and ₱156,100 / ₱468,100 totals for the ₱780 product (S1). |
| B2  | P1  | 1280 | Status "To Ship" grey; "To Receive" blue — inconsistent (S7).                |
| B3  | P2  | 1280 | Cards show ×2 but quantity/item count is unlabelled. No pagination visible.  |
| B4  | P2  | 1280 | Tab counts ("To Ship 5", "To Receive 12") don't reconcile with visible rows. |

### Buyer order detail (`buyer-06-order-detail`)

| ID  | Sev | BP   | Finding                                                                                          |
| --- | --- | ---- | ------------------------------------------------------------------------------------------------ |
| D1  | P1  | 1280 | Address "123 E2E Street, , 1000" — empty city/state segment (S4).                                |
| D2  | P1  | 1280 | Order ID `#QESW654Y` vs seller `#F1PQESW654Y` — inconsistent prefix (functional bug FB-04).      |
| D3  | P1  | 1280 | Timestamp "Nov 7, 10:26 AM" vs seller "Nov 07, 2026 02:26 AM" — 8h apart (functional bug FB-05). |
| D4  | P1  | 1280 | "Cancel order" is a full-width solid-red button, the strongest element on the page (S7).         |
| D5  | P2  | 1280 | Subtotal says "(1 item)" while quantity is 2 (S1).                                               |
| D6  | P2  | 1280 | Tracking timeline shows only "Order placed"; left column empty below it.                         |
| D7  | P2  | 1280 | Blanket halal claim with no per-item status.                                                     |

### Seller dashboard (`seller-01-dashboard`)

| ID  | Sev | BP   | Finding                                                                                  |
| --- | --- | ---- | ---------------------------------------------------------------------------------------- |
| SD1 | P0  | 1280 | "Sales today ₱2,659,940" and "Orders to ship ₱156,100" driven by wrong unit prices (S1). |
| SD2 | P1  | 1280 | No certificate-expiry warning in To-do (S5).                                             |
| SD3 | P2  | 1280 | All six To-do tiles use similar cube icons; "To ship" and "Ship today" both show 5.      |
| SD4 | P2  | 1280 | 7-day chart has no y-axis labels or bar values.                                          |
| SD5 | P2  | 1280 | Avg order value ₱156,467.05 has decimals; other values do not.                           |
| SD7 | P2  | 1280 | Customer name truncated "Test Use…".                                                     |

### Seller orders (`seller-02-orders`)

| ID  | Sev | BP   | Finding                                                                                          |
| --- | --- | ---- | ------------------------------------------------------------------------------------------------ |
| SO1 | P1  | 1280 | Tabs render as unstyled plain text "All To Ship Shipped…" — no spacing, active state, or counts. |
| SO2 | P1  | 1280 | "17 orders total" but 15 rows visible; no pager.                                                 |
| SO3 | P1  | 1280 | Header lacks "View shop" and avatar present on the dashboard header.                             |
| SO4 | P2  | 1280 | Rows show no buyer name, item, or status clearly.                                                |

### Seller order + ship modal (`seller-03/04/05`)

| ID  | Sev | BP   | Finding                                                                                                     |
| --- | --- | ---- | ----------------------------------------------------------------------------------------------------------- |
| SX1 | P0  | 1280 | Total ₱1,660 ≠ Subtotal ₱1,560 + Shipping ₱80 — COD fee missing from seller view (S1).                      |
| SX2 | P0  | 1280 | Ship modal has no courier or tracking fields (S3).                                                          |
| SX3 | P1  | 1280 | Modal open while page behind shows "To Receive" — mid-flow capture or UI not closing modal on success (S8). |
| SX4 | P1  | 1280 | No payment method / COD collect amount on seller order.                                                     |
| SX5 | P2  | 1280 | "Chat" is icon-only in the bottom bar; "Print waybill" is a plain text link.                                |
| SX6 | P2  | 1280 | Seller uses buyer-perspective status "To Receive" with different colour.                                    |

### Admin (`admin-01…04`)

| ID  | Sev | BP        | Finding                                                                                                     |
| --- | --- | --------- | ----------------------------------------------------------------------------------------------------------- |
| A1  | P1  | 1280      | "Halal status: na" raw key in a red badge (S5).                                                             |
| A2  | P1  | 1280      | No verification checklist, certifier, certificate number, or expiry on the moderation item.                 |
| A3  | P1  | 1280, 768 | Filter chips show "Halal checks 0 / Reports 0" but all 9 items are Reports (S5).                            |
| A4  | P1  | 1280      | "Reject" is solid red, equal weight with "Approve"; 7 actions in one bar.                                   |
| A5  | P2  | 1280      | Queue titles "REPORT check: Unverified halal claim (e2e)" — all-caps raw type, test text, 9 identical rows. |
| A6  | P2  | 1280      | "Expiring Certificates 0" has warning border/tint at zero.                                                  |
| A7  | P2  | 1280      | Queue rows stretch full width; no back link on item page.                                                   |
| A8  | P2  | 768       | Sidebar is icon-only rail without labels.                                                                   |
| A9  | P2  | 360       | Queue titles truncate; chip row clipped.                                                                    |
| A10 | ✅  | 1280      | After a decision: queue badge decrements 9→8, row removed. _Confirmed working._                             |

### Auth (`02,03,10,11,20`)

| ID  | Sev | BP   | Finding                                                                                                      |
| --- | --- | ---- | ------------------------------------------------------------------------------------------------------------ |
| U1  | P1  | all  | Brand "Laravel" on all auth screens (S4).                                                                    |
| U2  | P1  | all  | `20-login-failed` shows spinner, not an error message. Resolved state never rendered (functional bug FB-02). |
| U3  | P2  | 360  | `11-after-register`: large empty top area, card vertically centred while others sit at top.                  |
| U4  | P2  | all  | Two link styles: black-bold-underlined ("Forgot…") vs green-bold-underlined ("Sign up").                     |
| U6  | P3  | 1280 | "Resend verification email" has a pale-green fill without border — looks disabled.                           |
