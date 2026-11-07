# 05 — UI Audit Findings

Source: `tests/e2e/output/20261107-093631/screenshots/ui-audit-implementation-report.md`
Scope: 21 screens × 3 breakpoints (360 / 768 / 1280) = 63 screenshots.
Method: visual review + zoomed crops + pixel sampling.
Severity: **P0** blocks use or shows wrong data · **P1** clearly broken or off-spec · **P2** polish/consistency · **P3** nit.

See `06-ui-audit-tasks.md` for the implementation ticket list derived from these findings.

---

## Wave 1 — P0 blockers (ship-stopping, do first)

### F-01 · Admin shell rendered inside storefront (P0)
**Screens:** admin-01, admin-02, admin-03, admin-04 at all three widths.

Admin pages show three shell layers stacked: storefront announcement strip → storefront search header → admin header. The desktop sidebar is partially hidden under the storefront header. Storefront footer and bottom tab bar appear on admin views at 360 and 768 — the tab bar covers the Reject/Approve action bar on mobile.

**Root cause hypothesis:** Admin pages inherit the `publicPage` layout instead of the `adminLayout`.

**Acceptance criteria:**
- Admin pages render with the admin shell only: no `[data-shell=public]` element inside `/admin` routes.
- No storefront announcement strip, category nav, cart icon, chat icon, footer, or bottom tab bar on any admin screen.
- Desktop sidebar fully visible at 1280 with all nav items accessible.
- Mobile admin drawer is reachable and the sticky Reject/Approve bar is not covered.
- A layout test: `GET /admin/*` renders no `data-shell="public"` element.

---

### F-02 · Money arithmetic and formatting inconsistency (P0)
**Screens:** cart, checkout, buyer orders list, buyer order detail, seller order, seller dashboard.

Same order appears with different totals on different screens. Root values are inconsistent (centavo/peso conversion applied twice in some views, not at all in others). Format also varies (`₱1,560`, `₱156000.00`, `₱17.94`).

Known bad values from the audit:
| Screen | Shows | Should be |
|---|---|---|
| Cart | ₱1,560 | ₱1,560 |
| Checkout | Subtotal ₱1,560 + shipping ₱80 + COD fee ₱20 = **₱1,561** | ₱1,660 |
| Buyer orders list | **₱156,100.00** | ₱1,660 |
| Buyer order detail | subtotal **₱156000.00**, total **₱156100.00** | ₱1,560 / ₱1,660 |
| Seller order | Shipping **₱0.80**, total ₱1,561 | Shipping ₱80, total ₱1,660 |
| Seller dashboard | Sales today **₱2,653,300** vs 7-day ₱26,533 | consistent |

**Root cause hypothesis:** Money is stored as integer centavos but some paths pass raw values to formatters expecting centavos, producing ×100 inflation. Others skip the formatter, producing missing separators.

**Acceptance criteria:**
- All money values stored and passed as integer centavos.
- Single formatter used everywhere: whole pesos with thousands separators (`₱1,560`), decimals only when non-zero cents.
- Cart total = checkout subtotal. Checkout total = subtotal + shipping + applicable fees. Order total = checkout total. Seller order total = order total.
- A unit test: `MoneyFormatter::format(156000)` returns `₱1,560`.
- A feature test: cart subtotal, checkout total, buyer order total, seller order total are equal for the same order.
- Seller dashboard figures are self-consistent (sales-today / 7-day / avg-order-value relate by the same seed data).

---

### F-03 · Hero heading is dark on dark photo (P0)
**Screen:** home at 768 and 1280.

Heading and eyebrow text on the hero are dark green on a dark green photo — measured ~1.4:1 contrast (WCAG AA requires 4.5:1 for small text, 3:1 for large). Mobile uses a frosted card overlay and is readable.

**Acceptance criteria:**
- Hero heading and eyebrow text at 768 and 1280 achieve ≥ 4.5:1 contrast against the photo.
- Acceptable fixes: white text with a text-shadow/scrim overlay, a frosted-card treatment consistent with mobile, or a lighter photo crop.
- No change to the mobile treatment (frosted card, already passing).
- Contrast verified with a pixel sample or automated contrast check in the e2e suite.

---

## Wave 2 — P1 broken or off-spec

