# 07 — E2E Capture Improvements

Source: `ui-audit-implementation-report.md` §5 "Capture and test gaps".
Purpose: specify what must change in the e2e screenshot suite before the **next** audit cycle so the reviewer can evaluate every screen correctly.

See `tests/e2e/` for the test runner, helpers, and scenarios.

---

## 1. Capture method fixes

### CM-01 · Use viewport screenshots for fixed-bar pages

**Problem:** Full-page captures place the fixed bottom tab bar and sticky action bars mid-page instead of at the viewport bottom. This makes it look like bars are floating in the content when they are actually pinned.

**Spec:**

- Switch all screenshot calls to `page.screenshot({ clip: { x: 0, y: 0, width: viewport.width, height: viewport.height } })` (viewport-only) for pages that have a fixed bottom bar: Home, Product, Cart, Checkout, Orders, Order Detail, Seller Dashboard, Seller Orders, Admin Queue, Admin Item Detail.
- Keep full-page (`fullPage: true`) captures only for pages with no fixed elements: Auth pages, Register, Verify Email, Order Confirmed.
- Add a comment in `tests/e2e/helpers.ts` distinguishing the two capture modes.

**Files:**

- `tests/e2e/helpers.ts` — add `screenshotViewport()` alongside existing `screenshotFull()`
- `tests/e2e/specs/` — update each spec to call the correct capture method

---

### CM-02 · Capture timing: wait for network idle + animation settle

**Problem:** `20-login-failed` shows the spinner state instead of the error message, meaning the capture ran during the pending request.

**Spec:**

- After triggering a form submit or navigation, wait for `networkidle` before taking a screenshot: `await page.waitForLoadState('networkidle')`.
- Additionally wait for any CSS transition classes to settle: add a helper `waitForAnimations(page)` that calls `page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running'))`.
- Apply to all spec files that capture post-action states (login-failed, order-placed, after-ship, after-approve/reject).

**Files:**

- `tests/e2e/helpers.ts` — add `waitForAnimations(page: Page): Promise<void>`
- `tests/e2e/specs/*.ts` — use `waitForAnimations` before each screenshot

---

## 2. Missing screen captures (add before next audit)

### CM-03 · Empty states

Capture each list when it has zero items so the reviewer can assess the empty-state component.

| Screen        | Scenario             | Width(s)       |
| ------------- | -------------------- | -------------- |
| Buyer orders  | User has no orders   | 360, 768, 1280 |
| Admin queue   | Queue is empty       | 360, 768, 1280 |
| Cart          | Cart is empty        | 360, 768, 1280 |
| Seller orders | Seller has no orders | 360, 768, 1280 |
| Notifications | No notifications     | 360            |

**Implementation notes:**

- Create a dedicated seeder state or use `--state=empty` factory methods.
- These can be separate spec files (e.g. `tests/e2e/specs/empty-states.ts`) or appended as a second scenario in existing specs.

---

### CM-04 · Error and validation states

Capture inline validation errors and server error pages so the reviewer can verify error UX.

| Screen               | Scenario                                                 | Width(s)       |
| -------------------- | -------------------------------------------------------- | -------------- |
| Login                | Failed credentials (after request completes, not during) | 360, 768, 1280 |
| Register             | Submit with blank fields                                 | 360            |
| Checkout             | Submit with no shipping address                          | 360            |
| Seller ship modal    | Submit without tracking number                           | 360            |
| Admin approve/reject | Confirmation before and after decision                   | 360, 1280      |
| 404 page             | Navigate to non-existent route                           | 360, 1280      |
| 500 page             | Trigger a handled error response (or use a stub)         | 360, 1280      |

**Implementation notes:**

- For 404/500, navigate to `/__test/error?code=404` (or add a test-only route) rather than breaking real URLs.
- For validation states, fill the form partially, click Submit, and wait for the inline error to appear before capturing.

---

### CM-05 · Loading skeleton states

Capture the loading skeleton so the reviewer can verify skeleton layout.

| Screen            | How to trigger                             | Width(s)  |
| ----------------- | ------------------------------------------ | --------- |
| Home product grid | Intercept the products API with a 2s delay | 360, 1280 |
| Seller dashboard  | Intercept stats API with a 2s delay        | 360, 1280 |
| Admin queue       | Intercept queue API with a 2s delay        | 360, 1280 |

**Implementation notes:**

- Use Playwright route interception: `page.route('/api/*', route => setTimeout(() => route.continue(), 2000))`.
- Take the screenshot immediately after navigation, before the delay resolves.
- Restore normal routing after the skeleton screenshot.

---

### CM-06 · Missing screens: Search, Category, Chat, Notifications

These screens were listed as missing from the current suite.

| Screen slug     | Route                 | Widths         | Notes                                 |
| --------------- | --------------------- | -------------- | ------------------------------------- |
| `search`        | `/search?q=dates`     | 360, 768, 1280 | Results present, not empty            |
| `category`      | `/categories/{slug}`  | 360, 768, 1280 | ≥ 3 products shown                    |
| `chat`          | `/chat` (thread list) | 360, 768, 1280 | 2 conversations seeded                |
| `chat-thread`   | `/chat/{id}`          | 360, 768, 1280 | A few messages from both sides        |
| `notifications` | `/notifications`      | 360, 768, 1280 | ≥ 3 notifications, mix of read/unread |

---

### CM-07 · Missing screens: Seller product form and shop settings

