# Design system → Laravel/Inertia implementation plan

Port of `docs/design-system` (97 component sheets, 5 shells, 15 reference screens) into the
Laravel 13 + Inertia v3 + React 19 + Tailwind v4 app, for a Philippine Halal multi-vendor
marketplace.

**Strategy: vertical slices.** Each milestone ships working screens end-to-end (domain →
actions → controllers/form requests → components → page → tests). Components are ported
just-in-time by the first milestone that needs them, never speculatively. Every one of the
97 sheets is assigned to exactly one milestone (Appendix A).

> **Halal pass merged 2026-11-05** (`docs/CHANGELOG-halal-pass.md`): adds the 4 halal sheets,
> `--halal*` brand-independent tokens, `.badge-halal(-solid)`, `.pattern-geo`, 16 icons, halal
> sample data with `halal`/`body`/`frozen` product fields, `{{BRAND_NAME}}` docs token resolved
> via `BRAND_NAME` env (default `Amanah`), and 12 reference-markup bug fixes. Baseline verify:
> **948 runs, 0 issues**. On top of the upstream drop, merged fixes: preview grids now use
> `minmax(0,1fr)` (same as the real screen) and the detail-pane title wrapper clips overflow,
> which resolves the 768px pane blow-out upstream shipped with. Note: `data-placeholder-id`/
> `data-spec` and the dot-grid in `media()` were removed upstream — `HALAL_SCREENS_AND_ASSET_
> PROMPTS.md` §1.3 is stale but §3's asset prompt catalog is still the M8 reference.

Legend: `[ ]` todo · `[x]` done · **L** = large/high-risk task (split before starting) ·
`→ M#` = depends on milestone.

---

## 0. Inputs to read before each milestone

| Doc | Use |
|---|---|
| `PORTING.md` | Token wiring, brand runtime, HTML→React mapping, per-component checklist |
| `docs/foundations.md`, `docs/contrast.md` | Token semantics and measured deviations |
| `docs/components/<slug>.md` | Spec: §API/props = contract, §5 responsive, §7 a11y/keyboard, §11 markup, §12 test notes |
| `docs/patterns/*.md` | Cross-component flows (mapped per milestone below) |
| `docs/content-guide.md` | Copy rules (copy lives in props, not components) |
| `docs/AUDIT_FOUNDATIONS_COMPONENTS.md` | Known defects; open IDs are acceptance criteria (Appendix B) |
| `docs/halal.md` | Halal status vocabulary, where badges/cards appear, moderation checks, pre-launch rules |
| `docs/CHANGELOG-halal-pass.md` | What the halal pass changed vs. the previous drop (12 fixes + additions) |
| `docs/HALAL_SCREENS_AND_ASSET_PROMPTS.md` | Domain: certifiers, Halal logistics, merchant badges, moderation flags (§1.3 stale after halal pass; §3 asset prompts still current) |
| `styleguide/screens/*.html`, `sheets/screens.mjs` | Screen composition reference |

## 1. Blocking decisions (resolve before M0)