### F-04 · Two stacked bottom bars on checkout and product (P1)
**Screens:** checkout at 360/768, product at 360/768.

The sticky "Total / Place order" action bar and the navigation tab bar occupy the same strip. The design system hides the tab bar when a sticky action bar is present.

**Acceptance criteria:**
- Checkout and product pages hide the bottom tab bar whenever the sticky action bar is visible at ≤ 768.
- No double-bar overlap at 360 or 768.
- Cart intentionally stacks, but consider merging at 360 if more than 140px is consumed.
- Toast is mounted above the tab bar, not behind it.

---

### F-05 · Toast positioned below tab bar and low-contrast (P1)
**Screens:** order-placed, any page with a toast.

Toast mounts behind the tab bar on phone/tablet, and appears over the footer at desktop (bottom-right, faint). Contrast not measurable.

**Acceptance criteria:**
- Toast sits above the tab bar on phone/tablet (z-index + bottom offset = tab bar height + safe-area-inset-bottom).
- On desktop the toast uses the design-system toast token background/foreground.
- A visual regression or manual check at 360 confirms the toast is fully visible.

---

### F-06 · Bottom tab bar highlights wrong item (P1)
**Screens:** cart, checkout, admin, order-placed.

Tab bar highlights "Home" on all of the above. Active state should track the current section or show no active item when no tab owns the current route.

**Acceptance criteria:**
- Cart/checkout: "Cart" tab is active (or none, if cart is not a top-level tab in the design).
- Admin pages: tab bar is not rendered (covered by F-01).
- Order-placed confirmation: no tab highlighted, or whichever tab is appropriate.

---

### F-07 · "Laravel" brand name hardcoded (P1)
**Screens:** all.

"Laravel" appears in: logo lockup, announcement strip ("checked by Laravel"), nav ("Sell on Laravel"), footer, auth page headings, admin/seller headers. The PRD (D14) requires all brand text from config.

**Acceptance criteria:**
- A `config/app.php` or `config/marketplace.php` key (e.g. `marketplace.brand_name`) drives every brand-name occurrence.
- `<title>` tag uses the brand name.
- Auth pages, announcement strip, nav link, footer, admin header, seller header all read from the config.
- A feature test: changing `marketplace.brand_name` to "Barakah Market" in config reflects on the home page and in the page title.

---

### F-08 · Seed data obscures real UI (P1)
**Screens:** home product grid, product page, admin queue, buyer orders.

Issues:
- Product names are lorem-ipsum ("Est Ea Et Iure").
- Product images are mismatched (fish for dates, chicken for rosewater).
- "You may also like" tiles are blank gray squares.
- Admin queue: 9 identical "REPORT check: Unverified halal claim (e2e)" rows.
- Buyer orders: identical repeated order cards.
- E2E identity strings visible: "E2E Bot", "123 E2E Street, , 1000".

**Note:** A Qur'an listing is used as the main sample product and shows discount/sale badges. Religious texts must not carry promotional overlays; obtain community reviewer sign-off before launch.

**Acceptance criteria:**
- CatalogueSeeder provides ≥ 5 varied products with realistic names, matching images (use existing `public/images/catalogue/` assets), and differentiated prices in the ₱200–₱2,000 range.
- At least one product has no image (tests placeholder rendering).
- Admin queue seeder provides ≥ 3 rows of different types (halal-check, report, shop-review) with distinct titles.
- Buyer orders seeder provides ≥ 3 orders in different statuses.
- E2E user names and addresses use realistic Filipino-style fixtures.
- No Qur'an product with discount badge; religious content review before go-live is documented as a pre-launch checklist item.

---

### F-09 · Product price hierarchy missing (P1)
**Screen:** product at all widths.

"₱780" appears as small regular text in a green box. The design system specifies a large bold price block with strike-through and discount percentage.

**Acceptance criteria:**
- Product detail shows: large bold current price, strike-through original price (when discounted), discount % badge.
- Price block uses the design-system price component tokens.
- When not discounted, only the price is shown (no empty strike-through).

---

### F-10 · Shop card on product page: name and badges dark-on-dark (P1)
**Screens:** product at 768 and 1280.

Shop name and "Official" / "Halal-only shop" badges overlap the dark banner background — name is half-hidden, badges unreadable. Fine at 360.

