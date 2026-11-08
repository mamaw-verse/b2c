# Implementation Tasks — e2e-20261107-102612

Derived from `findings.md` (UI) and `functional-bugs.md` (functional/e2e). All tickets in this file are new work not yet covered by `e2e-20261107-093631/tasks.md`.

Tickets prefixed `T2-` to distinguish from the first-run tickets (`T-UI-`). Some first-run tickets are referenced as prerequisites.

---

## Wave 1 — P0 functional bugs (unblock the e2e suite first)

### T2-01 · Fix POST /cart 422 for zero-stock products

**Bug:** FB-01  
**Effort:** S

The `POST /cart` endpoint rejects an add-to-cart for a product with `stock = 0`. This is correct server-side behaviour, but the form-request error message must be clear and the UI must prevent the attempt entirely (see T2-02).

**Diagnosis first:** Read the 422 validation error body to confirm whether the rejection is due to zero stock, a missing variant ID, or another field mismatch.

```bash
vendor/bin/sail artisan tinker --execute '
$product = App\Models\Product::where("slug","quran-with-english-translation-hardcover")->first();
echo json_encode(["id"=>$product->id,"stock"=>$product->stock])."\n";
'
```

Then replay `POST /cart` with the product ID and inspect the validation errors JSON.

**Files to touch:**
- `app/Http/Requests/Buyer/CreateCartItemRequest.php` — add a clear stock-validation rule: `Rule::when($product->stock === 0, fn() => ['qty' => 'max:0'])` with message "This product is out of stock."
- Confirm the request expects `product_id` (not `product_variant_id`) and adjust if needed.

**Definition of done:**
- `POST /cart` with a zero-stock product → 422 with `errors` key containing a human-readable "out of stock" message.
- `POST /cart` with an in-stock product and valid `qty` → 201/200.
- Feature test covers both cases.

---

### T2-02 · Disable Add to cart / Buy now for zero-stock products

**Bug:** FB-03 | **Finding:** P1a, S2  
**Effort:** S

**Files to touch:**
- `app/Http/Resources/Buyer/ProductResource.php` (or equivalent) — include `in_stock: bool` and `stock: int` in the Inertia prop.
- `resources/js/pages/product.tsx` — disable both buttons when `product.stock === 0`; show "Out of stock" label in the stock detail row.

**Definition of done:**
- Product page with `stock = 0`: both buttons are `disabled`; an "Out of stock" text replaces the count.
- Product page with `stock > 0`: buttons are enabled.
- Feature test: `GET /products/{slug}` with zero-stock product includes `in_stock: false` in Inertia props.

---

### T2-03 · Fix order totals: share one OrderTotals object across buyer and seller

**Bug:** FB-06 | **Finding:** SX1, S1  
**Effort:** M

Seller order detail builds its own subtotal + shipping total, omitting the COD fee. All views must read from the same computed totals.

**Files to touch:**
- `app/Values/OrderTotals.php` (create) — value object: `subtotal`, `shipping`, `cod_fee`, `discount`, `total`; constructor that asserts `subtotal + shipping + cod_fee - discount === total`.
- `app/Http/Resources/Buyer/OrderResource.php` — use `OrderTotals`.
- `app/Http/Resources/Seller/OrderResource.php` — use `OrderTotals`; add `cod_fee` line with label "COD fee (collect from buyer)".
- `resources/js/pages/seller/orders/show.tsx` — render all totals lines including COD fee.

**Definition of done:**
- Seller order detail shows: Subtotal, Shipping, COD fee (when COD), Total — and `subtotal + shipping + cod_fee = total`.
- Buyer order detail shows the same lines.
- Unit test: `OrderTotals` asserts the invariant.
- Feature test: seller and buyer `GET` for the same order return equivalent totals.

---

### T2-04 · Fix unit prices in order records (centavo/peso seed bug)

**Bug:** FB-01 (partial), S1 | **Finding:** B1, SD1  
**Effort:** M

The same ₱780 product appears at ₱78,000 in some orders. This is a data-layer issue — the seeder or order-creation code stored a centavo value in a peso field (or vice versa).

**Diagnosis first:**
```bash
vendor/bin/sail artisan tinker --execute '
App\Models\OrderItem::with("product")->get()->each(function($i){
    echo "{$i->id} unit_price={$i->unit_price} product_price={$i->product->price}\n";
});
'
```