| # | Decision | Recommendation | Why it blocks |
|---|---|---|---|
| D1 | Dark mode: DS ships brands, no dark theme. App has `.dark` vars, `dark:` classes, appearance page + inline script in `app.blade.php` | **DECIDED 2026-11-05: keep dark mode** (`.dark` retained; only shadcn/compat vars themed — DS components are light-only until a dark brand ships) | Defines token layer in M0 |
| D2 | Icons: DS sprite (`<use href>`) vs `lucide-react` (already a dependency, used across app) | Keep `lucide-react`; DS sprite is Lucide so names map. Audit renamed icons (app has lucide-react 0.475 vs DS lucide-static 1.66; halal pass added 16 icons incl. `moon-star`, `file-badge`, `hand-heart`, `search-check`) | Every component |
| D3 | Browser tests need `pestphp/pest-plugin-browser` (+ Playwright) — not installed; dependency change needs approval | **DECIDED 2026-11-05: deferred** — feature tests only until approved | Test strategy for every milestone |
| D4 | No JS unit test runner. Pure logic (stepper clamp, PH phone format, OTP distribution, ₱ formatting) untestable in isolation | Keep logic in small pure TS modules; cover through browser tests (D3). Revisit Vitest only if gaps appear | Test strategy |
| D5 | `resources/js/components/ui/*` is excluded from `vp check` lint and fmt in `vite.config.ts` | Remove the exclusion once a file is restyled to the DS (it becomes owned code) | Code quality of ~35 owned components |
| D6 | Overlays: native `<dialog>` (DS contract) vs installed Radix Dialog/Sheet | Native `<dialog>` for Modal/BottomSheet/Drawer/ConfirmDialog (spec requires `showModal()` + focus return + backdrop-drag guard). Radix for Popover/Tooltip/Dropdown where it meets §7 | M1 overlay work |
| D7 | Brand source: global config vs per-shop `data-brand` | Global `config('app.brand')` shared via Inertia; per-shop later | M0.6 |
| D8 | Auth: DS has PhoneInput/OTP (phone-first); Fortify is email-based | Keep email auth; phone is a profile/address field. Restyle only | M1 scope |
| D9 | Chat realtime: Reverb + Echo (new deps) vs Inertia polling | Inertia v3 polling for v1; Reverb later | M5 scope |
| D10 | Payments: PH e-wallets/cards need a gateway | COD real; other methods render but create `pending` payments; gateway is a separate project | M3 scope |
| D11 | PH address data (Region → Province → City → Barangay) | Seed from PSGC dataset into tables; confirm source/licence | M3 |
| D12 | Repo housekeeping: `docs/design-system/.tmp/` (14 debug files/PNGs) is staged; `docs/design-system.zip` (18 MB) untracked | Unstage `.tmp/`, add `.tmp/` and the zip to `.gitignore` | Before first commit |

## 2. Constraints (from AGENTS.md)

- All commands via Sail: `vendor/bin/sail artisan …`, `vendor/bin/sail npm …`, `vendor/bin/sail composer …`.
- Backend: business logic in `app/Actions` (`make:action`, single `handle()`); CRUD-only controllers, nouns, thin; one dedicated form request per endpoint (`List/Show/Create/Update/Delete…Request`) holding **all** authorization (`authorize()`, `denyAsNotFound` for hidden resources) and validation. No policies/gates.
- Migrations up-only (no `down`). Models get factories + seeders. Run `vendor/bin/sail bin pint --dirty --format agent` after PHP changes.
- No new dependencies without approval (see D3, D9, D10).
- Stage every new file with `git add`; never commit.
- Tests: Pest feature tests for behaviour; styling-only changes need no tests; run the narrowest set, then ask the user to run the full suite.
- Frontend links/forms use Wayfinder imports (`@/actions`, `@/routes`); the Vite plugin regenerates them in dev/build.
- Deferred props get a Skeleton empty state.

## 3. Definition of done

**Component**

- [ ] Markup matches sheet §11 (roles, `aria-*`, `<time>`, `<mark>`); variants/sizes via props; states default/disabled/loading/error as listed
- [ ] §5 responsive rules (mobile-first `md:`/`lg:` only); §7 keyboard + SR contract; overlay focus-in and focus-return
- [ ] Semantic tokens only (sheet "Tokens used"); no raw hex (scan gate); renders under `data-brand="demo"` unchanged
- [ ] ≥44px touch (`min-h-touch`), 48px primary, `pb-safe`/`pb-sticky-bar` when bottom-pinned, inputs `text-input` (≥16px on touch)
- [ ] No hardcoded copy; status never by colour alone
- [ ] Open audit IDs for this component (Appendix B) resolved

**Screen**

- [ ] Real data from actions/controllers (no stub props at milestone exit)
- [ ] All sample/demo data (catalogue, vouchers, search suggestions, shop media, payment/shipping config) comes from seeders/config; no hardcoded dummy arrays, slug special-cases, or placeholder text in components
- [ ] Form request per endpoint; feature tests for happy path + authorization/validation failure modes
- [ ] Browser test at 360/768/1280, both brands, matching the reference screen (after D3)
- [ ] `vendor/bin/sail npm run check`, `npm run types:check`, `npm run build` pass

**Milestone exit** = all component + screen DoD met, exit criteria below satisfied, user has run the full suite.

---

