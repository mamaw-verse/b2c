# 06 — UI Audit Implementation Tasks

Derived from `05-ui-audit-findings.md`. Each ticket maps to one or more findings (F-NN), carries a severity wave, and lists the affected files. Tickets within a wave are sequenced so later ones build on earlier ones.

---

## Wave 1 — P0 (do first, unblocks everything else)

### T-UI-01 · Fix admin layout assignment
**Finding:** F-01 | **Effort:** S | **Status:** ✅ Done 2026-11-07 (e2e-verified, all widths)

Admin pages must use the admin shell exclusively. No storefront layout elements may render inside admin routes.

**Files to touch:**
- `resources/js/layouts/` — confirm `AdminLayout` exists and is wired correctly
- `resources/js/pages/Admin/` — all four admin page files: verify they import `AdminLayout`, not `AppLayout` or `PublicLayout`
- `resources/views/app.blade.php` — confirm no layout is forced server-side
- `routes/web.php` — admin route group should not share the public middleware/layout

**Definition of done:**
- `GET /admin` and all nested admin routes render no `data-shell="public"` element.
- Desktop sidebar fully visible at 1280.
- Mobile tab bar absent on admin at 360 and 768.
- Sticky Reject/Approve bar is not covered at 360.
- Feature test: admin dashboard page returns 200 for admin user, contains no storefront header markup.

---

### T-UI-02 · Unify money type and formatter
**Finding:** F-02 | **Effort:** M | **Status:** ✅ Done 2026-11-07 (e2e-verified, all widths)

All money values must travel as integer centavos end-to-end, and a single formatter must be used in every view.

**Files to touch:**
- `app/Http/Resources/` — `OrderResource`, `OrderItemResource`, `CartItemResource`, any seller resource that formats money
- `resources/js/lib/money.ts` (create if absent) — `formatMoney(centavos: number): string` returning `₱1,560`
- `resources/js/pages/Buyer/Cart.tsx`, `Checkout.tsx`, `Orders/Index.tsx`, `Orders/Show.tsx`
- `resources/js/pages/Seller/Dashboard.tsx`, `Seller/Orders/Show.tsx`
- `database/seeders/CatalogueSeeder.php`, `CartCheckoutSeeder.php` — ensure seed prices are stored as centavos

**Definition of done:**
- `formatMoney(156000)` → `"₱1,560"`, `formatMoney(156000+8000+2000)` → `"₱1,660"`.
- Cart total = checkout subtotal = order total = seller order total for the same seeded order.
- Seller dashboard figures are self-consistent.
- Unit test: `MoneyFormatterTest` covers whole-peso and centavo cases.
- Feature test: place-order response contains matching totals on buyer and seller sides.

---

### T-UI-03 · Fix hero contrast at tablet and desktop
**Finding:** F-03 | **Effort:** S | **Status:** ✅ Done 2026-11-07 (e2e-verified, all widths)

Hero heading and eyebrow text must achieve ≥ 4.5:1 contrast at 768 and 1280.

**Files to touch:**
- `resources/js/pages/Home.tsx` (or `Index.tsx`) — hero component
- `resources/css/app.css` or design-token overrides — scrim/overlay tokens

**Definition of done:**
- Heading text at 768 and 1280 has ≥ 4.5:1 contrast against the photo (white text + dark scrim, or frosted card).
- Mobile treatment (frosted card) unchanged.
- Manual contrast spot-check noted in the PR.

---

## Wave 2 — P1 (broken or off-spec)

### T-UI-04 · Hide bottom tab bar when sticky action bar is present
**Finding:** F-04, F-05, F-06 | **Effort:** S

**Files to touch:**
- `resources/js/layouts/PublicLayout.tsx` (or equivalent) — add logic: when a child mounts the sticky action bar, set a context flag that hides the tab bar
- `resources/js/components/StickyActionBar.tsx` — emit the "action bar active" signal on mount/unmount
- `resources/js/components/BottomTabBar.tsx` — hide when signal is active
- `resources/js/pages/Buyer/Checkout.tsx`, `resources/js/pages/Buyer/Product.tsx`

**Definition of done:**
- Checkout and product pages at 360 and 768 show one bar, not two.
- Tab bar tab highlighting: cart tab active on cart page (or none, per design); no highlight on checkout or order-placed.

---

### T-UI-05 · Fix toast z-index and positioning
**Finding:** F-05 | **Effort:** XS

**Files to touch:**
- `resources/js/components/Toast.tsx` (or `resources/js/app.tsx` toast provider) — set bottom offset = `var(--tab-bar-height) + env(safe-area-inset-bottom)` on phone/tablet; use design-system toast tokens