| Screen slug            | Route                        | Widths         | Notes             |
| ---------------------- | ---------------------------- | -------------- | ----------------- |
| `seller-product-new`   | `/seller/products/create`    | 360, 768, 1280 | Blank form        |
| `seller-product-edit`  | `/seller/products/{id}/edit` | 360, 768, 1280 | Prefilled product |
| `seller-shop-settings` | `/seller/settings`           | 360, 768, 1280 |                   |

---

### CM-08 · Missing screens: Buyer account pages

| Screen slug    | Route                          | Widths         | Notes         |
| -------------- | ------------------------------ | -------------- | ------------- |
| `address-book` | `/account/addresses`           | 360, 768, 1280 | ≥ 2 addresses |
| `address-edit` | `/account/addresses/{id}/edit` | 360, 768       |               |
| `profile`      | `/account/profile`             | 360, 1280      |               |

---

### CM-09 · Missing screens: Halal certificate upload

| Screen slug         | Route                  | Widths         | Notes                                |
| ------------------- | ---------------------- | -------------- | ------------------------------------ |
| `halal-cert-upload` | `/seller/certificates` | 360, 768, 1280 | Show both valid cert and empty state |

---

## 3. Seed data quality for screenshots

### CM-10 · Use varied, non-repeating rows

**Problem:** Admin queue has 9 identical rows; buyer orders has identical repeated cards.

**Spec:**

- E2E seed must provide ≥ 5 distinct products with different names, categories, and price points.
- Admin queue seed: ≥ 3 different types (halal-check, report-review, shop-application), each with a distinct truncatable title.
- Buyer orders: ≥ 4 orders in different statuses (To Pay, To Ship, Shipped, Completed).
- Seller orders: ≥ 3 orders in different statuses.

---

### CM-11 · Use realistic Filipino names and addresses

**Problem:** "E2E Bot" and "123 E2E Street, , 1000" are visible in review screenshots.

**Spec:**

- Buyer test user: name "Maria Santos", address "123 Rizal Avenue, Tondo, Manila 1012".
- Seller test user: "Juan dela Cruz", shop name "Barakah Pantry".
- All fixture values should look like real data without being real PII.

---

## 4. Dark mode and token-swap captures

### CM-12 · Dark mode screenshots

**Problem:** No dark-mode captures — cannot verify token swap works.

**Spec (defer to Wave 3, after dark-mode tokens land):**

- For each core screen (home, product, cart, checkout, seller-dashboard, admin-queue), add a `--dark` variant using `page.emulateMedia({ colorScheme: 'dark' })`.
- Capture at 360 and 1280 only.
- Slug naming: `01-home--dark--360.png`.

---

### CM-13 · Brand-B token swap captures

**Problem:** No evidence that white-label token swap produces correct results.

**Spec (defer to M8 launch prep):**

- Create a `brand-b` Playwright project config that sets CSS variables to an alternative brand palette.
- Capture home, login, and product at 360 and 1280 with the alternative brand.
- Slug naming: `01-home--brand-b--360.png`.

---

## 5. Re-shoot checklist: broken captures from current run

The following captures from `20261107-093631` need to be re-shot after the relevant code fix lands:

| Current slug            | Problem                                | Fix prerequisite                                    |
| ----------------------- | -------------------------------------- | --------------------------------------------------- |
| `seller-04-ship-modal`  | No modal visible (same as `seller-03`) | T-UI-14 (ship modal fields)                         |
| `20-login-failed`       | Shows spinner, not error message       | T-UI-16 (auth error state) + CM-02 (capture timing) |
| All admin screens       | Storefront shell visible               | T-UI-01 (admin layout fix)                          |
| `buyer-04-order-placed` | Empty cart, no confirmation            | T-UI-12 (order confirmation page)                   |

Trigger a full re-shoot run after Wave 1 and Wave 2 of the implementation tasks complete. Use:

```bash
bash scripts/e2e-run.sh
```

Then re-run the audit against the new `tests/e2e/output/<timestamp>/screenshots/` directory.

---

## 6. Playwright config changes needed

### CM-14 · Separate viewport and full-page projects

Add two named projects in `playwright.config.ts`:

```ts
projects: [
  {
    name: 'viewport-360',
    use: { viewport: { width: 360, height: 740 } },
  },
  {
    name: 'viewport-768',
    use: { viewport: { width: 768, height: 1024 } },
  },
  {
    name: 'viewport-1280',
    use: { viewport: { width: 1280, height: 800 } },
  },
],
```

Specs that need full-page captures use `fullPage: true` explicitly. All other specs default to viewport capture.

**Files:**

- `tests/e2e/playwright.config.ts`

---

### CM-15 · Screenshot naming convention

Standardise on `{screen-slug}--{width}.png` (double dash before width). Current naming is inconsistent (`-` vs `--`, no separator on some files).

**Files:**

- `tests/e2e/helpers.ts` — update the screenshot filename builder
- Existing screenshots are for reference only; renaming is not required retroactively.

---

## Priority order

1. CM-01, CM-02 — fix capture mechanics (blocking: all other captures are unreliable until these land).
2. CM-10, CM-11 — fix seed data (needed for any meaningful re-shoot).
3. CM-03, CM-04 — empty and error states (highest audit value).
4. CM-06, CM-07, CM-08, CM-09 — missing screens.
5. CM-05 — skeleton states (nice to have).
6. CM-12, CM-13 — dark mode and brand-B (deferred to Wave 3 / M8).