## M0 — Foundation (non-breaking)

Goal: DS tokens, fonts, base layer and brand runtime live in the app **without breaking the
existing starter-kit pages**.

- [x] **0.1 Tokens + compat layer.** Port `src/tokens.css` (`:root`/`[data-brand]` blocks, media-tier overrides, `@theme inline`, `@utility` set) into `resources/css/app.css`, dropping its duplicate `@import "tailwindcss"`. Replace the shadcn `:root` values. `--halal/--halal-soft/--halal-hover` live **outside** the brand blocks — a trust mark never recolours with the white-label brand (`docs/halal.md` §2). Add a temporary **compat alias block** mapping shadcn names still used by ~200 classes in `resources/js` to DS tokens (`--card/--popover→--surface`, `--muted/--accent→--surface-muted`, `--secondary→--primary-soft`, `--destructive→--danger`, `--input→--border-control`, `--sidebar-*`, `--chart-*`) and their `--color-*` theme entries. Mark the block `/* compat: remove at M1 exit */`.
- [x] **0.2 Brands.** Add `src/brand-demo.css` as the second brand.
- [x] **0.3 Base + variants + recipes.** Port `src/base.css`, `src/variants.css`, `src/components.css` (incl. `.badge-halal`, `.badge-halal-solid`, `.pattern-geo`). Remove the starter `border-color: gray-200` compat rule and `Instrument Sans` override. Check existing pages for regressions from the global `.grid` single-column rule (audit F-05).
- [x] **0.4 Audit foundation fixes still open:** F-06 (select chevron fallback in `select.field`), F-03 (focus clipping on `overflow-hidden` wrappers). F-01, F-02, F-04, A-01, A-02 are already fixed in `src/` — verify they survive the port.
- [x] **0.5 Fonts.** Move Manrope woff2 to `resources/fonts/`, port `@font-face` with relative `url()` (Vite fingerprints), drop `bunny('Instrument Sans')` from `vite.config.ts`.
- [x] **0.6 Brand runtime.** `config('app.brand')` → shared Inertia prop in `HandleInertiaRequests` → `<html data-brand>` in `app.blade.php`. Feature test: brand attribute renders.
- [x] **0.7 Viewport meta.** Add `interactive-widget=resizes-content` (audit CH-01) in `app.blade.php`.
- [x] **0.8 Scan gate.** Port `scripts/scan-violations.mjs` rules (raw hex in component markup) as an npm script over `resources/js/**`; run in `check`.
- [x] **0.9 Housekeeping** per D12; apply D1 removal plan if approved.

Exit: existing auth/settings/dashboard pages render correctly at 360/768/1280 with Manrope and DS colours; existing feature tests green; scan passes.

**Done 2026-11-05:** all M0 items complete — 39 tests green, `npm run check`/`types:check`/`build` pass, scan clean.

## M1 — Core primitives, auth + account shells, existing pages migrated

Goal: first visible milestone. Every current page runs on DS components; compat layer deleted.
Patterns: `states.md`, `validation.md`, `toast-vs-inline.md`.

Components (26) — restyle the existing `ui/*` file where one exists:

- [x] Actions: Button (`ui/button.tsx`; variants default/secondary/outline/ghost/neutral/danger/inverse, sm/md/lg, icon, block, `aria-busy`), IconButton, Link (`text-link.tsx`)
- [x] Forms: FormField (absorbs `input-error.tsx`; FM-05), TextField (`ui/input.tsx`, `password-input.tsx`; prefix/suffix), TextArea (counter; FM-05), Select (native; F-06), Checkbox, Radio (incl. radio-card variant), Switch, OTP input (`ui/input-otp.tsx`; FM-03 autofill)
- [x] Feedback: Banner (`ui/alert.tsx`, `alert-error.tsx`), Toast (`ui/sonner.tsx`; FB-01 single active), Spinner, Skeleton, EmptyState, ErrorState
- [x] Overlays (D6): Modal → BottomSheet (**L**; FB-02), ConfirmDialog (`delete-user.tsx`), Popover/Dropdown (`ui/dropdown-menu.tsx`; FB-04), Tooltip (A-04)
- [x] Data display: Avatar (`ui/avatar.tsx`, `user-info.tsx`), Badge (`ui/badge.tsx`), Card/Panel (`ui/card.tsx`)
- [x] Navigation: Sidebar (**L**; drawer <md, icon rail md, full lg; replaces `ui/sidebar.tsx`), Drawer (replaces `ui/sheet.tsx`)