**Definition of done:**
- Toast is visible above the tab bar at 360 and 768.
- Toast uses the correct background/foreground tokens at 1280.

---

### T-UI-06 · Wire brand name from config
**Finding:** F-07 | **Effort:** S

**Files to touch:**
- `config/marketplace.php` (or `config/app.php`) — `brand_name` key, default to your app name
- `app/Http/Middleware/HandleInertiaRequests.php` — share `brand_name` as a global Inertia prop
- `resources/js/pages/Auth/Login.tsx`, `Register.tsx`, `VerifyEmail.tsx` — replace hardcoded "Laravel"
- `resources/js/layouts/PublicLayout.tsx` — announcement strip, nav "Sell on {brand}" text
- `resources/js/layouts/AdminLayout.tsx`, `resources/js/layouts/SellerLayout.tsx` — headers
- `resources/views/app.blade.php` — `<title>` tag
- `resources/js/pages/Home.tsx` — footer, trust strip copy

**Definition of done:**
- No literal string "Laravel" in any rendered page (grep test passes).
- `APP_NAME` in `.env` controls the brand name everywhere.
- Feature test: `config(['app.name' => 'Barakah Market'])` → home page title and announcement strip contain "Barakah Market".

---

### T-UI-07 · Improve seed data
**Finding:** F-08 | **Effort:** M

**Files to touch:**
- `database/seeders/CatalogueSeeder.php` — replace lorem-ipsum with ≥ 5 realistic product names, map to existing `public/images/catalogue/` images, set prices as centavos in ₱200–₱2,000 range
- `database/seeders/CartCheckoutSeeder.php` — realistic Philippine address, no "E2E Bot"
- `database/seeders/AdminUserSeeder.php` — realistic admin name
- `database/factories/ModerationQueueItemFactory.php` — produce varied type/title combinations
- `database/factories/OrderFactory.php` — varied statuses

**Definition of done:**
- Home grid shows products with matching images, proper names, varied prices.
- "You may also like" has at least one real image.
- Admin queue shows at least 3 rows of different types.
- No lorem-ipsum names, no "E2E Bot", no "123 E2E Street, , 1000".
- No Qur'an listing with discount badge.

---

### T-UI-08 · Product page: price hierarchy and shop card contrast
**Finding:** F-09, F-10, F-11 | **Effort:** M

**Files to touch:**
- `resources/js/pages/Buyer/Product.tsx` — price block (large bold, strike-through, discount badge)
- `resources/js/components/ShopCard.tsx` — move name and badges off the dark banner (or add scrim)
- `resources/js/components/ProductCard.tsx` — "You may also like" cards use real image or standard placeholder

**Definition of done:**
- Product detail shows large bold current price with strike-through and discount badge when on sale.
- Shop name and badges at 768+ have ≥ 4.5:1 contrast.
- Related product tiles show a real image or the standard placeholder (not blank gray).

---

### T-UI-09 · Admin queue counts and filter
**Finding:** F-12 | **Effort:** S

**Files to touch:**
- `app/Http/Controllers/Admin/ModerationQueueController.php` (or equivalent)
- `resources/js/pages/Admin/Queue/Index.tsx` — tab chip counts
- `app/Actions/Moderation/` — queue query action should return counts per type

**Definition of done:**
- Each filter chip count matches the number of items in that tab.
- Feature test: seeded 3 halal-check + 2 report items → halal chip = 3, report chip = 2.

---

### T-UI-10 · Admin queue: master-detail layout at 1280
**Finding:** F-13 | **Effort:** M

**Files to touch:**
- `resources/js/pages/Admin/Queue/Index.tsx` — two-column split at `lg`
- `resources/js/pages/Admin/Queue/Show.tsx` — detail panel, loaded inline at desktop

**Definition of done:**
- At 1280: list on left (~40%), detail on right (~60%); selecting a row updates the detail panel without full navigation.
- At ≤ 768: list only, tap navigates to detail page.

---

### T-UI-11 · Admin: fix HalalStatus label and badge colour
**Finding:** F-14 | **Effort:** XS

**Files to touch:**
- `app/Enums/HalalStatus.php` — add `label(): string` and `badgeVariant(): string` methods
- `resources/js/pages/Admin/Queue/Show.tsx` — render using `label` and `badgeVariant`
- `resources/js/components/Badge.tsx` — ensure neutral variant exists

**Definition of done:**
- `HalalStatus::Na` renders "Muslim-friendly" in neutral badge.
- Red badge only appears for explicitly failed/rejected states.
- Unit test: all `HalalStatus` values have non-empty labels and valid badge variants.

---