**Files to touch:**
- `database/seeders/CartCheckoutSeeder.php` — ensure `unit_price` is stored as integer centavos.
- `app/Actions/Buyer/PlaceOrder.php` (or equivalent) — store `unit_price` from `$product->price` as centavos; never divide or multiply by 100 in the action.
- `app/Http/Resources/` — all price fields emit centavos; frontend formats with `formatMoney()`.
- `resources/js/lib/money.ts` — `formatMoney(centavos: number): string` returning `₱1,560`.

**Definition of done:**
- Every `order_items.unit_price` equals the product's `price` field in centavos at time of order.
- `buyer-05-orders` shows ₱780, not ₱78,000.
- Seller dashboard figures are self-consistent.
- Cross-screen reconciliation: cart total = checkout subtotal = buyer detail total = seller detail total for a freshly placed order.
- Unit test: `formatMoney(78000)` → `"₱780"` (if price is stored as ₱ × 100 in cents).

---

### T2-05 · Fix e2e login rate-limit (429 blocks tablet + mobile runs)

**Bug:** FB-02  
**Effort:** S

Fortify's throttle fires when the same credentials are used three times in quick succession (once per Playwright project).

**Files to touch:**
- `config/fortify.php` — add a guard: if `app()->environment('testing', 'local')` skip throttle, or introduce an `E2E_LOGIN_THROTTLE_LIMIT` env var (default 5, set to 1000 in `.env.testing`).
- `.env.testing` — `E2E_LOGIN_THROTTLE_LIMIT=1000`.
- Alternative: `tests/e2e/playwright.config.ts` — set `workers: 1` or serialise the three projects so only one runs at a time and the window resets.

**Files to touch (alternative B — separate test accounts):**
- `database/seeders/E2EUserSeeder.php` — create `buyer-360@example.com`, `buyer-768@example.com`, `buyer-1280@example.com` (same password, same role).
- `tests/e2e/specs/order-lifecycle.spec.ts` — set `BUYER` per project name.

**Definition of done:**
- All three Playwright projects (desktop-1280, tablet-768, mobile-360) complete login without a 429.
- `order-lifecycle.spec.ts` passes on all three projects.

---

## Wave 2 — P0/P1 UI fixes

### T2-06 · Stock enforcement: add out-of-stock guard to cart and checkout

**Finding:** S2, P1a, C3  
**Effort:** S

Extends T2-02 to the cart page and checkout.

**Files to touch:**
- `resources/js/pages/cart.tsx` — show "Out of stock" label on line items with `stock = 0`; disable the qty increment and checkout button for that seller group.
- `resources/js/pages/checkout.tsx` — block "Place order" if any cart item is out of stock; show an inline warning.
- `app/Http/Requests/Buyer/PlaceOrderRequest.php` — validate that all cart items are in stock.

**Definition of done:**
- Cart with a zero-stock item: increment disabled; checkout button disabled; "Out of stock" label visible.
- `POST /checkout` with a zero-stock item → 422 with a cart-level error.
- Feature test covers both.

---

### T2-07 · Order confirmation page

**Finding:** O1, S8 | **Previous ticket:** T-UI-12 (from first-run tasks — re-confirm this is not yet done)  
**Effort:** M

After "Place order" succeeds, the app redirects to the empty cart. A confirmation page is required.

**Files to touch:**
- `app/Http/Controllers/Buyer/CheckoutController.php` — on success, redirect to `route('order-confirmed', $order)`.
- `resources/js/pages/account/order-confirmed.tsx` (new) — shows order reference, total, COD instruction, "View order" and "Continue shopping" buttons.
- `routes/web.php` — `GET /order-confirmed/{order}`.
- `app/Http/Requests/Buyer/ShowOrderConfirmedRequest.php` — verify the order belongs to the authenticated user.

**Definition of done:**
- `POST /checkout` → redirects to `/order-confirmed/{id}`.
- Confirmation page shows order reference and total.
- COD instruction visible when `payment_method === 'cod'`.
- Feature test: place an order → response redirects to confirmation URL; `GET` confirmation URL → 200 with correct reference.
- Update `tests/e2e/specs/order-lifecycle.spec.ts` line 96 to expect `/order-confirmed/` instead of `/cart`.

---

### T2-08 · Toast: ensure flash messages go through Sonner

**Finding:** O2, S8  
**Effort:** XS