Shells and pages:

- [x] Auth shell (`styleguide/layouts/auth.html`) replaces `auth-layout.tsx` + `layouts/auth/*`; migrate all `pages/auth/*`
- [x] Account shell (`layouts/account.html`; bottom tabs at md per DS PROPOSED) replaces `app-layout.tsx`, `layouts/app/*`, `layouts/settings/layout.tsx`; migrate `settings/profile`, `settings/security` (2FA modal, passkeys, recovery codes)
- [x] Decide what `dashboard` becomes (account home or redirect) and update `DashboardTest` — implemented as DS account home
- [x] Delete superseded starter chrome (`app-header`, `app-sidebar*`, `nav-*`, `breadcrumbs`, `appearance-tabs`, unused `ui/*`: `navigation-menu`, `collapsible`, `toggle*`, `separator`, `sheet`, `select` if unused) — approved full list; live `appearance-tabs` was restyled and retained
- [x] Remove the M0 compat alias block; scan shows zero shadcn token classes; keep `.dark`/`dark:` (D1: dark mode retained)
- [x] Remove restyled `ui/*` files from lint/fmt ignore (D5)

Tests: existing Auth/Settings feature tests stay green; browser tests for login, register, 2FA modal focus contract, settings at 3 widths.

Exit: no shadcn tokens remain; all current routes on DS shells.

## M2 — Catalogue browse (Home, Category, Search, Product, Shop)

Patterns: `search.md`, `listing-filters.md`, `pdp-sticky-bar.md`.

Backend → M0:

- [x] Models/migrations/factories/seeders: `Category` (tree), `Shop` (verification type: Official Halal Store / IDCP Accredited Merchant), `Product` (`halal` status enum per `docs/halal.md`: `certified|review|expiring|expired|missing|na`, `frozen` flag), `ProductVariation` (≤2 option types), `ProductImage`, `HalalCertification` (certifying body, number, valid_until, document path; morph to product/shop). Status drives listing visibility: `review`/`expired`/`missing` hidden from buyers, `expiring` warns the seller. Sample certifier names (IDCP, HDIP, MinHA) are placeholders — verify against the NCMF accredited list before launch
- [x] Seed realistic Halal catalogue (`sheets/data.mjs` products/shops/categories as source) — `CatalogueSeeder`: 10 top categories + 7 Halal Food children, 2 named shops, 8 named products + 40 filler, variations on Ajwa product
- [x] Actions + query objects: home feed, category listing, search (filters, sort, cursor pagination), product detail (variations, certifications, review aggregate), shop page — `app/Actions/Catalogue/*`
- [x] Controllers + `List…/Show…Request`s; hidden/unpublished products → `denyAsNotFound`
- [x] Inertia infinite scroll / merge props for feeds (`Inertia::scroll` + `<InfiniteScroll>`); deferred props for reviews + "you may also like" (reviews empty until M4)

Components (25):

- [x] Navigation: Header (**L**; NV-01), BottomTabBar (NV-02), SearchInput (FM-04), Breadcrumb, Tabs (NV-03), SegmentedControl (native-radio variant), Pagination + infinite scroll — Pagination ported; pages use `<InfiniteScroll>`, desktop pagination not yet wired to a screen
- [x] Overlays/data: BottomSheet (FB-03; `Dialog kind="sheet"`), Accordion, Carousel (**L**; scroll-snap + zoom dialog, no dependency needed), Rating, KeyValueList
- [x] Forms: QuantityStepper (FM-02)
- [x] Commerce: PriceBlock (₱, CM-04 centavos), SoldCount, VerifiedBadge, ProductCard (CM-01), CategoryTile, ShopCard (A-03), ShopHeader, ProductGallery (Carousel), VariationPicker (CM-03), StickyActionBar, ReviewCard (CM-02, read-only; renders once M4 reviews exist), VoucherCard (display/claim)
- [x] Halal: HalalBadge (soft on cards/surfaces, solid over photos; `short` label + sr-only certifier — never colour alone, never brand-tinted), HalalFacts (PDP strip; `frozen` adds the "Ships frozen" line), HalalCertificateCard (PDP + seller; expiry/expired banners), `coldChainNote` banner for frozen items