**Acceptance criteria:**
- Shop name and badges at 768+ achieve ≥ 4.5:1 contrast.
- Acceptable fixes: move text/badges off the banner onto a white card below, or use inverse text + scrim on the banner.
- At 360 the card layout remains unchanged.

---

### F-11 · "You may also like" blank tiles (P1)
**Screen:** product at all widths.

Related product tiles show blank gray image placeholders.

**Acceptance criteria:**
- Related products are seeded with at least one matching image each.
- If a product genuinely has no image, show the standard placeholder component (not blank gray).
- Prices on related products are in the same range as the main product (±50%), not unrelated low-decimal values.

---

### F-12 · Admin queue tab counts show 0 while list has items (P1)
**Screen:** admin-02 (queue) at all widths.

All filter chips show count 0 (Halal checks 0, Reports 0, etc.) while the list body shows 9 items under "All types".

**Acceptance criteria:**
- Tab/chip counts are computed from the same scoped query as the list.
- Switching tabs filters the list and the active tab count is non-zero when items exist.
- A feature test: seeding 3 halal-check items and 2 report items, the Halal-checks chip count = 3.

---

### F-13 · Admin queue missing master-detail layout at desktop (P1)
**Screen:** admin-02 at 1280.

Full-width single-column list with the P2 chip at the far right edge, 1000px from the title. Design specifies a list-left + detail-right split.

**Acceptance criteria:**
- At 1280, admin queue renders a two-column split: list (~40%) | detail (~60%).
- Selecting a row loads the detail inline (no full-page navigation).
- At ≤ 768, only the list is shown; tapping a row navigates to the detail page.

---

### F-14 · Admin item detail: "na" shown in red badge (P1)
**Screen:** admin-03 (item detail).

Halal status shows the raw value `"na"` in a red danger badge. "na" maps to "Muslim-friendly" in the design system — it is a neutral status, not an error.

**Acceptance criteria:**
- `HalalStatus::Na` renders the label "Muslim-friendly" in a neutral (not red) badge.
- The enum's `label()` method (or equivalent) maps all values to human-readable strings.
- Red is reserved for failed/rejected statuses.
- A unit test covers each `HalalStatus` value's label and badge colour.

---

### F-15 · Order confirmation lands on empty cart (P1)
**Screen:** buyer-04 (order placed) at all widths.

After placing an order the user lands on an empty cart with only a barely-visible toast. No order number, no COD instruction, no "View order" or "Continue shopping" CTA.

**Acceptance criteria:**
- `POST /checkout` redirects to a dedicated `/order-confirmed/{order}` page (or Inertia visit to an `OrderConfirmed` component).
- Page shows: order reference number (human-friendly format, e.g. `#240311-0042`), COD payment instruction (if COD), "View order" link, "Continue shopping" link.
- The empty cart is not visible until the user navigates back.
- A feature test: placing an order returns the confirmation page with the correct order reference.

---

### F-16 · Seller orders tabs render as plain text (P1)
**Screen:** seller-01 to seller-05.

"All To Ship Shipped To Receive Completed Cancelled" appears as unstyled plain text with no tab indicators, no active state, no counts.

**Acceptance criteria:**
- Order status tabs use a styled tab bar component matching the design system.
- Active tab is visually indicated.
- Each tab shows an order count badge.
- A feature test: counts per status are correct for the seeded seller.

---

### F-17 · Ship modal missing courier and tracking fields (P1)
**Screens:** seller-03 at all widths.

Ship modal only shows a "Confirm shipment" button. PRD US-18 requires courier name and tracking number before marking shipped.

**Acceptance criteria:**
- Ship modal has: courier name field (required), tracking number field (required), optional note.
- Submitting without courier/tracking returns a validation error.
- After successful submission, the order status changes to "To Ship" → "Shipped" and the tracking info is saved to `order_events`.
- A feature test: shipping without tracking fails; with tracking succeeds and updates status.

---

### F-18 · Account shell tab bar overflows at 360 (P1)
**Screen:** buyer-05, buyer-06 (orders) at 360/768.

"Appearance" tab is clipped at 360; "Return/Refund" tab is clipped at 768/1280.

