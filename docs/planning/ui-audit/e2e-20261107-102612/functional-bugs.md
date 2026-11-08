# Functional Bugs — e2e-20261107-102612

These are bugs where the application either returns an error, produces wrong data, or violates a business invariant — not purely visual issues. Each includes evidence from the e2e test run and the audit report.

Related UI findings: `findings.md`. Implementation tickets: `tasks.md`.

---

## FB-01 · POST /cart returns 422 (Unprocessable Entity)

**Severity:** P0 — blocks the entire order lifecycle test  
**E2E evidence:** `order-lifecycle.spec.ts` line 72 — `expect(cart.status).toBeLessThan(400)` received `422` at desktop-1280.  
**Affected tests:** desktop-1280 (failed); tablet-768 and mobile-360 (failed downstream, causing the seller and admin tests in the same `serial` suite to be skipped — 4 additional skips).

**Observed behaviour:** `POST /cart` with `{ product_id, qty: 2 }` returns HTTP 422 for the logged-in buyer (`test@example.com`). The product page DOM confirms the product exists and stock is "0 units".

**Likely causes (two candidates):**
1. The cart controller's form request validates `qty <= stock` and the product is at 0, so it correctly rejects the add-to-cart. But the product page still shows the "Add to cart" button as enabled — the front-end does not honour the zero-stock state (see FB-03).
2. The form request has an unrelated validation rule that fails (e.g. a missing required field, or the product variant ID is expected rather than the base `product_id`).

**How to diagnose:**
```bash
vendor/bin/sail artisan tinker --execute '
$product = App\Models\Product::where("slug","quran-with-english-translation-hardcover")->first();
echo "stock: {$product->stock}\n";
echo "id: {$product->id}\n";
'
```
Then manually `POST /cart` with `product_id` and `qty: 2` and read the validation error keys from the 422 JSON body.

**Fix:** Two separate fixes are needed:
1. Determine the actual validation failure and fix the form request or the payload.
2. Fix the UI to disable "Add to cart" / "Buy now" when `stock === 0` (see FB-03 and task T2-02).

**Tests to add:** Feature test — `POST /cart` with a zero-stock product returns 422 with a meaningful `errors.qty` or `errors.product_id` message.

---

## FB-02 · Login rate-limit (429) blocks auth in sequential e2e runs

**Severity:** P1 — blocks the tablet-768 and mobile-360 runs after desktop-1280 has already used the test credentials  
**E2E evidence:** `order-lifecycle.spec.ts` (mobile-360 error-context.md) — `login()` helper times out waiting for navigation away from `/login`. The page snapshot shows a dialog containing an iframe with `heading "429" Too Many Requests`.

**Observed behaviour:** Fortify's login throttle fires when the same credentials (`test@example.com / password`) are used three times (once per Playwright project: desktop → tablet → mobile) within a short window. The 429 is rendered inside a Laravel exception-page iframe in a dialog.