Screens:

- [x] Public shell (`layouts/public.html`: Header + BottomTabBar) — `public-layout.tsx`; `welcome.tsx` replaced by `home`
- [x] Home (halal hero + trust strip, `.pattern-geo` banner — geometric only, no religious iconography), Category, Search results ("Halal certified" filter chip pressed by default, removable), Product detail (HalalFacts + HalalCertificateCard + seller-declaration section, variation picker, sticky bar), Shop ("Halal-only shop" badge)

Exit: browse from home → category/search → product → shop on seeded data at 3 widths; Halal certification shown with issuing body + validity.

## M3 — Cart & checkout → M2

Pattern: `cart-checkout.md`.

Backend:

- [x] PH address tables (Region/Province/City/Barangay, D11) + `Address` model (label, default, landmark, mobile)
- [x] `CartItem`, `Voucher` (shop/platform/shipping, conditions, expiry), `ShippingOption` (incl. cold-chain / segregated Halal logistics), `Order`, `OrderItem`, `Payment` (COD + pending methods, D10)
- [x] Actions: add/update/remove cart item, select items, apply/remove voucher, compute totals, place order (`DB::transaction`, stock decrement, one order per shop)
- [x] Controllers + form requests (cart ownership in `authorize()`, stock/variation validity in `rules()` / custom `App\Rules`)

Components (10):
- [x] CartItem, CartShopGroup, VoucherPicker, OrderSummary (halal confirmation line for certified carts — `orderSummary({ halal: true })` in the sheet), AddressCard + picker, AddressForm PH (**L**; cascading Combobox), Combobox (**L**; FM-04), PhoneInput (FM-01), ShippingOptionPicker, PaymentMethodPicker (no instalment/BNPL patterns — `docs/halal.md` §6). `coldChainNote` on cart lines for frozen items.

Screens:
- [x] Cart, Checkout, address book in account shell (`cart.tsx`, `checkout.tsx`, `account/addresses.tsx`).

Tests:
- [x] Totals/voucher rules, stock race on place-order, authorization on others' carts/addresses, validation of PH address chain (`AddToCartTest`, `CartTotalsTest`, `PlaceOrderTest`, `AuthorizationTest`, `AddressTest`).

Exit: seeded buyer places a COD order across two shops. All tests green, lint and scan clean.

## M4 — Orders & reviews → M3

Pattern: `order-tracking.md`.

- [x] Backend: order status machine (enum: ToPay/ToShip/ToReceive/Completed/Cancelled/ReturnRefund), status events/timeline, cancel + return request actions, `Review` (+ photos, anonymous, seller reply, helpful votes)
- [x] Media storage for review photos (disk config; image validation in form request)
- [x] Components (7): OrderCard, OrderStatusTabs, Timeline/OrderTracker, ProgressSteps (FB-05), ReviewForm, RatingInput (FM-07), ImageUploader (**L**; FM-06)
- [x] Screens: Orders list, Order detail, write-review flow; ReviewCard on PDP now uses real reviews

Exit: buyer tracks an order through statuses and reviews a completed item; review appears on PDP. All tests green, lint and scan clean.

## M5 — Chat & notifications → M2 (D9)

Patterns: `chat.md`, `report-flow.md`.

- [x] Backend: `Conversation`, `Message` (text, product ref, order ref, read state), database notifications for order events; `Report` (target morph, reason, details, evidence)
- [x] Polling via Inertia v3 for new messages/unread counts (BottomTabBar badges)
- [x] Components (7): ChatList, ChatThread (**L**), ChatBubble, ChatComposer (CH-01), ChatProductCard/ChatOrderCard, NotificationItem, ReportDialog
- [x] Screens: Chat (master-detail at md+), Notifications; "Chat" entry points from PDP/shop/order; Report entry points on product/review/shop/chat

Exit: buyer ↔ seller conversation with product card; order event notifications; reports stored for M7.