**Acceptance criteria:**
- Account tab bar scrolls horizontally (overflow-x: auto, no wrapping) so all tabs are reachable.
- No tab is clipped at 360, 768, or 1280.
- Active tab remains visible without manual scrolling on page load.

---

## Wave 3 — P2 polish

### F-19 · Auth error state missing on login-failed screen (P2)
After login failure the screen shows the spinner state with no error message. There must be an inline `role=alert` error near the fields.

**Acceptance criteria:** Failed login shows an inline error message (`role=alert`) near the email field with a meaningful message. Spinner is not shown after the request completes.

### F-20 · Two link styles on login card (P2)
"Forgot your password?" is bold black underlined; "Sign up" is green. Use a single link style per card.

**Acceptance criteria:** All secondary text links within a single auth card use the same style token.

### F-21 · Register: no password rules, no consent (P2)
No password strength hint. No terms/privacy consent checkbox (PRD D15 requires consent records).

**Acceptance criteria:** Register form shows a password rules hint beneath the password field. A required consent checkbox for terms and privacy policy is present; its checked state is recorded.

### F-22 · Email verification: address not shown, no "sent" confirmation (P2)
Verification page doesn't show the email address the link was sent to, and "Resend" has no feedback.

**Acceptance criteria:** Verification screen shows the email address. "Resend" button shows a success message after clicking.

### F-23 · Admin dashboard: expiring-certificates card false-alarm styling (P2)
"Expiring Certificates 0" uses amber/warning styling even when value is 0.

**Acceptance criteria:** Zero count uses a neutral style. Warning style activates only when count > 0.

### F-24 · Admin moderation checklist missing from detail pane (P2)
The halal verification checklist, reason picker, and audit history context are missing from the detail pane.

**Acceptance criteria:** Detail pane includes the halal verification checklist, a reason picker (populated with `ModerationReason` enum values), and the item's audit history (previous decisions, timestamps, moderator names).

### F-25 · Admin: after decision, no toast or row-state confirmation (P2)
After approving/rejecting an item the queue returns with no confirmation — no toast, no "approved by you" row state.

**Acceptance criteria:** After a decision a toast confirms the action. The processed row shows a resolved state. The queue count decrements.

### F-26 · Product page: contradictory rating display (P2)
"4.9 ★ ratings" with no count, "442 sold", but the reviews section says "No reviews yet".

**Acceptance criteria:** Rating display is consistent: if there are no reviews, show "No reviews yet" everywhere. If there are reviews, show the real average and count in both the rating row and the reviews section.

### F-27 · Variation row shows "Variation: Default" for single-SKU product (P2)
Variation row is shown even when there is only one variation with no real choice.

**Acceptance criteria:** Variation picker/row is hidden when a product has exactly one variation.

### F-28 · Cart desktop: duplicate checkout action (P2)
The sticky bottom bar appears after the footer while the Order Summary card already has the CTA. Two checkout buttons on one page.

**Acceptance criteria:** Sticky bottom checkout bar is hidden at `lg` breakpoint. The Order Summary card CTA is the only checkout trigger at desktop.

### F-29 · Cart: "Shopping Cart (1 items)" bad copy (P2)
Line count vs quantity, and bad plural ("1 items").

**Acceptance criteria:** Cart heading shows item quantity with correct plural: "Shopping Cart (1 item)" / "Shopping Cart (3 items)".

### F-30 · Cart: wrong delivery option shown (P2)
"Cold Chain Delivery ₱220" is offered for a non-frozen product.

**Acceptance criteria:** Cold-chain shipping option is only shown when the cart contains at least one product tagged as frozen/cold-chain.

### F-31 · Checkout address: empty segment in joined string (P2)
"123 E2E Street, , 1000" has an empty city/barangay segment.

**Acceptance criteria:** Address formatter strips empty parts when joining. "123 E2E Street, Tondo, Manila 1000" for a full address; "123 E2E Street, Manila 1000" if barangay is blank.

### F-32 · Order detail: "Cancel order" is full-width solid red primary button (P2)
Cancel order is the strongest visual element on the page.

**Acceptance criteria:** Cancel order is rendered as an outline-danger secondary button. The primary CTA slot is used for the most helpful next action (e.g. "Track order", "Contact seller").

