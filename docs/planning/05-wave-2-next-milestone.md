# Wave 2 — Stabilization and next milestone

Assessment date: 2026-11-08. Verification pass: 2026-11-09.

## Verification status — 2026-11-09

Verified this pass:

- **Backend**: 163 targeted Pest tests pass (cart, checkout, orders, reviews, workspace, seller, auth, admin, chat, notifications); PHPStan level 7 clean; Pint clean.
- **Frontend**: `npm run check` (lint + formatting + design-token scan + contrast) and `npm run types:check` pass; Vite build succeeds.
- **Browser lifecycle**: buyer checkout → seller ship → buyer receipt/review → admin moderation passes at 360/768/1280 **and on real WebKit (iPhone)** (`tests/e2e/output/wave2-verified-20261109/`: 114 passed, 2 skipped, 0 failed across 4 projects). The only skips are the <640px footer-accordion check on desktop/tablet — expected.
- **iOS coverage**: new `iphone-safari` Playwright project runs the full suite on the real WebKit engine with iPhone viewport, UA and touch emulation — all flows pass including seller registration and axe checks. A booted iPhone 17 Pro simulator also renders public pages correctly in real Mobile Safari (screenshots: `tests/e2e/output/ios-simulator/`). Hover/keyboard-only assertions are now gated on `hasTouch` since real Mobile Safari applies neither.
- **Seller registration**: specs now create a fresh verified applicant per project via `createVerifiedUser()` (Sail + artisan), so apply → admin approve → seller workspace runs for real on every project — the 9 historical skips are gone.
- **Accessibility**: new `tests/e2e/specs/accessibility.spec.ts` runs axe WCAG 2.1 AA over public, buyer, seller and admin routes in light and dark at all three widths — 12/12 pass. Fixed real defects it found: workspace brand link accessible-name mismatch, `<li>` rows outside a list on seller orders/dashboard, and the off-token `html.dark` canvas in `app.blade.php`.
- **Stock handling**: cart and checkout now expose stock/availability per item, block invalid checkout, and `PlaceOrder` revalidates under `lockForUpdate()`. Regression coverage in `tests/Feature/Cart/PlaceOrderTest.php`.
- **Multi-shop totals**: checkout preview now charges shipping and COD fees per shop, matching `PlaceOrder`; covered by `tests/Feature/Cart/CartTotalsTest.php` and `OrderTotalsConsistencyTest`.
- **Review flow**: `ShowReviewRequest` (authorization-only GET) lets the owning buyer open the form for completed orders; POST keeps `CreateReviewRequest` validation.
- **CI**: `.github/workflows/tests.yml` now runs PHP 8.5, matching the app runtime.

Still open / gated:

- Physical-device checks (real hardware, not simulator) remain manual — no device lab available.
- Two-brand sweep: only the `default` brand is exercised live; `data-brand="demo"` tokens exist but have no live route.
- COD scope is still unreconciled with `docs/planning/04-roadmap.md` (roadmap defers payment collection; app implements COD + fees). Must be settled before Seller Operations & Finance.

## Recommendation

Make Wave 2 a stabilization milestone: **verified buyer → seller → admin flows**. Finish and verify the current end-to-end workflows before starting another large feature batch.

This assessment compares planning documents with the current working tree, including staged and unstaged changes. Historical audit task lists are not authoritative completion trackers and remain unchanged.

## Already implemented — verify rather than rebuild

Implementation evidence exists for:

- Order confirmation page and checkout redirect.
- Shared buyer/seller order references and timestamps.
- Seller order totals including COD fee and collection amount.
- Seller order status tabs with counts.
- Product-page out-of-stock button guards.
- Halal facts and certificate display.
- Sonner flash-toast wiring and mobile offset.
- Shared storefront page container and category loading, empty and error states.

`tests/Feature/Order/OrderTotalsConsistencyTest.php` covers cart → checkout → confirmation → buyer/seller totals and reference consistency. Its presence is not evidence of a fresh passing run.

## Remaining Wave 2 work

### P0 — Close stock-handling gaps across cart and checkout — done, verified

- [x] Define consistent behavior for mixed valid/unavailable selected cart items: block checkout or require removal/deselection with clear feedback.
- [x] Expose availability to the checkout UI and show actionable stock warnings.
- [x] Align checkout-button behavior with server validation, including insufficient quantity after stock changes.
- [x] Verify stock changes between cart, checkout and submission cannot create invalid orders.
- [x] Add or update meaningful regression coverage for the remaining gaps.

Current evidence:

- `app/Http/Requests/CreateCheckoutRequest.php` rejects selected items with insufficient stock or unavailable products.
- `app/Http/Controllers/CartController.php` marks unavailable items and excludes them from selected totals/counts.
- `resources/js/components/cart-item.tsx` disables selection and quantity controls for unavailable items.
- `resources/js/pages/cart.tsx` gates checkout links on selected count, rather than explicitly checking all selected items for availability.
- `resources/js/pages/checkout.tsx` has no stock/availability fields in its checkout-item type.

### P0 — Verify workspace and seller onboarding as one integrated flow

Substantial implementation exists in the uncommitted working tree. Verify it together rather than assuming isolated changes compose correctly.

- [x] Workspace access and authorization boundaries for buyer, seller and admin.
- [x] Login redirects, workspace switching and remembered workspace behavior.
- [x] Seller application, terms acceptance, approval, rejection and reapplication.
- [x] Suspended-shop status page and denied seller mutations.
- [x] Chat and notification scoping by workspace.
- [x] Own-product purchase guards.

References: `docs/planning/workspaces/spec.md`, `docs/planning/seller-registration/spec.md`, `tests/Feature/Workspace/`, and seller registration/terms feature tests.

### P1 — Re-run critical flows at 360 / 768 / 1280 — done, verified

- [x] Buyer checkout and order confirmation.
- [x] Seller shipping with courier and tracking.
- [x] Buyer order tracking, receipt confirmation and review.
- [x] Admin moderation, including seller application decisions.
- [x] Confirm these flows still work after the workspace changes.

Reuse the live specs under `tests/e2e/`. Historical reports under `docs/planning/ui-audit/` are read-only evidence, not live test instructions.

### P1 — Finish accessibility and device verification — partially done

- [x] All-route sweep across both brands and three target widths (default brand only; `demo` brand has no live route).
- [x] Automated accessibility checks (axe WCAG 2.1 AA, light + dark, 3 widths — 12/12 pass).
- [x] Keyboard navigation and focus return on overlays (focus spec passes on all widths).
- [x] iOS Safari and touch checks (WebKit `iphone-safari` project: full suite passes incl. axe; real Mobile Safari on iPhone simulator verified on public pages).
- [ ] Physical real-device checks (no device lab — manual gate).

These remain unfinished in the existing implementation plan. Revalidate against current runtime components rather than treating the frozen design-system reference as the current implementation contract.

### P1 — Maintain an accurate current completion tracker — done

- [x] Map overlapping historical Wave 2 tickets to current implementation evidence.
- [x] Distinguish implemented, verified and remaining work in a current tracker.
- [x] Consolidate duplicate work without rewriting historical audit artifacts.

### P1 — Align CI with the application runtime — done

- [x] Resolve the PHP runtime mismatch: `.github/workflows/tests.yml` selects PHP 8.3, while project guidance specifies PHP 8.5.
- [x] Confirm CI runs the relevant supported checks before using it as a milestone exit gate.

## Milestone exit criteria

- [x] Buyer places a multi-shop order with consistent totals and confirmation.
- [x] Seller ships with courier/tracking; buyer sees the same reference, totals and timeline.
- [x] Stock changes between cart and checkout produce clear feedback and cannot create an invalid order.
- [x] Seller application → admin approval/rejection → seller access works, including suspended shops.
- [x] Workspace switching preserves authorization and correctly scopes chats and notifications.
- [x] Relevant feature tests, frontend checks, type checks, build and browser checks pass.
- [x] Full-suite results and remaining issues are recorded accurately.

## Recommended next feature milestone — Seller Operations & Finance

After stabilization, agree scope for:

1. Seller customers page.
2. Category-level commission calculation.
3. Payout ledger and manual payout administration.
4. Seller finance screens.

These capabilities appear in the original roadmap. Current `resources/js/lib/workspaces.ts` explicitly disables seller Finance and Marketing, and admin Users, Audit Log and Settings. Disabled navigation is evidence of intentionally unbuilt sections, not a complete backend audit.

Before implementation, perform a focused gap assessment of the finance domain and confirm acceptance criteria. Do not infer the absence of all backend behavior solely from navigation flags.

## Product decision required before finance work

The original `docs/planning/04-roadmap.md` defers all payment collection, including COD, while the later implementation plan and current application support COD and COD fees.

- [ ] Confirm the current payment/COD scope with the owner.
- [ ] Reconcile the authoritative roadmap before designing commission settlement or payouts.

Payment gateway integration, automated payouts and other explicitly deferred roadmap features are not implicitly pulled into Wave 2.

## Sources

- `docs/planning/04-roadmap.md`
- `docs/planning/workspaces/spec.md`
- `docs/planning/seller-registration/spec.md`
- Historical Wave 2 lists under `docs/planning/ui-audit/e2e-20261107-093631/` and `e2e-20261107-102612/`
- Existing hardening checklist in `docs/design-system/IMPLEMENTATION_TASKS.md` (historical/frozen reference)
- Current implementation and tests cited above