## M6 — Seller centre → M3, M4

- [x] Backend: seller role on `User` + shop ownership (authorization in form requests), seller product CRUD actions enforcing Halal certification fields (status, certifier, number, expiry, file, ingredients, declaration), variant matrix persistence, stock, seller order fulfilment actions, dashboard metrics query, certificate-expiry signal feeding the dashboard warning banner
- [x] Seller shell (`layouts/seller.html`)
- [x] Components (9): TaskCard, StatCard, OrderRow/OrderActionBar, ProductForm sections (incl. "Halal information" section), VariantMatrix (**L**), StockInput, SalesChart (data-table alternative), ShopSettings, DataTable (**L**; table ≥md, cards <md); HalalCertificateCard reuse from M2; expiry warning Banner naming listings at risk
- [x] Screens: Seller dashboard, Seller product form (create/edit, draft/publish), seller orders list/detail, shop settings

Exit: seller lists a certified product with variants, publishes it, fulfils an order placed in M3.

## M7 — Admin moderation → M5, M6

Pattern: `moderation-flow.md`. Sheets: `docs/components/{status-pill, moderation-queue-item, queue-filter-bar, moderation-detail-pane, reason-picker, moderation-action-bar, bulk-action-bar, audit-log, content-preview, halal-verification-checklist}.md`.

### Backend

- [x] **7.1 Migration + models.** `database/migrations/*_create_moderation_queue_items_table.php` — `ModerationQueueItem` (target morph: Product/Shop/Review/Report/Message, `type` enum incl. `halal`, `state` enum `pending|flagged|hidden|suspended|resolved`, `reason_code`, `flagged_by` nullable morph → user/system, `resolved_by`, `resolved_at`, `decision_reason`) and `*_create_moderation_events_table.php` — `ModerationEvent` audit log (queue item FK, admin FK nullable for auto-flags, `action`, `reason`, `meta` json). Both in `app/Models/` with factories + `database/factories/`.
- [x] **7.2 Admin role.** `User::isAdmin()` already exists (`role === 'admin'`); seed an admin user in `DatabaseSeeder`/a dedicated `AdminUserSeeder`; admin sees the admin shell entry point.
- [x] **7.3 Auto-flag actions** (`app/Actions/Moderation/`): `FlagListingKeywords` (prohibited-ingredient keywords on halal-claiming listings, "halal" in title without certificate — run on product create/update via `CreateSellerProduct`/`UpdateSellerProduct` hooks or an observer), `FlagExpiringCertificates` (certificates at 30/7/0 days — scheduled command `moderation:flag-expiring-certificates` in `routes/console.php`), `FlagLogoMisuse` (report-driven, per `docs/halal.md`). Reports from M5 (`Report` model) enqueue queue items too.
- [x] **7.4 Decision actions** (`app/Actions/Moderation/`): `ListModerationQueue` (filters: state, type, age/SLA; cursor pagination), `ShowModerationItem` (target + evidence + certification context), `ApproveModerationItem`, `RejectModerationItem`, `HideModerationItem`, `SuspendModerationTarget`, `BulkResolveModerationItems` — each writes a `ModerationEvent` in `DB::transaction`; reason templates incl. the halal reason set live in a `config/moderation.php` or `App\Enums\ModerationReason`.
- [x] **7.5 Side effects.** Hiding/suspending updates the target (product `halal`/visibility state, shop suspension, review hidden) inside the same transaction; certificate-expiry items link back to the seller dashboard warning (M6).
- [x] **7.6 Controllers** (`app/Http/Controllers/Admin/`, CRUD-only): `DashboardController` (invokable, queue metrics), `ModerationQueueController` (`index`, `show`), `ModerationDecisionController` (`store` — action chosen in request), `BulkModerationDecisionController` (`store`). Routes: `Route::prefix('admin')->name('admin.')` group in `routes/web.php`.
- [x] **7.7 Form requests** (`app/Http/Requests/Admin/`): `ShowAdminDashboardRequest`, `ListModerationQueueRequest` (filter validation), `ShowModerationItemRequest` (`denyAsNotFound` for non-admin), `CreateModerationDecisionRequest` (valid action + required reason template), `CreateBulkModerationDecisionRequest` (ids array, same-state validation). All `authorize(): $this->user()->isAdmin()`.

