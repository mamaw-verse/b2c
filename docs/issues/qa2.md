# Task Implementation Plan

**Repo:** `mamaw-verse/b2c` (Laravel + Inertia/React, Wayfinder routes, Pest tests). File paths below come from the cloned repo.

**Ground rules**

- Run tasks in order, in one pass.
- After any change to `routes/web.php`, run `php artisan wayfinder:generate` (the front end imports `@/routes/...`).
- Tasks marked **[needs decision]** have an open question listed at the end. Use the stated default and don't block on it.

---

### Module: Returns & Refunds

#### Task 1.1: Let sellers process return/refund requests

- **Source Reference:** Item 1. Orders in "Return/Refund" status have no seller-side resolution. Sellers see the badge but cannot approve, reject or refund.
- **Target Files:**
    - `app/Enums/OrderStatus.php`
    - `app/Actions/Order/ResolveReturn.php` (new)
    - `app/Http/Requests/Seller/ResolveOrderReturnRequest.php` (new)
    - `app/Http/Controllers/Seller/OrderReturnController.php` (new)
    - `routes/web.php`
    - `app/Actions/Seller/GetSellerOrder.php`
    - `app/Actions/Order/GetOrder.php`
    - `resources/js/pages/seller/orders/show.tsx`
    - `resources/js/pages/account/order.tsx`
    - `tests/Feature/Seller/ReturnResolutionTest.php` (new)