`resources/js/components/ui/sonner.tsx` already configures the `Toaster` with `--surface-inverse` / `--foreground-inverse` tokens (dark background, light text, high contrast). The problem is that the order-placed success message is not being dispatched through Sonner — it is being rendered as a custom inline element with no design-system token applied.

The `useFlashToast` hook in `resources/js/hooks/use-flash-toast.ts` bridges Inertia flash data to Sonner. Check whether the checkout controller sets `session()->flash('success', '...')` and whether `useFlashToast` calls `toast()` on that key.

**Files to touch:**
- `app/Http/Controllers/Buyer/CheckoutController.php` — flash a `success` key that `useFlashToast` recognises.
- `resources/js/hooks/use-flash-toast.ts` — confirm it reads the `success` flash key and calls `toast.success(message)`.
- Remove any inline toast markup from `resources/js/pages/cart.tsx` that duplicates the Sonner flow.

**Definition of done:**
- After placing an order, Sonner renders the confirmation toast using `--surface-inverse` tokens (contrast ≥ 4.5:1 is already satisfied by the component).
- No custom hand-rolled toast DOM on the page.
- Toast does not overlap the bottom tab bar (Sonner's `position="bottom-right"` already handles desktop; on mobile the `Toaster` offset must clear the tab bar — add `offset={{ bottom: 'calc(var(--tab-bar-h, 56px) + 8px)' }}` to the `Sonner` call if needed).

---

### T2-09 · Fix order ID to use one canonical format

**Bug:** FB-04 | **Finding:** D2  
**Effort:** S

**Files to touch:**
- `app/Models/Order.php` — `referenceNumber(): string` method, one format for all views.
- `app/Http/Resources/Buyer/OrderResource.php` and `app/Http/Resources/Seller/OrderResource.php` — both use `$order->referenceNumber()`.
- `resources/js/pages/account/order.tsx` and `resources/js/pages/seller/orders/show.tsx` — display `order.reference`.

**Definition of done:**
- Buyer and seller views show an identical order reference string.
- Feature test: same order `reference` in buyer and seller responses.

---

### T2-10 · Fix order timestamp timezone

**Bug:** FB-05 | **Finding:** D3  
**Effort:** S

**Files to touch:**
- `config/app.php` — confirm `'timezone' => 'Asia/Manila'`.
- `app/Http/Resources/Buyer/OrderResource.php` and `app/Http/Resources/Seller/OrderResource.php` — format `placed_at` using `$order->created_at->setTimezone(config('app.timezone'))->isoFormat('MMM D, YYYY h:mm A')` (or equivalent) so both views emit the same formatted string.
- Alternatively, pass a UTC ISO-8601 string and format it consistently on the frontend with one `formatDate()` helper.

**Definition of done:**
- Buyer and seller order views show the same timestamp (same date, same hour, same AM/PM) for the same order.
- Feature test: both resources return a `placed_at` that parses to the same UTC instant.

---

### T2-11 · Brand name from config (remove all "Laravel" hardcodes)

**Finding:** S4, H1, U1 | **Previous ticket:** T-UI-06 (re-confirm not done)  
**Effort:** S

**Files to touch:**
- `app/Http/Middleware/HandleInertiaRequests.php` — share `brandName: config('app.name')`.
- `resources/js/layouts/public-layout.tsx`, `SellerLayout.tsx`, `AdminLayout.tsx` — replace "Laravel" with `usePage().props.brandName`.
- `resources/js/pages/auth/login.tsx`, `resources/js/pages/auth/register.tsx`, `resources/js/pages/auth/verify-email.tsx` — same.
- `resources/views/app.blade.php` — `<title>{{ config('app.name') }}</title>`.
- `resources/js/pages/home.tsx` — footer copy.

**Definition of done:**
- No literal string "Laravel" in any rendered page.
- `APP_NAME=Barakah Market` in `.env` → the brand name appears correctly everywhere.
- Feature test: grep for "Laravel" in all rendered pages returns nothing (use `$browser->assertDontSee('Laravel')` style).

---

### T2-12 · Fix address formatting (strip empty segments)

**Finding:** D1  
**Effort:** XS

**Files to touch:**
- `app/Models/Address.php` — `formattedAddress(): string` filters empty parts before joining with `", "`.
- `app/Http/Resources/Buyer/AddressResource.php` — use `$address->formattedAddress()`.

**Definition of done:**
- An address with a blank barangay/city segment does not produce a "…, , …" double-comma in any view.
- Unit test: address with blank city segment → formatted string has no double comma.

---

### T2-13 · Seller ship modal: add courier and tracking fields

**Finding:** S3, SX2 | **Previous ticket:** T-UI-14 (re-confirm not done)  
**Effort:** S

**Files to touch:**
- `resources/js/pages/seller/orders/show.tsx` — add `courier_name` (text) and `tracking_number` (text) fields to the ship modal; both required.
- `app/Http/Requests/Seller/CreateShipmentRequest.php` — add `required|string` rules for both fields.
- `app/Actions/Seller/ShipOrder.php` — persist courier + tracking in `order_events.metadata`.
- `resources/js/pages/account/order.tsx` — show courier + tracking in the timeline.

**Definition of done:**
- Ship modal has both fields. Submitting without either shows inline validation errors.
- After shipping, buyer order detail shows courier name and tracking number in the timeline.
- Feature test: ship without tracking → 422; with tracking → order status = Shipped.

---

### T2-14 · Show payment method and COD collect amount on seller order

**Finding:** SX4, S3  
**Effort:** S

**Files to touch:**
- `app/Http/Resources/Seller/OrderResource.php` — include `payment_method` and `cod_collect_amount` (= order total for COD orders).
- `resources/js/pages/seller/orders/show.tsx` — add a "Payment" row showing method; for COD show "COD — collect ₱{total} from buyer".

**Definition of done:**
- Seller order detail for a COD order shows "COD — collect ₱1,660 from buyer".
- Seller order detail for a non-COD order shows the payment method name.

---

### T2-15 · Cancel order button: demote to secondary destructive

**Finding:** D4, S7  
**Effort:** XS

`Button` (`components/ui/button.tsx`) has `variant="danger"` (solid red — for primary destructive actions) and `variant="outline"` (neutral outline). The cancel button must not be primary.

**Files to touch:**
- `resources/js/pages/account/order.tsx` — change the cancel `<Button variant="danger" block>` to `<Button variant="outline" className="text-danger border-danger">`. Remove `block` (no full-width). Place it below the primary CTA, not above it.

**Definition of done:**
- Cancel button is not the visually dominant element. It uses the `Button` component with the `outline` variant and no hardcoded colour hex values.

---

### T2-16 · Status badge colour map (consistent across buyer + seller)

**Finding:** B2, SX6, S7  
**Effort:** S

`Badge` (`components/ui/badge.tsx`) already has the correct variants: `success`, `warning`, `info`, `danger`, `neutral`. The problem is that order-status badges are rendered with ad-hoc Tailwind classes on each page instead of going through `Badge`.

**Files to touch:**
- `app/Enums/OrderStatus.php` — add `badgeVariant(): string` returning one of `neutral | info | warning | success | danger`, and `label(): string`. Mapping: `ToShip` → `warning`, `ToReceive` → `info`, `Completed` → `success`, `Cancelled` → `neutral`, `Returned` → `danger`.
- All pages that render a status chip must use `<Badge variant={order.status_badge_variant}>{order.status_label}</Badge>` — no inline colour classes:
  - `resources/js/pages/account/orders.tsx`
  - `resources/js/pages/account/order.tsx`
  - `resources/js/pages/seller/orders/index.tsx`
  - `resources/js/pages/seller/orders/show.tsx`
  - `resources/js/components/order-card.tsx`
  - `resources/js/components/order-row.tsx`
- `app/Http/Resources/` `OrderResource` (buyer) and seller equivalent — include `status_label` and `status_badge_variant` from the enum.

**Definition of done:**
- Every order-status badge in every shell uses `<Badge variant={...}>` — no raw `bg-` or `text-` colour classes on status chips.
- `ToShip` → warning (orange token), `ToReceive` → info (blue token), everywhere.
- Seller uses seller-perspective status labels (e.g. "To Ship" not "To Receive") or explicitly matches the buyer labels by design decision.
- Unit test: all `OrderStatus` values return non-empty `label()` and a valid `badgeVariant()`.

---

### T2-17 · Halal status: wire existing HalalBadge component everywhere

**Finding:** S5, A1, P1c  
**Effort:** M

`HalalBadge` (`components/halal-badge.tsx`) already handles all six statuses correctly, including `na → 'Muslim-friendly' → badge-neutral`. The `badge-neutral` CSS class maps to the `--muted-foreground` / `--surface-muted` tokens — not red. The problems are:

1. The admin moderation detail renders the raw `na` string instead of using `<HalalBadge>`.
2. The product page does not show a halal panel at all.

**Files to touch:**
- `resources/js/pages/admin/moderation/show.tsx` (or `components/moderation-detail-pane.tsx`) — replace the raw "Halal status: na" text with `<HalalBadge status={item.halal_status} />`. Do not create a new badge component.
- `resources/js/pages/product.tsx` — add a halal panel below the product-detail table. Use `<HalalBadge status={product.halal_status} />` for the status line. Show `certification.certifying_body`, `certification.number`, `certification.valid_until`, and `certification.scope` only when `product.certification` is non-null (the `HalalCertificationData` type is already defined in `types/catalogue.ts`).
- `app/Http/Resources/Buyer/ProductResource.php` — ensure `halal_status` and the `certification` object (from `ProductDetail` type) are included in the Inertia props.

**Definition of done:**
- No raw enum key (`na`, `missing`, `expired`) visible in any UI; all go through `<HalalBadge>`.
- Red badge (`badge-danger`) only when `status` is `expired` or `missing` — matching the existing `HALAL` config in `halal-badge.tsx`.
- Product page shows a halal panel; if `certification` is null and status is `na`, only the badge is shown (no empty fields).
- Unit test: all `HalalStatus` enum values round-trip through `HalalBadge` without throwing.

---

### T2-18 · Admin queue filter chip counts

**Finding:** A3  
**Effort:** S

`QueueFilterBar` (`components/queue-filter-bar.tsx`) already renders the filter chips. Wire the counts from the server rather than creating a new component.

**Files to touch:**
- `app/Actions/Admin/GetModerationQueueCounts.php` (new) — returns `[type => count]`.
- `app/Http/Controllers/Admin/ModerationQueueController.php` → `index()` — include counts from the action in the Inertia props.
- `resources/js/pages/admin/moderation/index.tsx` — pass the counts prop to `<QueueFilterBar>`.

**Definition of done:**
- Each filter chip count matches the actual item count for that type.
- Feature test: 3 halal-check + 2 report items seeded → halal chip = 3, report chip = 2.

---

### T2-19 · Seller order tabs: wire OrderStatusTabs component

**Finding:** SO1 | **Previous ticket:** T-UI-13  
**Effort:** S

`OrderStatusTabs` (`components/order-status-tabs.tsx`) is a fully built scrollable tab bar with active-state underline and count badges — it just isn't being used on the seller orders page.

**Files to touch:**
- `resources/js/pages/seller/orders/index.tsx` — replace the current unstyled plain-text tab output with `<OrderStatusTabs selected={status} onSelect={...} counts={counts} />`. The `counts` object comes from the Inertia prop (add it to the controller).
- `app/Http/Controllers/Seller/OrderController.php` → `index()` — include `counts: ['to_ship' => N, 'to_receive' => N, ...]` in the Inertia props.

**Definition of done:**
- Seller order tabs use `<OrderStatusTabs>` — no custom tab markup.
- Each tab shows its count badge when count > 0.
- Active tab has the underline indicator matching the buyer account page style.

---

### T2-20 · Seller header consistency

**Finding:** SO3  
**Effort:** XS

**Files to touch:**
- `resources/js/layouts/seller-layout.tsx` — ensure "View shop" link and user avatar are in the header on all seller pages, not just the dashboard. Read the dashboard's header markup and replicate it in the shared layout component rather than duplicating it per page.

---

### T2-21 · Product price prominence

**Finding:** P1b  
**Effort:** XS

`PriceBlock` (`components/price-block.tsx`) accepts a `size` prop: `'sm' | 'md' | 'lg'`. The `lg` size maps to `text-price-lg` — a design-system token that is already defined in `app.css`. The product page currently passes `size="md"` (the default) or renders the price without `PriceBlock` at all.

**Files to touch:**
- `resources/js/pages/product.tsx` — change the price render to `<PriceBlock price={product.price} was={product.was_price} size="lg" />`. Do not add raw `text-2xl font-bold` classes. The `PriceBlock` component handles both the current price and the strike-through/badge when `was` is present.

**Definition of done:**
- Product detail price uses `<PriceBlock size="lg">` — no hardcoded size or colour classes on the price element.
- On-sale product shows strike-through + discount badge via the existing `PriceBlock` logic.

---

### T2-22 · Seller banner: protect shop name and badges

**Finding:** S10, P1d  
**Effort:** S

`ShopHeader` (`components/shop-header.tsx`) and `ShopCard` (`components/shop-card.tsx`) are the two places the banner/name layout lives. Read both files before touching anything — the fix is in the layout of the name/badge row relative to the banner image, not in new components.

**Files to touch:**
- `resources/js/components/shop-header.tsx` — adjust the avatar/name row so it sits below the banner's bottom edge rather than overlapping it. Use `pt-` padding (not negative margin) so the name is fully visible.
- Confirm `resources/js/components/shop-card.tsx` uses the same structural fix if it also shows a banner.

**Definition of done:**
- Shop name and "Official" / "Halal-only shop" badges are fully visible at 360, 768, and 1280.
- No custom overlay colour values — any scrim uses an existing token (`--surface-inverse` at reduced opacity, or a CSS gradient using existing brand tokens).

---

## Wave 3 — P2 polish

### T2-23 · Dark mode product page: fix token gaps causing white cards

**Finding:** P1h  
**Effort:** M

The dark-mode failure (cards and price strip stay white) is a token-coverage gap, not a per-component fix. The project uses CSS custom properties scoped to `.dark` class variants (see `app.css`). Adding `dark:bg-...` classes on individual components is wrong — it bypasses the token system and will break on a brand swap.

**Files to touch:**
- `resources/css/app.css` — add `.dark` overrides for any surface tokens that are currently only defined for light mode. Specifically check whether `--surface`, `--surface-subtle`, and `--surface-muted` have `.dark` equivalents. The product page cards use `bg-surface` — if `--surface` has no dark override, they stay white.
- Do not touch individual page or component files for this. If a component uses `bg-surface` and the token is correctly dark in `.dark`, it will fix automatically everywhere.
- After the token fix, verify `resources/js/pages/product.tsx` and `resources/js/components/price-block.tsx` use `bg-surface` / `text-foreground` classes (they should already if they follow the design system). If any hard-codes a literal colour (`bg-white`, `bg-[#fff]`), replace it with the appropriate token class.

**Definition of done:**
- In dark mode, product-page cards (price strip, product detail, related items) use the dark surface tokens, not white.
- No new `dark:` Tailwind classes added to individual page or component files — the fix lives in the token sheet.
- Title contrast ≥ 4.5:1 in dark mode (the `--foreground` dark token must satisfy this; check `app.css` dark overrides).

---

### T2-24 · Admin moderation: checklist, reason picker, audit history

**Finding:** A2, A4 | **Previous ticket:** T-UI-18  
**Effort:** M

`HalalVerificationChecklist` (`components/halal-verification-checklist.tsx`), `ReasonPicker` (`components/reason-picker.tsx`), and `AuditLogList` (`components/audit-log-list.tsx`) are already built. `ModerationDetailPane` (`components/moderation-detail-pane.tsx`) is the container. The issue is either that these sub-components are not mounted or that the data props are not passed from the controller.

**Files to touch:**
- `resources/js/components/moderation-detail-pane.tsx` — confirm `<HalalVerificationChecklist>`, `<ReasonPicker>`, and `<AuditLogList>` are rendered and receive the correct props.
- `app/Http/Controllers/Admin/ModerationQueueController.php` → `show()` — include `moderation_events` and `checklist_items` in the Inertia props.
- `app/Http/Resources/Admin/ModerationQueueItemResource.php` — add events and checklist.

**Definition of done:**
- Moderation detail shows checklist items, reason picker, and past decisions with timestamps.
- After approve/reject, a Sonner toast confirms the action and the queue badge decrements.

---

### T2-25 · Container alignment: use one page-width utility consistently

**Finding:** S6, H3  
**Effort:** S

The project already has `--r-panel`, `--r-card`, and layout tokens in `app.css`. The misalignment is caused by different pages using different padding utilities (`px-4`, `px-6`, `px-5`, `container`) without a shared wrapper. Do not create a new CSS token — use the existing Tailwind `container` class (which maps to the project's configured `max-w-screen-xl` or equivalent in `tailwind.config.ts`) consistently.

**Files to touch:**
- Check `tailwind.config.ts` for the existing `container` config (center, padding). If it's already defined, it just needs to be applied uniformly.
- `resources/js/pages/home.tsx` — wrap sections in `<div className="container mx-auto px-4">`.
- `resources/js/pages/product.tsx`, `resources/js/pages/cart.tsx`, `resources/js/pages/checkout.tsx` — same container class.
- Do not change `resources/css/app.css` for this ticket — it is a layout class consistency fix, not a token addition.

**Definition of done:**
- At 1280, the left edge of all section headings aligns with the header logo. Measured visually in a screenshot.
- No new CSS variables or Tailwind config entries added for this ticket.

---

### T2-26 · 768 layout: tablet nav and two-column product

**Finding:** S6, H4, P1j  
**Effort:** M

**Files to touch:**
- `resources/js/layouts/public-layout.tsx` — at `md` breakpoint: show the horizontal category nav row instead of the mobile bottom tab bar (`site-bottom-tabs.tsx`). Read `site-header.tsx` — the category row may already be conditionally hidden.
- `resources/js/pages/product.tsx` — two-column layout at `md`: gallery on the left (`md:w-[45%]`), details on the right. Use the existing grid/flex utilities, no new CSS.

---

### T2-27 · Seed data: realistic content

**Finding:** S4, H2 | **Previous ticket:** T-UI-07  
**Effort:** M

Replace lorem-ipsum product names, test addresses, and E2E Bot references with realistic Filipino halal-marketplace data.

---

### T2-28 · Admin expiring-certificates card: neutral style at zero

**Finding:** A6 | **Previous ticket:** T-UI-17  
**Effort:** XS

`StatCard` (`components/stat-card.tsx`) is likely the card component. Read it to understand how to pass a variant. The fix is conditional: pass `variant="warning"` only when count > 0, otherwise pass `variant="neutral"` (or no variant, which should be the default neutral style). Do not hardcode colours.

**Files to touch:**
- `resources/js/pages/admin/dashboard.tsx` — change the expiring-certificates `<StatCard>` to use a warning variant only when `expiring_certificates > 0`.

**Definition of done:**
- Expiring-certificates card is neutral (not warning-coloured) when count is 0.
- Uses the `StatCard` component's variant prop — no inline style or hardcoded class.

### T2-29 · Auth link style consistency

**Finding:** U4  
**Effort:** XS

Unify all link styles on auth pages: one style for secondary links ("Forgot…"), one for CTAs ("Sign up").

---

### T2-30 · Auth after-register card alignment

**Finding:** U3  
**Effort:** XS

Align the after-register card to the top (same as login/register cards) at 360.

---

## Wave 4 — E2E test fixes (must pass before next audit)

### T2-31 · Update order-lifecycle.spec.ts to expect /order-confirmed/ redirect

**Depends on:** T2-07  
**Effort:** XS

Line 96: change `expect(page).toHaveURL(/\/cart/)` to `expect(page).toHaveURL(/order-confirmed/)`.

---

### T2-32 · Add response-body logging to e2e API helper for 4xx errors

**Effort:** XS

In `tests/e2e/helpers.ts`, the `api()` helper should log the response body when `status >= 400` so future failures show the validation error immediately in the error-context.md, not just the status code.

```ts
// in api(), before return:
if (result.status >= 400) {
    console.error(`[api] ${method} ${url} → ${result.status}`, result.body);
}
```

**Files to touch:**
- `tests/e2e/helpers.ts`

---

## Sequencing

```
Wave 1 (unblock e2e)
  T2-01  T2-02  T2-03  T2-04  T2-05   ← can parallelise; T2-05 unblocks the test suite

Wave 2 (correctness)
  T2-06  T2-07  T2-08  T2-09  T2-10
  T2-11  T2-12  T2-13  T2-14  T2-15
  T2-16  T2-17  T2-18  T2-19  T2-20
  T2-21  T2-22                         ← fully parallelisable within the wave

Wave 3 (polish)
  T2-23  T2-24  T2-25  T2-26  T2-27
  T2-28  T2-29  T2-30                  ← fully parallelisable

Wave 4 (test hygiene)
  T2-31  T2-32                         ← after T2-07 lands
```

Re-run the e2e suite after Wave 1 to confirm `order-lifecycle.spec.ts` passes on all three projects before starting Wave 2.

---

## PR checklist

Each ticket's PR must:
- Pass `vendor/bin/sail bin pint --dirty --format agent`
- Pass `vendor/bin/sail artisan test --compact` (affected tests green)
- Manual 360 / 768 / 1280 check for any page touched
- No new `console.error` in browser logs
- No literal string "Laravel" added in any new file