**Fix options (pick one):**
1. Configure the e2e environment to use a very high or disabled throttle for the test user (`config/fortify.php` → `limiters` → custom rate limiter with `by: 'e2e-bypass'`, or set the test environment's `FORTIFY_LOGIN_LIMITER=10000`).
2. Add a `beforeEach` in the test that calls `RateLimiter::clear('login.' . sha1('test@example.com'))` via `php artisan` or a test-only API route before each login attempt.
3. Give each Playwright project a separate test account (e.g. `buyer-360@example.com`, `buyer-768@example.com`, `buyer-1280@example.com`).

**Recommended:** Option 1 — set a dedicated env var. Option 3 is the most robust for production-like environments.

**Tests:** The login helper should assert it never receives a 429; add a check `expect(page.url()).not.toContain('/login')` after `waitForURL`.

---

## FB-03 · Stock = 0 product is purchasable (Add to cart and Buy now enabled)

**Severity:** P0 — business invariant violation; real users can attempt to buy out-of-stock items  
**UI evidence:** `buyer-01-product` at 1280 and 768: product detail panel shows "Stock 0 units" while "Add to cart" and "Buy now" buttons are enabled and interactive.  
**E2E evidence:** The DOM snapshot in all three projects confirms the buttons are present and clickable (no `disabled` attribute). The 422 from `POST /cart` is the backend correctly rejecting the request — but the UI should have prevented the interaction entirely.

**Expected behaviour:**
- When `stock === 0`, both "Add to cart" and "Buy now" must be `disabled` with an "Out of stock" label.
- The product page Inertia prop `product.stock` (or `product.in_stock`) must be passed to the component and used to control the disabled state.

**Fix:**
- Backend: ensure the product Inertia resource includes `in_stock: bool` and `stock: int`.
- Frontend: `resources/js/pages/Buyer/Product.tsx` — `disabled={!product.in_stock}` on both buttons; show "Out of stock" text in place of the stock count when `stock === 0`.

**Tests:**
- Feature test: `GET /products/{slug}` with a zero-stock product → response props include `in_stock: false`.
- Feature test: `POST /cart` with a zero-stock product → 422 with `errors.qty` or `errors.stock`.

---

## FB-04 · Order ID prefix inconsistency between buyer and seller views

**Severity:** P1 — confusing for buyers and sellers cross-referencing orders  
**UI evidence:** `buyer-06-order-detail`: order ID is `#QESW654Y`. `seller-03-order`: same order shows `#F1PQESW654Y`. The seller ID has an additional `F1P` prefix.

**Likely cause:** Buyer and seller views use different order reference formatters, or the seller view is prepending a shop/seller code to the reference.

**Fix:** Decide on one canonical order reference format and render it identically on both buyer and seller views. If the seller prefix is intentional (namespace collisions), display it consistently in both views and document the format.

**Tests:** Feature test — after placing an order, `GET /account/orders/{id}` and `GET /seller/orders/{id}` return the same `reference` string.

---

## FB-05 · Order timestamp shown 8 hours apart on buyer vs seller

**Severity:** P1 — creates confusion and potential disputes  
**UI evidence:** `buyer-06-order-detail`: "Nov 7, 10:26 AM". `seller-03-order`: "Nov 07, 2026 02:26 AM". The difference is exactly 8 hours (UTC+8 vs UTC).

**Likely cause:** One view renders `created_at` in UTC (the stored value) and the other applies the application timezone (Asia/Manila, UTC+8), or one view uses a JS `new Date()` localisation while the other serialises the raw timestamp.

**Fix:** All timestamps must be stored as UTC and formatted server-side (or in a single frontend formatter) using the user's locale and `Asia/Manila` as the display timezone. Set `'timezone' => 'Asia/Manila'` in `config/app.php` if not already set. Use `$order->created_at->setTimezone(config('app.timezone'))->format(...)` or pass a pre-formatted value from the resource.

**Tests:** Feature test — the buyer order detail and seller order detail for the same order return a `placed_at` string that, when parsed, refers to the same UTC instant.

---

## FB-06 · Seller order total arithmetic incorrect (COD fee missing)

**Severity:** P0 — sellers see a wrong amount to collect  
**UI evidence:** `seller-03-order`: Subtotal ₱1,560 + Shipping ₱80 = ₱1,640, but "Total" shows ₱1,660. The ₱20 COD fee line item is absent from the seller view. The buyer checkout correctly shows all three lines.

**Likely cause:** The seller order detail builds its own totals object (subtotal + shipping) without including COD fee, discount, or other adjustments. The buyer view reads the shared `order_totals` record.

**Fix:** Both buyer and seller order detail views must read from the same `OrderTotals` value object (or serialised resource). The seller view must include: subtotal, shipping, COD fee (when applicable), discount, and total. The COD fee should be labelled "COD fee (collect from buyer)".

**Tests:**
- Feature test: seller `GET /seller/orders/{id}` response includes `subtotal`, `shipping`, `cod_fee`, `total` where `subtotal + shipping + cod_fee = total`.
- Unit test: `OrderTotals` correctly sums all components.

---

## Summary table

| ID | Sev | Area | Short description | Blocking e2e? |
|---|---|---|---|---|
| FB-01 | P0 | Cart | `POST /cart` returns 422 (zero-stock product) | Yes — all projects |
| FB-02 | P1 | Auth | Login rate-limit 429 blocks tablet + mobile runs | Yes — 768 + 360 |
| FB-03 | P0 | Stock | Zero-stock product purchasable in UI | No (UI only) |
| FB-04 | P1 | Orders | Order ID prefix differs buyer vs seller | No |
| FB-05 | P1 | Orders | Timestamp 8h apart buyer vs seller | No |
| FB-06 | P0 | Orders | Seller total missing COD fee line | No |