### F-33 · Order status colour inconsistency (P2)
"To Ship" badge is gray in the list, blue in the detail banner, green in the tracker.

**Acceptance criteria:** Each `OrderStatus` value maps to exactly one badge colour token used consistently across list, detail, and seller views.

### F-34 · Seller dashboard: same icon for five different to-do tiles (P2)
All action tiles use the same cube icon.

**Acceptance criteria:** Each to-do tile uses a distinct icon matching its action type (ship, review, certificate, etc.).

### F-35 · Seller orders: buyer name truncates unnecessarily (P2)
"Test Use…" truncates when there is plenty of horizontal room.

**Acceptance criteria:** Buyer name column is wide enough to display typical names without truncation; truncation (with tooltip) only applies when the string genuinely overflows.

### F-36 · Seller dashboard: empty chart days have no baseline (P2)
Chart shows one bar; days with no sales have no zero-marker.

**Acceptance criteria:** Chart renders a zero-height bar (or empty marker) for days with no sales, so the x-axis is complete.

### F-37 · Desktop pages: empty right half, no max-width strategy (P2)
Seller dashboard, order detail, seller order are narrow content columns with a large empty right area.

**Acceptance criteria:** Content columns have a `max-w-*` cap and are either centred or placed in a two-column layout (main content + contextual sidebar), consistent with the design system `layouts__seller` and `layouts__account` screenshots.

### F-38 · Alignment drift between sections (P2)
Left edges of section headings, hero, and cards differ on the same page (home desktop: headings at x≈20, cards at x≈44).

**Acceptance criteria:** All sections on a given page share the same horizontal gutter token. Section headings align to the content grid, not the page edge.

### F-39 · Auth pages: inconsistent vertical positioning (P2)
Login and register are top-aligned; email verification is vertically centred.

**Acceptance criteria:** All auth pages use the same vertical positioning (design system `layouts__auth` spec).

### F-40 · Seller: no halal-specific content (P2)
No certificate-expiry banner, no halal status on products/orders, no cold-chain flag on orders to ship.

**Acceptance criteria:** Seller dashboard shows a halal certificate expiry warning when any certificate expires within 30 days. Order rows show a cold-chain icon when the order contains frozen products.

---

## Wave 4 — P3 nits

| ID | Finding |
|---|---|
| F-41 | Admin queue row title prefixes ("REPORT check:") are all-caps and truncated. Use sentence case; add tooltip on truncation. |
| F-42 | Admin mobile filter/search in a bordered card inside the page wastes width. Use a compact inline filter bar. |
| F-43 | Passkey button (outline) competes with the Log in primary. Fine, but ensure visual hierarchy is clear. |
| F-44 | Login divider "OR CONTINUE WITH EMAIL" is very small (passes contrast, but check minimum size). |
| F-45 | Notification badge count changes between breakpoints for the same page. Confirm not a counter bug. |
| F-46 | Footer is sparse. Add halal-specific policy links. |
| F-47 | Order number format `#D5X8ZK3K` is not human-friendly. Use format `#YYMMDD-NNNN`. |
| F-48 | Nested card inside a card for delivery address in order detail. Use a single-level card. |
| F-49 | Seller order: "To Ship" badge floats far right of the title row. Move next to the order number. |
| F-50 | Cart "Muslim-friendly" chip is gray and reads as disabled. Use neutral-informational chip style. |

---

## Contrast summary

| Element | Result |
|---|---|
| Home hero heading on photo at 768/1280 | **1.4:1 — fails** (F-03) |
| Shop name + badges on dark product banner | **Fails** (F-10) |
| Toast on order-placed page | Not measurable — likely fails (F-05) |
| Login divider "OR CONTINUE WITH EMAIL" | 6.5:1 — passes |
| Halal badge, cart Muslim-friendly chip | Pass; chip looks disabled (F-50) |
| Red "na" status badge | Colour wrong (danger for neutral) (F-14) |

---

## Out of scope for this audit cycle

The following screens were not captured and must be re-shot before the next audit: empty states (orders, queue), error states, loading skeletons, search, category, chat, notifications, seller product form, shop settings, address book, halal certificate upload, dark mode, and token-swap ("brand B") proof. See `07-e2e-capture-improvements.md` for re-shoot specifications.