### T-UI-12 · Order confirmation page
**Finding:** F-15 | **Effort:** M

**Files to touch:**
- `app/Http/Controllers/Buyer/OrderController.php` (or checkout controller) — redirect to confirmation after place-order
- `resources/js/pages/Buyer/OrderConfirmed.tsx` (new) — shows order reference, COD instruction, "View order", "Continue shopping"
- `routes/web.php` — new route `GET /order-confirmed/{order}`
- `app/Http/Requests/` — `ShowOrderConfirmedRequest` if authorization needed

**Definition of done:**
- Placing an order navigates to `/order-confirmed/{order}` showing the order reference number.
- Human-friendly order number format (e.g. `#261107-0001`).
- COD instruction visible when payment method is COD.
- "View order" links to the buyer order detail page.
- Feature test: `POST /checkout` with valid cart → response redirects to order-confirmed URL.

---

### T-UI-13 · Seller order status tabs
**Finding:** F-16 | **Effort:** S

**Files to touch:**
- `resources/js/pages/Seller/Orders/Index.tsx` — replace plain text with tab bar component
- `resources/js/components/TabBar.tsx` (or equivalent) — used if shared component exists

**Definition of done:**
- Order status tabs use a styled tab component with active-state indicator.
- Each tab shows an order count badge.
- Feature test: correct count per status for seeded seller.

---

### T-UI-14 · Seller ship modal: courier and tracking fields
**Finding:** F-17 | **Effort:** S

**Files to touch:**
- `resources/js/pages/Seller/Orders/Show.tsx` — ship modal
- `app/Http/Requests/Seller/CreateShipmentRequest.php` — add `courier_name` and `tracking_number` required rules
- `app/Actions/Seller/ShipOrder.php` — persist courier + tracking to `order_events`
- `app/Models/OrderEvent.php` — ensure `metadata` column can store courier/tracking

**Definition of done:**
- Ship modal has courier name and tracking number fields (both required).
- Validation error shown when fields are empty.
- After successful submission, order status advances to Shipped and tracking info is stored.
- Feature test: ship without tracking → 422; with tracking → order shipped.

---

### T-UI-15 · Account shell tab bar scrolling
**Finding:** F-18 | **Effort:** XS

**Files to touch:**
- `resources/js/layouts/AccountLayout.tsx` — tab bar container: `overflow-x: auto; white-space: nowrap; scrollbar-width: none`

**Definition of done:**
- All account tabs visible at 360, 768, 1280 (scroll if necessary, no clipping).

---

## Wave 3 — P2 polish (parallelisable after Wave 2)

### T-UI-16 · Auth: login error state, link consistency, password rules, consent
**Findings:** F-19, F-20, F-21, F-22 | **Effort:** M

**Files to touch:**
- `resources/js/pages/Auth/Login.tsx` — show inline `role=alert` error on failure; unify link style
- `resources/js/pages/Auth/Register.tsx` — add password rules hint; add consent checkbox; record consent
- `resources/js/pages/Auth/VerifyEmail.tsx` — show email address; "Resend" success feedback
- `app/Http/Requests/Auth/` — add consent field to registration request
- `app/Actions/Fortify/CreateNewUser.php` — store consent timestamp

**Definition of done:**
- Failed login shows an error message near the email field, not a spinner.
- Registration has password rules hint and a required consent checkbox.
- Email verification shows the destination address; resend gives feedback.

---

### T-UI-17 · Admin dashboard: expiring-certificates false-alarm fix
**Finding:** F-23 | **Effort:** XS

**Files to touch:**
- `resources/js/pages/Admin/Dashboard.tsx` — expiring certificates stat card: use neutral style at 0, warning style at > 0.

---

### T-UI-18 · Admin detail pane: checklist, reason picker, audit history
**Finding:** F-24, F-25 | **Effort:** M

**Files to touch:**
- `resources/js/pages/Admin/Queue/Show.tsx` — add halal checklist, reason picker (`ModerationReason` enum), audit history list
- `app/Http/Controllers/Admin/ModerationQueueController.php` — include `moderation_events` in the show response
- `app/Http/Resources/Admin/ModerationQueueItemResource.php` — include events

**Definition of done:**
- Detail pane shows checklist items, reason picker (all ModerationReason values), and a list of past decisions with timestamps and moderator names.
- After approving/rejecting, a toast confirms the action and the queue count decrements.

---

### T-UI-19 · Product: rating consistency, hide single-variation row
**Findings:** F-26, F-27 | **Effort:** S

**Files to touch:**
- `resources/js/pages/Buyer/Product.tsx` — rating display: hide average when no reviews; variation row: hide when single SKU

---