### Components (10) — `resources/js/components/`

- [x] **7.8** `status-pill.tsx` — StatusPill (state → colour + label map; never colour alone)
- [x] **7.9** `moderation-queue-item.tsx` — MD-01 SLA contrast on tinted row
- [x] **7.10** `queue-filter-bar.tsx` — state/type/SLA filters → query params (Wayfinder)
- [x] **7.11** `moderation-detail-pane.tsx` — master-detail, `aria-current` on active row; pane grid column `minmax(0,1fr)` (never bare `1fr`) so long titles truncate
- [x] **7.12** `reason-picker.tsx` — radio list of reason templates (incl. halal set) + optional free-text
- [x] **7.13** `moderation-action-bar.tsx` — **container query** `@container`/`@3xl`, not `lg:`; pane width drives the inline row
- [x] **7.14** `bulk-action-bar.tsx` — MD-02 z-index under sticky chrome; live-region announces selected count
- [x] **7.15** `audit-log-list.tsx` — `<time>` stamps, admin vs system entries
- [x] **7.16** `content-preview.tsx` — slots rendering the flagged target (reuse ProductCard/ReviewCard/ShopCard read-only)
- [x] **7.17** `halal-verification-checklist.tsx` — every check is manual; "needs a manual check" never auto-approves

### Shell + screens

- [x] **7.18** `resources/js/layouts/admin-layout.tsx` (`layouts/admin.html`): sidebar nav (dashboard, queue), reuse `data-table`/`stat-card` from M6
- [x] **7.19** `resources/js/pages/admin/dashboard.tsx` — counts by state/type, expiring-certificates tile
- [x] **7.20** `resources/js/pages/admin/moderation/index.tsx` — queue list + filter bar + bulk bar
- [x] **7.21** `resources/js/pages/admin/moderation/show.tsx` — detail pane: ContentPreview + HalalVerificationChecklist (halal type) + ReasonPicker + ModerationActionBar + AuditLogList

### Tests — `tests/Feature/Admin/`

- [x] **7.22** `ModerationQueueTest` (list/filter/pagination), `ModerationDecisionTest` (each action + audit event written + target side effect), `BulkModerationTest`, `AutoFlagTest` (keyword flag on product save; expiring-cert command), `AdminAuthorizationTest` (buyer/seller → 403/404 on all admin routes).

Exit: report from M5 and auto-flagged expired certificate both appear in queue and resolve with audit trail. All tests green, lint and scan clean.

## M8 — Hardening

- [x] Replace placeholder media with generated assets per HALAL doc §3 (hero banner, shop banners, vector logos, packshots, gallery slides, compliance mockups)
- [x] Remove any remaining stub props, unused components, dead routes, and TypeScript/linter warnings
- [x] Resolve DS open items: support tickets (ReportDialog + Chat), bulk variation matrix, voice/barcode search chips (PORTING §5)
- [ ] Full browser sweep: all routes × 2 brands × 3 widths; axe pass; focus-return on every overlay
- [ ] iOS Safari + real-device touch check (unverified in DS REPORT)

---

## Appendix A — Component → milestone matrix (97 sheets)

| M | Count | Sheets |
|---|---|---|
| M1 | 26 | button, icon-button, link, form-field, text-field, text-area, select, checkbox, radio, switch, otp-input, banner, toast, spinner, skeleton, empty-state, error-state, modal, confirm-dialog, popover, tooltip, avatar, badge, card, sidebar, drawer |
| M2 | 28 | header, bottom-tab-bar, search-input, breadcrumb, tabs, segmented-control, pagination, bottom-sheet, accordion, carousel, rating, key-value-list, quantity-stepper, price-block, sold-count, verified-badge, product-card, category-tile, shop-card, shop-header, product-gallery, variation-picker, sticky-action-bar, review-card, voucher-card, halal-badge, halal-facts, halal-certificate-card |
| M3 | 10 | cart-item, cart-shop-group, voucher-picker, order-summary, address-card, address-form, combobox, phone-input, shipping-option-picker, payment-method-picker |
| M4 | 7 | order-card, order-status-tabs, timeline, progress-steps, review-form, rating-input, image-uploader |
| M5 | 7 | chat-list, chat-thread, chat-bubble, chat-composer, chat-cards, notification-item, report-dialog |
| M6 | 9 | task-card, stat-card, order-row, product-form, variant-matrix, stock-input, sales-chart, shop-settings, data-table |
| M7 | 10 | status-pill, moderation-queue-item, queue-filter-bar, moderation-detail-pane, reason-picker, moderation-action-bar, bulk-action-bar, audit-log, content-preview, halal-verification-checklist |