- **Implementation Steps:**
    1. In `OrderStatus.php`, add a `Refunded = 'refunded'` case. Add its `label()` ("Refunded") and `badgeVariant()` ("neutral"). Check the `orders.status` column is a plain string, not a DB enum. If it is a DB enum, add a migration.
    2. Create `ResolveReturn::handle(User $seller, Order $order, string $decision, ?string $note)`. Wrap it in `DB::transaction` with `lockForUpdate`, as `CompleteOrder` does.
        - Guard that `$order->shop_id` is the seller's shop and `status === ReturnRefund`.
        - **approve:** set status to `Refunded`, create a `LedgerEntry` of type `LedgerEntryType::Refund` that reverses the seller's earlier sale credit (mirror `CreditSellerLedger`), and write an `OrderEvent` "Refund approved".
        - **reject:** set status back to `Completed`, write an `OrderEvent` "Return/refund declined" with the note (note required on reject), and do not touch the ledger.
        - In both cases, notify the buyer with `OrderStatusNotification`.
    3. Add `ResolveOrderReturnRequest` (`decision` in `approve,reject`; `note` required if reject, max 500). Add `OrderReturnController::store`. Register `POST seller/orders/{order}/return` as `seller.orders.return.store`, inside the `workspace:seller` group.
    4. In `GetSellerOrder.php`, expose `return_request` (reason from the latest "Return/refund requested" event, requested-at) and `can_resolve_return` (`status === ReturnRefund`). Mirror the outcome in `GetOrder.php` for the buyer.
    5. In `seller/orders/show.tsx`, when `can_resolve_return` is true, render a "Return/refund request" panel with the buyer's reason and two buttons, "Approve refund" and "Decline", using the existing confirm dialog or modal. Decline requires a note.
    6. In `account/order.tsx`, replace the static "Our team will review…" banner (~line 239) with the actual outcome (pending, approved or declined, plus the seller's note).
    7. Write Pest tests:
        - approve: status becomes Refunded, ledger entry created, buyer notified.
        - reject: status returns to Completed, no ledger entry.
        - a different seller gets 403/404.
        - a non-return order is rejected.
- **Verification:** `php artisan test --filter=ReturnResolution`. Manually: as a buyer, complete an order and request a return. As the seller, open the order, approve (the order shows "Refunded" and Finance shows a refund entry) and repeat with decline (the order returns to "Completed" and the buyer sees the note).

---

### Module: Order Lists (Seller Centre and Buyer account)

#### Task 2.1: Replace status tabs with one simple orders table

- **Source Reference:** Item 2. Keep the order lookup page simple on both the seller and buyer side. Drop the to-ship / to-receive tabs and show all orders together in one table, WooCommerce-style.
- **Target Files:**
    - `resources/js/components/orders-table.tsx` (new, built on `components/data-table.tsx`)
    - `resources/js/pages/seller/orders/index.tsx`
    - `resources/js/pages/account/orders.tsx`
    - `app/Actions/Seller/ListSellerOrders.php`
    - `app/Actions/Order/GetOrders.php`
    - `resources/js/components/order-status-tabs.tsx` (delete if no other usage)
    - `resources/js/components/order-card.tsx` (delete if no other usage)
- **Implementation Steps:**
    1. Create `OrdersTable` with columns Order (linked to detail), Date, Status (`Badge` using `status_variant`), Items, Total, and Action ("View"). Add a Customer and Payment column for the seller variant via a `variant: 'seller' | 'buyer'` prop. Reuse `DataTable`'s empty state and mobile layout.
    2. In both `index.tsx` and `orders.tsx`, remove `OrderStatusTabs`, the `counts` prop and `applyFilter` status handling. Keep search and pagination. Render `<OrdersTable />`, sorted newest first.
    3. In `ListSellerOrders.php` and `GetOrders.php`, drop the status filter branch and the `counts` aggregate query. Keep the `status`, `status_raw` and `status_variant` fields in each row.
    4. Grep for `OrderStatusTabs`, `OrderCard` and `ORDER_TABS`. `OrderRow` is still used by `seller/dashboard.tsx`, so keep it. Delete `order-status-tabs.tsx` and `order-card.tsx` only if nothing else imports them.
    5. Update tests and e2e specs that click tabs (`tests/Feature/Seller/SellerTest.php`, `tests/e2e`).
- **Verification:** `/seller/orders` and `/account/orders` show a single table with all statuses and no tabs. Search and pagination work, and the mobile layout stacks correctly. `npm run types:check` and `npm run lint` pass.

---

### Module: Order Detail (Fulfillment and Parcels)

#### Task 3.1: Shared fulfillment card for unfulfilled items (seller) and parcels (seller and buyer)

- **Source Reference:** Items 3 and 6.
    - Item 3: On the seller order page, show unfulfilled items in a card with an "Unfulfilled (n)" badge, a Location line, and a table of product (thumbnail, linked name, variant chip, SKU), unit price × quantity, and line total. The card ends with actions "Fulfill items" and "Create shipping label". Restyle the Parcels/fulfilled section the same way, and reuse the same component on the buyer side with a CTA to confirm receipt.
    - Item 6: Use tables to make parcel items readable, and add a CTA for tracking the order.
- **Target Files:**
    - `resources/js/components/fulfillment-card.tsx` (new)
    - `resources/js/pages/seller/orders/show.tsx`
    - `resources/js/pages/account/order.tsx`
    - `app/Actions/Seller/GetSellerOrder.php`
    - `app/Actions/Order/GetOrder.php`
- **Implementation Steps:**
    1. Build `FulfillmentCard` with these props:
        - `title`, `badge: { label, tone }` (yellow for Unfulfilled, green for Fulfilled/Delivered, blue for Shipped), and an optional `location`.
        - `lines: { name, href?, variation?, sku?, thumbnail, unit_price, quantity }[]`.
        - Optional `tracking: { courier, number, url, shipped_at, delivered_at }` shown as a header sub-line.
        - A `footer` slot for CTAs, and an optional `menu` slot for the "…" actions.
    2. Render the lines as a real `<table>` with `<th scope>`. The columns are Product (thumbnail, name link, variant chip, SKU), Price × Qty, and Total. On mobile, stack the cells.
    3. Extend the payloads in `GetSellerOrder.php` and `GetOrder.php` so every fulfillment line carries `unit_price`, `variation`, `thumbnail_icon`, `slug` and `sku`. The seller side already exposes `items[].remaining`. Add the same to the buyer's `items`, so unfulfilled items are the lines where `remaining > 0`, with quantity `remaining`.
    4. Seller `show.tsx`:
        - Replace the current items list and `Parcels` `<ul>` (~lines 260–315) with one `FulfillmentCard` for unfulfilled items (title "Unfulfilled (n)" where n is the total remaining quantity) and one `FulfillmentCard` per parcel ("Parcel N · courier").
        - Footer: "Fulfill items" opens the existing ship modal (`shipForm`). Keep "Edit tracking" on shipped parcels.
        - "Create shipping label": **[needs decision]** No label feature exists. Default: omit the button.
        - Location: use the shop's ship-from city or address (verify the field on `Shop`). If none exists, omit the line.
    5. Buyer `order.tsx`: replace the Parcels block (~lines 528–590) with one `FulfillmentCard` per parcel. Footer CTA "Confirm received" (calls the existing `PUT /account/orders/{id}/received` via `handleMarkReceived`) when the order is `to_receive`. Show "Track parcel" (Task 5.1) on each card.
    6. If the products or variations tables have no SKU column, omit the SKU line. Don't add a migration without sign-off.
- **Verification:**
    - Seller side: with an order of 3 products (one partly shipped), the Unfulfilled card shows only the remaining quantities with correct totals. Each parcel card lists only its own items. After shipping all items, the Unfulfilled card disappears.
    - Buyer side: parcel cards render with the same look and the "Confirm received" CTA works.
    - Update `tests/Feature/Seller/FulfillmentTest.php` and `tests/Feature/Order/OrderTrackingTest.php` for the new payload keys. The `data-test="parcel"` hook should remain on each card.

---

### Module: Customers

#### Task 4.1: Seller customer detail page

- **Source Reference:** Item 4. Let sellers view full customer details. Today the Customers page shows only name, order count, total spent, last order date and a Chat button.
- **Target Files:**
    - `routes/web.php`
    - `app/Http/Controllers/Seller/CustomerController.php`
    - `app/Actions/Seller/ListSellerCustomers.php`
    - `app/Actions/Seller/GetSellerCustomer.php` (new)
    - `resources/js/pages/seller/customers.tsx`
    - `resources/js/pages/seller/customer.tsx` (new)
    - `tests/Feature/Seller/CustomerTest.php` (new)
- **Implementation Steps:**
    1. Add the route `GET seller/customers/{customer}` (`seller.customers.show`, `customer` bound to `User`) and `CustomerController::show`.
    2. Create `GetSellerCustomer::handle(Shop $shop, User $customer)`. Abort with 404 unless the customer has at least one non-cancelled order with this shop. Return:
        - name, email, joined date, and the phone numbers from the delivery addresses on this shop's orders
        - the distinct shipping addresses used on this shop's orders
        - totals: orders, completed, cancelled, return/refund, and total spent
        - this shop's order list (reference, date, status, total, link to `seller.orders.show`)
        - the chat link
    3. Scope everything strictly to the seller's own shop orders. Don't expose the buyer's other-shop activity or full address book.
    4. In `ListSellerCustomers.php`, add `email` to each row. In `customers.tsx`, make the name a link to `seller.customers.show` and show the email.
    5. Build `customer.tsx` with a contact card, an address list, stat tiles and the orders table. Reuse `Heading`, `KeyValueList`, `StatCard` and `Badge`.
    6. Pest tests: the seller can view a customer with an order in their shop, gets 404 for a customer with no orders in their shop, and a buyer gets 403.
- **Verification:** `php artisan test --filter=CustomerTest`. Manually: Seller Centre → Customers → click a customer and confirm email, addresses, phones and order history all show. Another shop's seller cannot open the same URL.

---

### Module: Tracking

#### Task 5.1: Track-parcel link/CTA in the order timeline and parcel cards

- **Source Reference:** Items 5 and 6. Add a link or CTA to track a parcel, in the "Tracking" timeline and on parcel cards.
- **Target Files:**
    - `app/Actions/Seller/FulfillSellerOrder.php`
    - `app/Actions/Seller/UpdateFulfillmentTracking.php`
    - `app/Actions/Seller/GetSellerOrder.php`
    - `app/Actions/Order/GetOrder.php`
    - `config/couriers.php` (new)
    - `resources/js/components/timeline.tsx`
    - `resources/js/pages/account/order.tsx`
    - `resources/js/pages/seller/orders/show.tsx`
- **Implementation Steps:**
    1. Add `config/couriers.php`, mapping courier names (for example LBC, J&T, Flash) to tracking-URL templates with a `{number}` placeholder. Add a helper that resolves a parcel's URL as: the seller-entered `tracking_url`, else the courier template, else null.
    2. In `FulfillSellerOrder.php` and `UpdateFulfillmentTracking.php`, store `tracking_url` in the "Parcel shipped" `OrderEvent` metadata next to `courier_name` and `tracking_number`. Keep it in sync when tracking is edited.
    3. In `GetOrder.php` and `GetSellerOrder.php`, return `tracking_url` for each timeline event and each fulfillment, using the resolver.
    4. In `timeline.tsx` (and wherever `order.tsx` renders its own Tracking list), render a "Track parcel ↗" link (`target="_blank" rel="noreferrer"`) under any event that has a tracking number and URL. If no URL can be resolved, show the tracking number with a "Copy" button instead.
    5. In `FulfillmentCard`, show the same "Track parcel" button in the header. Buyer parcels that are still shipped show it as the primary CTA beside "Confirm received".
- **Verification:**
    - Ship a parcel with a courier that has a template: the buyer's timeline and parcel card show a "Track parcel" link that opens the courier's tracking page for that number.
    - Ship with a manual `tracking_url`: that URL is used.
    - Ship with an unknown courier and no URL: a "Copy" button appears.
    - Update `tests/Feature/Order/OrderTrackingTest.php`.

---

### Module: Navigation

#### Task 6.1: Add "My Purchases" to the user menu

- **Source Reference:** Item 7. The account dropdown currently has Buyer account, Start selling, Account settings and Log out. Add a "My Purchases" link.
- **Target Files:**
    - `resources/js/components/account-user-menu.tsx`
    - `resources/js/components/account-sidebar.tsx` (check only)
- **Implementation Steps:**
    1. In `account-user-menu.tsx`, add a `DropdownMenuItem asChild` containing `<Link href={orders.index().url}>` with the `ShoppingBag` (or `Receipt`) lucide icon and the label "My Purchases". Import the Wayfinder route for `orders.index` (`/account/orders`). Place it directly below `WorkspaceSwitcherMenuItems`, inside the same group or just before the Account settings group.
    2. Hide it for admin users, since buyer pages are stripped for admins (`workspace:buyer` middleware). Use the same `auth.user` flags the workspace switcher uses.
    3. Confirm `account-sidebar.tsx` and the mobile bottom tabs already link to orders. Add the link only if they don't.
- **Verification:** The menu shows "My Purchases" for buyers and sellers. Clicking it opens `/account/orders` (for a seller, it switches to the buyer workspace). It does not show for admins.

---

### Module: Homepage

#### Task 7.1: "Why Choose Our Marketplace?" benefits section

- **Source Reference:** Item 8. Add a benefits section to the homepage, using the copy below.
- **Target Files:**
    - `resources/js/content/home-benefits.ts` (new, same pattern as `content/seller-terms.ts`)
    - `resources/js/components/home-benefits.tsx` (new)
    - `resources/js/pages/home.tsx`
    - `app/Http/Controllers/HomeController.php`
    - `config/services.php`
- **Implementation Steps:**
    1. Create `home-benefits.ts` exporting the copy below as typed data (`heading`, `intro`, `audiences[]` with `title`, `eyebrow`, `headline`, `body`, `bullets[]`, `cta { label, href, external? }`).

        **Heading:** Why Choose Our Marketplace?
        **Intro:** A trusted marketplace built around halal values. Whether you're buying, selling, seeking halal certification, or growing your business, we're here to make every connection easier, safer, and more meaningful.

        | #   | Audience                     | Eyebrow              | Headline                                                               | Body                                                                                                                                                                                                    | Bullets                                                                                                                                                                                                                                                                                                           | CTA                           |
        | --- | ---------------------------- | -------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
        | 1   | For Buyers                   | Shop with confidence | Discover halal. Shop with peace of mind.                               | Enjoy a seamless shopping experience with access to halal-certified products and a marketplace designed to protect your purchases.                                                                      | **Secure Payments** – Shop confidently with secure payment transactions. **Buyer Protection** – Enjoy added peace of mind with our escrow system, keeping your payment protected until the transaction conditions are met. **Halal-Certified Goods** – Discover products that meet halal certification standards. | Start Shopping                |
        | 2   | For Sellers                  | Grow your business   | Bring your halal products to more customers.                           | Reach a growing community of conscious consumers looking for trusted halal products. Showcase your offerings, build credibility, and grow your business through our marketplace.                        | Expand your customer reach. Showcase your halal products. Build trust with halal-conscious buyers. Grow your business through digital commerce.                                                                                                                                                                   | Start Selling                 |
        | 3   | For Certification Applicants | Get certified        | Take the next step toward halal certification.                         | Looking to have your products or business halal-certified? Connect with the right certification pathway and take the first step toward building consumer trust and expanding your market opportunities. | Explore halal certification opportunities. Access application information. Strengthen your product's credibility. Build confidence among halal-conscious consumers.                                                                                                                                               | Apply for Halal Certification |
        | 4   | For Businesses               | B2B opportunities    | More than a marketplace. Your gateway to halal business opportunities. | Looking to source halal products or explore business partnerships? Discover our B2B platform, designed to connect businesses and unlock opportunities across the halal industry.                        | Discover wholesale and bulk purchasing opportunities. Explore business-to-business connections. Expand your reach in the halal ecosystem by listing your business and products.                                                                                                                                   | Explore Our B2B Platform ↗    |

    2. Build `HomeBenefits` as a `<section aria-labelledby>`. It has an `h2` and the intro, then four cards (a 2×2 grid on `md+`, stacked on mobile). Each card has the eyebrow, `h3` title, headline, body, a check-icon bullet list and a CTA `Button`/`Link`. Use the existing halal tokens (`halal`, `halal-soft`) and the `panel` class for consistent styling.
    3. Resolve the CTA targets:
        - Start Shopping: the `#home-grid-h` product section, or `search`.
        - Start Selling: `sellerRegister()`. If the user is already a seller, link to their seller dashboard (`canBecomeSeller` is already passed to `home.tsx`).
        - Apply for Halal Certification: **[needs decision]** Default: a config-driven URL passed from `HomeController` as `halalCertificationUrl`.
        - Explore Our B2B Platform ↗: an external link (`target="_blank" rel="noopener noreferrer"`) from `config('services.b2b.url')`, passed from `HomeController` as `b2bUrl`. Hide the CTA if unset.
    4. In `home.tsx`, render `<HomeBenefits />` after the vouchers section and before the infinite-scroll product grid (`home-grid-h`). Placing it after the grid would bury it, because `InfiniteScroll` never reaches the footer.
- **Verification:** The homepage shows all four audience blocks with the exact copy above. CTAs route correctly, the B2B link opens in a new tab, and the section is responsive at 375px and 1280px with keyboard focus order and headings correct. Add an assertion for the section heading in a homepage feature test.

---

### Step-by-Step Execution Checklist

1. [x] **Task 1.1:** Add `Refunded` status, `ResolveReturn` action, seller return route/controller/request, payloads, and seller/buyer UI (`app/Actions/Order/ResolveReturn.php`, `app/Enums/OrderStatus.php`, `routes/web.php`, `resources/js/pages/seller/orders/show.tsx`)
2. [x] **Task 2.1:** Replace status tabs with a single `OrdersTable` on both order lists (`resources/js/components/orders-table.tsx`, `resources/js/pages/seller/orders/index.tsx`, `resources/js/pages/account/orders.tsx`)
3. [x] **Task 3.1:** Build the shared `FulfillmentCard` and apply it to unfulfilled items and parcels on seller and buyer order pages, with buyer "Confirm received" CTA (`resources/js/components/fulfillment-card.tsx`, `app/Actions/Seller/GetSellerOrder.php`, `app/Actions/Order/GetOrder.php`)
4. [x] **Task 4.1:** Add the seller customer detail route, action and page, and link it from the list (`app/Actions/Seller/GetSellerCustomer.php`, `resources/js/pages/seller/customer.tsx`)
5. [x] **Task 5.1:** Add the "Track parcel" link/CTA to the timeline and parcel cards, with courier URL templates (`config/couriers.php`, `resources/js/components/timeline.tsx`)
6. [x] **Task 6.1:** Add the "My Purchases" item to the user dropdown (`resources/js/components/account-user-menu.tsx`)
7. [x] **Task 7.1:** Add the homepage benefits section with the four audience blocks (`resources/js/content/home-benefits.ts`, `resources/js/components/home-benefits.tsx`, `resources/js/pages/home.tsx`)
8. [x] **Final pass:** Run `php artisan wayfinder:generate`, `vendor/bin/pint`, `php artisan test`, `npm run types:check` and `npm run lint`, then smoke-test the buyer and seller flows end to end.

---

### Open Questions (defaults applied if unanswered)

- **"Create shipping label"** has no backing feature in the repo. Default: omit the button and keep "Fulfill items" (the existing ship modal).
- **Refund money movement** (escrow release, payout reversal, COD handling) is not defined. Default: record a ledger `Refund` entry only. Confirm with finance whether to automate payment reversal.
- **Halal certification and B2B URLs** are not in the repo. Default: read from config and hide the CTA if unset.
- **SKU and ship-from location** may not exist in the data model. Default: omit these lines rather than add migrations.