### T-UI-20 · Cart: hide desktop bottom bar, fix copy, cold-chain logic
**Findings:** F-28, F-29, F-30 | **Effort:** S

**Files to touch:**
- `resources/js/pages/Buyer/Cart.tsx` — hide sticky bar at `lg`; fix "1 items" → "1 item" plural; cold-chain shipping option conditional on cart contents

---

### T-UI-21 · Address formatter: strip empty segments
**Finding:** F-31 | **Effort:** XS

**Files to touch:**
- `app/Models/Address.php` — `formattedAddress(): string` method that filters empty parts before joining with ", "
- Any Inertia resource that serialises the address

---

### T-UI-22 · Order detail: cancel button and status colour tokens
**Findings:** F-32, F-33 | **Effort:** S

**Files to touch:**
- `resources/js/pages/Buyer/Orders/Show.tsx` — cancel button → outline-danger; primary slot for useful action
- `app/Enums/OrderStatus.php` — add `badgeVariant(): string` returning a consistent colour token
- All order list/detail components that render status badges

**Definition of done:**
- Each `OrderStatus` value maps to one badge colour across all views.
- Cancel is a secondary button.

---

### T-UI-23 · Seller dashboard: distinct icons, chart zero-markers, layout
**Findings:** F-34, F-36, F-37 | **Effort:** M

**Files to touch:**
- `resources/js/pages/Seller/Dashboard.tsx` — to-do tile icons (distinct per type); chart renders zero-height bar for empty days; content column max-width + two-column layout

---

### T-UI-24 · Seller orders: buyer name truncation, order ID badge placement
**Findings:** F-35, SE10 | **Effort:** XS

**Files to touch:**
- `resources/js/pages/Seller/Orders/Index.tsx` — widen buyer name column; move "To Ship" badge next to order number

---

### T-UI-25 · Seller: halal certificate expiry warning and cold-chain order flag
**Finding:** F-40 | **Effort:** S

**Files to touch:**
- `resources/js/pages/Seller/Dashboard.tsx` — certificate expiry banner (< 30 days)
- `resources/js/pages/Seller/Orders/Index.tsx` and `Show.tsx` — cold-chain icon on applicable orders
- `app/Http/Controllers/Seller/DashboardController.php` — include certificate expiry data in props

---

### T-UI-26 · Alignment and layout rhythm fixes
**Findings:** F-37, F-38, F-39 | **Effort:** S

**Files to touch:**
- `resources/js/pages/Home.tsx` — align section headings to content grid gutter
- `resources/js/layouts/AuthLayout.tsx` — unify vertical positioning across all auth pages
- Various page-level padding/margin overrides

---

## Wave 4 — P3 nits (batch into a single cleanup PR)

| Ticket | Finding | Files |
|---|---|---|
| T-UI-27 | Admin row title: sentence case, tooltip on truncation | `resources/js/pages/Admin/Queue/Index.tsx` |
| T-UI-28 | Admin mobile: compact inline filter bar | `resources/js/pages/Admin/Queue/Index.tsx` |
| T-UI-29 | Notification badge count: verify no client-side counter bug | `resources/js/components/BottomTabBar.tsx`, notification store |
| T-UI-30 | Footer: add halal policy links | `resources/js/layouts/PublicLayout.tsx` or footer component |
| T-UI-31 | Order number format `#YYMMDD-NNNN` | `app/Models/Order.php` `referenceNumber()` method, order confirmation view |
| T-UI-32 | Order detail: flatten nested address card | `resources/js/pages/Buyer/Orders/Show.tsx` |
| T-UI-33 | Cart "Muslim-friendly" chip: use neutral-informational style | `resources/js/pages/Buyer/Cart.tsx` |

---

## Implementation order

```
Wave 1  ──►  T-UI-01  T-UI-02  T-UI-03   (can parallelise within wave)
              ↓
Wave 2  ──►  T-UI-04  T-UI-05  T-UI-06  T-UI-07  T-UI-08
             T-UI-09  T-UI-10  T-UI-11  T-UI-12  T-UI-13
             T-UI-14  T-UI-15             (can parallelise)
              ↓
Wave 3  ──►  T-UI-16 … T-UI-26            (fully parallelisable)
              ↓
Wave 4  ──►  T-UI-27 … T-UI-33            (single cleanup PR)
```

Each ticket's PR must pass:
- `vendor/bin/sail bin pint --dirty --format agent`
- `vendor/bin/sail artisan test --compact` (affected tests green)
- Manual 360 / 768 / 1280 check for any page touched
- No new `console.error` output in browser logs

Re-run the e2e screenshot suite after Wave 2 to verify P0/P1 findings are resolved before starting Wave 3.