Placement rule: a component goes in the first milestone whose screen needs it. Moving one
earlier is fine; moving one later needs its consumers updated.

## Appendix B — Audit items (`AUDIT_FOUNDATIONS_COMPONENTS.md`)

Status checked against `src/` on 2026-11-05. "AC" = acceptance criterion for the React port
(DS `ds.js` behaviour isn't ported, so JS fixes must be re-implemented).

| ID | Status | Where |
|---|---|---|
| F-01 sticky-bar token/utility | Fixed in src | M0 verify |
| F-02 `.on-inverse` colours | Fixed in src | M0 verify |
| F-03 focus ring clipping | Open | M0.4 |
| F-04 dialog exit transition | Fixed in src | M0 verify |
| F-05 global `.grid` override | Accepted (documented) | M0.3 regression check |
| F-06 select chevron | Open | M0.4 / Select |
| F-07 contrast doc wording | Docs only | — |
| A-01, A-02 button busy/hit area | Fixed in src | M1 Button verify |
| A-03 ShopCard tab stops | AC | M2 |
| A-04 Tooltip clipping | AC | M1 |
| FM-01 PhoneInput unified field | AC | M3 |
| FM-02 Stepper clamp | AC | M2 |
| FM-03 OTP autofill | AC (High) | M1 |
| FM-04 Combobox/Search keyboard flip | AC | M2, M3 |
| FM-05 counter live-region spam | AC | M1 |
| FM-06 ImageUploader dropzone | AC | M4 |
| FM-07 RatingInput hover | AC | M4 |
| FB-01 Toast stacking | AC | M1 |
| FB-02 backdrop drag close | AC (guard exists in ds.js) | M1 |
| FB-03 sheet handle on desktop | AC | M2 |
| FB-04 Popover scroll drift | AC | M1 |
| FB-05 ProgressSteps collision | AC | M4 |
| NV-01 Header duplicate logo | AC | M2 |
| NV-02 zero badge | AC | M2 |
| NV-03 Tabs scroll-into-view | AC | M2 |
| CM-01 ProductCard 360 wrap | AC | M2 |
| CM-02 ReviewCard clamp | AC (exists in ds.js) | M2 |
| CM-03 sold-out chip SR | AC | M2 |
| CM-04 centavos rule | AC | M2 PriceBlock |
| CH-01 composer keyboard | M0.7 viewport meta | M0, M5 |
| MD-01 SLA contrast on tint | AC | M7 |
| MD-02 BulkActionBar z-index | AC | M7 |

## Revision log

- v3 (2026-11-06): audit for hardcoded dummy data — home vouchers, header search
  suggestions, shop logo/banner media, checkout payment methods/COD fee, seller
  dashboard metrics/chart fallback, order-row defaults, and the admin moderation
  preview now come from seeders/config or real order/product records instead of
  hardcoded arrays, synthetic analytics, slug special-cases, or placeholder
  text. Added `logo_url`/`banner_url` to shops, a `checkout` config for
  COD/default shipping fees/payment methods, real seller dashboard
  metrics/chart/recent-order props, and a structured moderation preview
  payload. Strengthened the screen DoD to require seeder/config-sourced sample
  data.
- v2 (2026-11-05): restructured from layered phases into vertical-slice milestones; added
  blocking decisions, AGENTS.md constraints, DoD, M0 shadcn compat layer (existing UI
  depends on ~200 shadcn token classes), Halal domain model, audit traceability, patterns
  mapping; added missing badge/card sheets; Sail-prefixed commands; corrected test
  assumptions (no browser plugin or JS runner installed).
