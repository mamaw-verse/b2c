# Seller Video, Staff Accounts & Optional Affiliate — Spec, Implementation Plan & Tasks

Three seller-facing features, specified against the code on `production` (`eb4319c`).

1. **Product video** — one video per product, always the first slide in the gallery carousel.
2. **Shop staff** — a seller may add up to 2 staff members.
3. **Optional affiliate participation** — opt-in per product instead of all-or-nothing.

Sizing: S ≤ 0.5 day, M ≈ 1–2 days, L ≈ 3+ days. Priority: P0 blocks later tasks, P1 core scope, P2 optional.

> **Planning note.** `.ai/rules/planning.md` says wave work is tracked in `07-wave-3-implementation-tasks.md`. This is a new feature set, so it has its own folder (same pattern as `seller-registration/` and `workspaces/`). Add a one-line pointer from `07` once the work is scheduled. Tick tasks here as they land and record decisions in §2.

---

## 0. Findings from the repo that shape this spec

| #   | Finding                                                                                                                                                                                                                                                                                         | Consequence                                                                                                                                                                                                   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | **There is no affiliate code or doc anywhere** on `production` or `develop` (grep for affiliate/referral/promoter: nothing).                                                                                                                                                                    | Feature 3 assumes a program that does not exist here. §6 splits it into **Part A (foundation, only if no program exists elsewhere)** and **Part B (the opt-in the request asks for)**. Gate **G-A0** decides. |
| F2  | Shop access is hard-wired to ownership: `User::shop()` is `hasOne`, `isSeller()` = owns an approved shop, and `$user->shop` / `isSeller()` appear in ~40 files (all `Seller\*Request`, `EnsureWorkspaceAccess`, `Workspace::accessibleBy`, `HandleInertiaRequests`, chat actions).              | Staff cannot be added without a single "which shop does this user operate" resolver (§5.3). This is the bulk of Feature 2.                                                                                    |
| F3  | Chat treats the seller as `conversation->shop->user_id === $user->id` (`SendMessage`, `GetMessages`, `GetConversations`, `Conversation::…`), and the unread count excludes only the viewer's own `sender_id`.                                                                                   | A staff reply would show as unread to the owner (and vice versa). Unread must key on `sender_role`.                                                                                                           |
| F4  | Seller notifications go to `$order->shop->owner` only (`PlaceOrder`, `CompleteOrder`, `MarkOrderReceived`).                                                                                                                                                                                     | Staff need to receive order notifications too.                                                                                                                                                                |
| F5  | Product images: `product_images` rows, `images` max 9, `keep_image_ids` sync in `UpdateSellerProduct` **deletes every image row not in the keep list**. `toCard()`/`thumbnailUrl()` use `images->first()`.                                                                                      | A video must **not** live in `product_images`: the sync would delete it and cards/cart/orders would use it as a thumbnail. Store it separately (§3.2).                                                        |
| F6  | The PDP renders `<Carousel slides=…>` from `p.images`; `Carousel` is image-only (`Media` → `<img>`), with zoom dialog + thumbnails.                                                                                                                                                             | Carousel needs a video slide type.                                                                                                                                                                            |
| F7  | No upload limits are configured in the repo (checked `compose.yaml`, `.devcontainer`, `*.ini/*.conf`). Images alone can be 9 × 5 MB, already above PHP's default `post_max_size`.                                                                                                               | Deployment must raise PHP and web-server limits before video ships (V-01).                                                                                                                                    |
| F8  | `DeleteSellerProduct` deletes image **rows** but not the stored files (only `UpdateSellerProduct` deletes files).                                                                                                                                                                               | Pre-existing leak. Video cleanup must not copy it; fix images in the same task (V-05, small).                                                                                                                 |
| F9  | Money is integer centavos; commission is snapshotted per `order_items` row at `PlaceOrder`; ledger is append-only, idempotent on `(order_id, type)`, credited only from `CompleteOrder` (`.ai/rules/finance.md`). `ResolveReturn` writes a `Refund` ledger entry and does not touch commission. | Affiliate commission must follow the same snapshot + ledger rules (§6).                                                                                                                                       |
| F10 | Postgres in `compose.yaml`; the codebase already uses Postgres-only SQL (`::jsonb`, partial unique indexes in the seller-registration spec). `.env.example` defaults to sqlite.                                                                                                                 | Partial unique indexes are fine, but guard with a driver check or test on pgsql.                                                                                                                              |

## 1. Conventions every task follows

From `.ai/rules/*` and `.ai/guidelines/*`; do not restate in tasks.

- Logic in `app/Actions/<Domain>/<VerbNoun>.php` (`final readonly`, single `handle()`, `DB::transaction()` when several models change).
- Controllers are CRUD-only and thin; never validate/authorize in them. One form request per endpoint named after the method (`CreateXRequest`, `UpdateXRequest`, …); `Response::denyAsNotFound()` where existence must be hidden. **No policies or gates.** Complex checks go in `App\Rules\*`.
- Money = integer centavos. Rates = basis points (matches `categories.commission_bps`). Forms submit pesos/percent; actions convert.
- New tables: ULIDs, factory, `final` model with `#[Fillable]`. Migrations forward-only (no `down()`).
- Navigation only in `resources/js/lib/workspaces.ts`; Wayfinder route helpers, no literal URLs.
- `git add` every new file; never commit.
- UI work: semantic tokens only (`npm run check` runs `scan-violations.mjs`), responsive at **sm (360), md (768), lg (1280)**, never touch `docs/design-system/`; run `optimize:clear` + `npm run build` after UI changes.
- Definition of done: Pest feature tests (happy path + key authorization/validation failures), `composer lint` + PHPStan clean, `npm run check` + `npm run types:check`, and an e2e spec update (360/768/1280 + `iphone-safari`, axe pass).

## 2. Decision gates

Resolve before the dependent tasks start. Defaults are recommendations, not decisions.

| Gate     | Decision                                                                            | Recommended default                                                                                                                                                                                                                                                   | Blocks        |
| -------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **G-A0** | Does an affiliate program already exist outside this repo (another service/branch)? | **Assume no** (F1). If it exists: skip Part A, implement Part B against its interface.                                                                                                                                                                                | AF-01 → AF-06 |
| G-V1     | Video limits                                                                        | MP4 (H.264/AAC) or WebM, **≤ 30 MB, ≤ 60 s**. Size enforced server-side; duration enforced client-side only (no `ffprobe` in the stack).                                                                                                                              | V-02, V-04    |
| G-V2     | Poster/thumbnail                                                                    | **None in v1**: the slide uses `preload="metadata"` and thumbnails show a play tile. Client-captured poster or server `ffmpeg` poster later.                                                                                                                          | V-06          |
| G-V3     | Upload path                                                                         | **Same multipart form** as the product (simplest; matches images). Revisit direct-to-storage if 30 MB on mobile data proves painful.                                                                                                                                  | V-04          |
| G-V4     | Video moderation                                                                    | Goes live immediately; covered by the existing product **Report** flow. Not added to the moderation queue in v1.                                                                                                                                                      | —             |
| G-S1     | Staff permissions                                                                   | One fixed **staff** role. Staff: dashboard, products (create/edit), orders, fulfillments, returns, chat, customers. **Owner-only:** finance, payouts, payout account, shop settings, vouchers, staff management, affiliate fields. No per-staff granular permissions. | S-04, S-06    |
| G-S2     | Adding staff                                                                        | **Invite by email, staff accepts** (signed link, 7-day expiry). Pending invites count toward the cap of 2.                                                                                                                                                            | S-01 → S-03   |
| G-S3     | Membership rules                                                                    | A user may be staff of **one** shop; a shop owner cannot be staff; an active staff member cannot apply for their own shop; staff cannot buy from or follow their own shop.                                                                                            | S-01, S-05    |
| G-A1     | Backfill of existing products                                                       | `affiliate_enabled = false` when no program exists (F1). If G-A0 = "exists", backfill **to true** to preserve current behaviour, then let sellers opt out.                                                                                                            | AF-02         |
| G-A2     | Rate model                                                                          | Per-product rate in basis points, bounded by platform `min_bps`/`max_bps`; null = platform default. Proposed starting values (**need business sign-off**): default 500 (5%), min 100, max 3000.                                                                       | AF-02, AF-03  |
| G-A3     | Who funds the affiliate commission                                                  | **The seller**, deducted from the sale proceeds at completion (this is what "control over margins" implies). Platform commission is unchanged.                                                                                                                        | AF-05         |
| G-A4     | Refund handling                                                                     | Approved refunds reverse affiliate commission proportionally (new negative/positive adjustment entries, never edits). Needs confirmation because platform commission is **not** reversed on refund today (F9).                                                        | AF-05         |

---

## 3. Feature 1 — Product video

### 3.1 Behaviour

- A product has **0 or 1** video. Sellers upload/replace/remove it in the product form (create and edit).
- On the product page the video is **slide 1** of the carousel, before all photos. If there is no video the carousel is unchanged.
- Catalogue cards, search, cart, checkout and order thumbnails keep using the first **image** (a video never becomes a thumbnail).
- No autoplay. Native controls, `playsInline`, `preload="metadata"`. Only one media element plays; leaving the video slide pauses it.

### 3.2 Data model

New migration `add_video_to_products_table` (nullable columns on `products`; one video per product needs no extra table):

```php
$table->string('video_path')->nullable();        // path on the `public` disk, e.g. product-videos/abc.mp4
$table->unsignedSmallInteger('video_duration')->nullable(); // seconds, from the client; informational
```

- Store the **disk-relative path**, not a full URL (existing images store full URLs, which makes a disk change painful). Expose the URL through an accessor `Product::videoUrl()` using `Storage::disk('public')->url()`.
- Add both columns to `Product` `#[Fillable]` and the docblock.

### 3.3 Backend

| Piece                                                       | Change                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CreateSellerProductRequest` / `UpdateSellerProductRequest` | `'video' => ['nullable', 'file', 'mimetypes:video/mp4,video/webm', 'max:30720']`, `'video_duration' => ['nullable', 'integer', 'min:1', 'max:60']`, `'remove_video' => ['boolean']`. `file` already rejects arrays, so "only one" is enforced by the rule.                                                                                             |
| New `Seller\SyncProductVideo` action                        | `handle(Product $product, ?UploadedFile $video, bool $remove): void` — stores to `product-videos/`, deletes the previous file when replacing or removing, updates the two columns. Called from `CreateSellerProduct` and `UpdateSellerProduct` inside their transaction. Files are written after the DB work succeeds; on failure delete the new file. |
| `DeleteSellerProduct`                                       | Delete the video file (and, fixing F8, the image files) after the transaction commits.                                                                                                                                                                                                                                                                 |
| `Product::toDetail()`                                       | Add `'video' => $this->video_path ? ['url' => …, 'duration' => …] : null`. **Do not** change `images`, `toCard()` or `thumbnailUrl()`.                                                                                                                                                                                                                 |
| `Seller\ProductController@edit`                             | Add `video` (`url`, `duration`) to `productData`.                                                                                                                                                                                                                                                                                                      |
| `ShowModerationItem` (P2)                                   | Include `video` so moderators can see it on product items.                                                                                                                                                                                                                                                                                             |

### 3.4 Frontend

- **`Carousel`** (`components/carousel.tsx`): `CarouselSlide` gains `type?: 'image' | 'video'`. A video slide renders `<video controls playsInline preload="metadata" src="…#t=0.1">` in the same aspect ratio; thumbnails show a `Play` icon tile (`aria-label="Product video"`). The zoom button is hidden on the video slide (native fullscreen is available in the controls). Moving to another slide (button, thumbnail, keyboard, swipe via `onScroll`) calls `pause()`. The "n of N" counter includes the video.
- **`product.tsx`**: build `slides` as `[video?, ...images]`.
- **`VideoUploader`** (new `components/video-uploader.tsx`, modelled on `ImageUploader`): single slot; shows the existing video or a local preview; rejects files over 30 MB and, via `loadedmetadata`, over 60 s with an inline error; "Remove" sets `remove_video`; passes `video_duration`. Accessible labels and a live region like `ImageUploader`.
- **`seller/products/form.tsx`**: new "Product video" panel after "Photos"; extend `transform` with `video`, `video_duration`, `remove_video`.
- Touch risk: horizontal swipe on the native seek bar can fight the carousel's scroll-snap. Verify on `iphone-safari`; fallback is a poster + play overlay that opens the video in the existing zoom dialog.

### 3.5 Tasks

- [x] **V-01 Infra limits (S, P0).** Raise `upload_max_filesize` / `post_max_size` (≥ 128M, covers 9 × 5 MB + 30 MB) and the web server body limit (`client_max_body_size`) in the deploy config and Sail/devcontainer; document in the README.
- [x] **V-02 Schema + model (S, P0, G-V1).** Migration, `Product` fillable/docblock/`videoUrl()`, factory state `withVideo()`.
- [x] **V-03 `SyncProductVideo` action (M, P0).** Store/replace/remove with file cleanup. Tests: stores file and columns; replace deletes old file; remove clears both; failed transaction leaves no orphan file (`Storage::fake('public')`).
- [x] **V-04 Requests + wiring (S, P0, G-V1, G-V3).** Rules above in both requests; call the action from create/update. Tests: bad mime 422, oversize 422, array of videos 422, other shop's product 404, update without a video leaves the existing one.
- [x] **V-05 Delete cleanup (S, P1).** `DeleteSellerProduct` removes video and image files after commit. Test: files gone after delete.
- [x] **V-06 Read side (S, P0, G-V2).** `toDetail()` `video`, edit-page props. Tests: `video` present/null; `toCard()['image_url']` still the first image; cart/order thumbnails unchanged.
- [x] **V-07 Carousel video slide (M, P1).** Slide type, pause-on-leave, play-tile thumbnail, zoom disabled for video, counter. Unit-level test of slide ordering; manual check at sm/md/lg.
- [x] **V-08 `VideoUploader` + product form (M, P1).** Client size/duration validation, replace/remove, error display, `a11y`.
- [x] **V-09 e2e (S, P1).** `seller-products.spec.ts`: upload a small mp4 on create, replace, remove. `product-detail.spec.ts`: video is slide 1, controls present, no autoplay, leaving the slide pauses; 360/768/1280 + `iphone-safari`, axe.
- [x] **V-10 Moderator preview (S, P2).** Video in `ShowModerationItem` + detail pane.

---

## 4. Feature 2 — Shop staff (max 2)

### 4.1 Behaviour

- The shop **owner** invites up to **2** staff by email from a new **Team** page. Pending invitations count toward the cap; removing or declining frees a slot.
- The invitee receives an email with a signed link (7-day expiry), signs in with that email, and accepts or declines.
- Active staff see the Seller Centre for that shop with the permission set in G-S1. They are not owners: no finance, payouts, payout account, shop settings, vouchers, team management or affiliate fields.
- Staff can leave the shop; the owner can remove staff at any time (effective immediately).
- Staff receive the same order notifications as the owner; chat is shared between owner and staff.

### 4.2 Data model

New table `shop_staff` (ULID, `final` model `ShopStaff`, factory):

| Column                      | Notes                                                                            |
| --------------------------- | -------------------------------------------------------------------------------- |
| `shop_id`                   | FK → `shops`, cascade delete, indexed                                            |
| `user_id`                   | nullable FK → `users`, set on acceptance, `nullOnDelete`                         |
| `email`                     | invited email, lower-cased                                                       |
| `status`                    | `pending` \| `active` (enum `ShopStaffStatus`); declines/removals delete the row |
| `invited_by`                | FK → `users`                                                                     |
| `invited_at`, `accepted_at` | timestamps                                                                       |

Indexes: unique `(shop_id, email)`; Postgres partial unique `shop_staff (user_id) WHERE user_id IS NOT NULL` (one shop per staff member, G-S3). Config: `config('marketplace.seller.max_staff')`, default `2`, so the cap is not a magic number in code.

### 4.3 Access resolution (the core change)

- `User::staffMembership(): HasOne<ShopStaff>` (active only).
- `User::operatedShop(): ?Shop` — the owned shop, else the active-staff shop; `null` if that shop is not `Approved`.
- `User::ownsShop(): bool` and `User::isShopStaff(): bool`. **`isSeller()` keeps meaning "owner of an approved shop"** so admin screens and existing logic do not change.
- `Shop::isOperatedBy(User)`, `Shop::operators(): Collection<User>` (owner + active staff).
- `Workspace::accessibleBy` (Seller) and `EnsureWorkspaceAccess` use `operatedShop()`; a suspended shop blocks staff exactly as it blocks the owner.
- `HandleInertiaRequests` shares `seller.role = 'owner' | 'staff'` (from `operatedShop()`).

Endpoint matrix (per G-S1). "Operated" = owner or staff, "Owner" = owner only:

| Access   | Requests                                                                                                                                                                                                                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operated | `ShowSellerDashboard`, `ListSellerProducts`, `CreateSellerProduct`, `EditSellerProduct`, `UpdateSellerProduct`, `DeleteSellerProduct`, `ListSellerOrders`, `ShowSellerOrder`, `CreateFulfillment`, `UpdateFulfillment`, `ResolveOrderReturn`, `CreateSellerOrderChat`, `ListSellerCustomers`, `ShowSellerCustomer`, seller chat/notifications |
| Owner    | `ListSellerFinance`, `CreatePayout`, `UpdatePayoutAccount`, `EditShopSetting`, `UpdateShopSetting`, `ListSellerVouchers`, `Create/Update/DeleteSellerVoucher`, all staff-management requests, `affiliate_*` fields on product requests                                                                                                        |

Owner-only requests authorize with `$user->ownsShop() && $user->shop->isApproved()` and return `denyAsNotFound()`. Operated requests swap `$user->shop` for `$user->operatedShop()`. Controllers that call `$request->user()->shop` change to `operatedShop()`.

### 4.4 Backend

| Piece         | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Routes        | Owner: `resource('seller/staff', ShopStaffController)` → `index`, `store`, `destroy` (`destroy` also allowed for the staff member removing themselves). Invitee (buyer workspace, signed): `staff-invitations/{staffInvitation}` → `show`, `update` (accept), `destroy` (decline).                                                                                                                                                                                             |
| Requests      | `ListShopStaffRequest`, `CreateShopStaffRequest` (rules: valid email; not the owner; not already invited/active on this shop; not an owner or active staff elsewhere; cap via `App\Rules\ShopStaffLimit`), `DeleteShopStaffRequest` (owner, or the member themself), `ShowShopStaffInvitationRequest` / `UpdateShopStaffInvitationRequest` / `DeleteShopStaffInvitationRequest` (signed, logged-in email matches, invite still pending and unexpired, user eligible per G-S3). |
| Actions       | `Seller\InviteShopStaff` (locks the shop row, re-checks the cap, creates the row, sends `ShopStaffInvitationNotification` via `Notification::route('mail', $email)` with a temporary signed URL), `Seller\AcceptShopStaffInvitation`, `Seller\RemoveShopStaff`. All write `RecordAuditLog` entries (`shop.staff.invited                                                                                                                                                        | accepted | removed | left`, subject = shop). |
| Chat          | `SendMessage`, `GetMessages`, `GetConversations`, `Conversation` participant check, and the seller dashboard unread query use `Shop::isOperatedBy()`. Unread counts for the seller scope count messages with `sender_role = buyer` (F3), both in `HandleInertiaRequests` and `GetSellerDashboard`.                                                                                                                                                                             |
| Notifications | Replace `$order->shop->owner?->notify(...)` in `PlaceOrder`, `CompleteOrder`, `MarkOrderReceived` with `Notification::send($order->shop->operators(), …)`. Shop-application notifications stay owner-only.                                                                                                                                                                                                                                                                     |
| Guards (G-S3) | `CreateShopRegistrationRequest::authorize` also denies active staff; `CreateCheckoutRequest` and `FollowShopRequest` also block staff of that shop.                                                                                                                                                                                                                                                                                                                            |
| Admin (P2)    | `ListAdminUsers`/`ShowAdminUser` show "Staff at <shop>".                                                                                                                                                                                                                                                                                                                                                                                                                       |

### 4.5 Frontend

- `workspaces.ts`: add `roles?: ('owner' | 'staff')[]` to `WorkspaceNavItem`; `navGroups()` filters by the shared `seller.role`. Owner-only items (Finance, Marketing/Vouchers, Settings, **Team**) carry `roles: ['owner']`. New nav item **Team** (`lucide` `Users`), gated by a new `'seller.team'` feature flag flipped to `true` when shipped.
- New `pages/seller/staff.tsx`: "x of 2 seats used", invite form (email), list with status pill (Pending/Active), remove with `confirm-dialog`. Table on lg, stacked cards on sm/md.
- New `pages/account/staff-invitation.tsx`: shop name, what staff can and cannot do, Accept / Decline.
- Staff see no owner-only nav, and direct URLs to owner pages 404 (server enforced; the nav is a convenience).

### 4.6 Tasks

- [x] **S-01 Schema + models (M, P0, G-S2, G-S3).** `shop_staff` migration, `ShopStaff` + enum + factory, config cap, relations on `Shop`/`User`.
- [x] **S-02 Access resolver (M, P0).** `operatedShop()`, `ownsShop()`, `isShopStaff()`, `Shop::isOperatedBy/operators`; update `Workspace`, `EnsureWorkspaceAccess`, shared Inertia props. Tests: owner unchanged, active staff gets seller workspace, pending/removed staff 404/redirect, suspended or unapproved shop blocks staff.
- [x] **S-03 Convert seller requests/controllers (L, P0, G-S1).** Apply the §4.3 matrix to all ~25 `Seller\*Request` classes and the controllers that read `->shop`. Tests: a parameterised Pest dataset over every owner-only route (staff → 404) and every operated route (staff → 200), plus other-shop denial.
- [x] **S-04 Invite flow (L, P1, G-S2).** `InviteShopStaff`, notification, signed accept/decline endpoints, `RemoveShopStaff`, `ShopStaffLimit` rule, audit logs. Tests: cap at 2 including pending, race on the last seat (lock), expired/forged link, wrong email, already staff elsewhere, owner can't be staff, remove frees a slot, staff can leave.
- [x] **S-05 Guards (S, P1, G-S3).** Registration, checkout and follow blocks. Tests for each.
- [x] **S-06 Chat + notifications (M, P1).** Chat authorization, `sender_role`-based unread counts, `operators()` notifications. Tests: staff replies don't mark unread for owner; staff receive `SellerOrderNotification`; buyer unaffected.
- [x] **S-07 Team UI (M, P1).** `seller/staff.tsx`, invitation page, nav `roles` filter, `seller.team` flag. `npm run check` clean at sm/md/lg.
- [x] **S-08 e2e (M, P1).** Owner invites → staff accepts → staff sees orders/products but not finance/settings/vouchers; staff removed loses access; cap message at 3rd invite; 360/768/1280 + `iphone-safari`, axe.
- [x] **S-09 Admin visibility (S, P2).**

---

## 5. Feature 3 — Optional affiliate participation

### 5.1 Behaviour (the requested change — Part B)

- Each product has an **Affiliate** setting: off by default, or on with a seller-chosen commission rate.
- Only products that are **on** can earn affiliate commission. A seller with every product off is simply not in the program; no shop-level forced enrolment.
- Changing the setting affects **future** orders only. Orders already placed keep the rate snapshotted on their items.
- Only the shop **owner** can change affiliate settings (staff cannot, G-S1) because the setting moves margin.

### 5.2 Part B data and logic (needed in all cases)

Migration `add_affiliate_options_to_products_table`:

```php
$table->boolean('affiliate_enabled')->default(false)->index();
$table->unsignedSmallInteger('affiliate_commission_bps')->nullable(); // null = platform default
```

Backfill per G-A1. Config `marketplace.affiliate` = `default_bps`, `min_bps`, `max_bps` (values per G-A2), readable through `Settings::marketplaceInt()` so admins can override them like other platform settings.

- **Requests** (`Create/UpdateSellerProductRequest`): `affiliate_enabled` boolean; `affiliate_commission_percent` `required_if:affiliate_enabled,true`, numeric within `min_bps/100`–`max_bps/100`. For staff both fields are `prohibited` (rules checked in `rules()`, not the controller).
- **Actions**: `CreateSellerProduct` / `UpdateSellerProduct` convert percent → bps and save. When the toggle is switched off, keep the stored rate so re-enabling restores it.
- **`ResolveAffiliateRate`** (new action): `handle(Product): ?int` → `null` if the product is not eligible, else its rate or the platform default. Single source of truth for attribution and for the seller preview.
- **`Product::scopeAffiliateEligible`**: published + buyer-visible + `affiliate_enabled` + shop approved and not suspended. The affiliate-facing link generator and any catalogue of promotable products use this scope only.
- **Attribution rule**: a referral earns only when `ResolveAffiliateRate` returns non-null **for that order item at `PlaceOrder`**. A referral link to a non-participating product still opens the page but earns nothing.
- **Seller form**: new "Affiliate" panel (owner only) with a `Switch`, a percent input shown when on, and a live read-only breakdown at the current price/sale price: affiliate earns ₱X, platform commission ₱Y, you keep ₱Z. The server remains the source of truth.
- **Seller product list**: show an "Affiliate x%" badge (P2) and a bulk "Enable/disable affiliate" action using the existing `bulk-action-bar` (P2).

### 5.3 Part A — minimum foundation (only if G-A0 = "no program exists")

Kept deliberately small so Part B has something to gate. Anything beyond this is a separate spec.

- `affiliate_profiles` (ULID, `user_id` unique, `code` unique, `status` active|suspended). Any verified non-admin, non-staff-of-that-shop user can activate one from the buyer workspace.
- Referral capture: `?ref=CODE` on product/shop URLs sets a first-party cookie (30 days, last click wins); middleware `CaptureAffiliateReferral`.
- `PlaceOrder`: for each item, if the cookie resolves to an active profile that is **not** the buyer, the shop owner or staff, and `ResolveAffiliateRate` is non-null, snapshot on `order_items`: `affiliate_profile_id`, `affiliate_bps`, `affiliate_amount` (centavos, same rounding as `commission_amount`). Rate is never recomputed afterwards (F9).
- Ledger (G-A3, G-A4): new `LedgerEntryType::AffiliateCommission` (negative, shop-side) credited from `CompleteOrder` through `CreditSellerLedger` with the same `(order_id, type)` idempotency; refunds add a proportional adjustment in `ResolveReturn`. Affiliate-side earnings are recorded as accruals (`affiliate_earnings`: profile, order item, amount, status pending|available, `available_at` from the existing hold days). **Affiliate payouts and dashboards are out of scope.**

### 5.4 Tasks

- [x] **AF-00 Confirm G-A0 (S, P0).** Find out whether a program exists elsewhere; confirm G-A1–G-A4 with the business owner.
- [x] **AF-01 Product schema + config (S, P0, G-A1, G-A2).** Migration, `Product` fillable/casts/docblock, `marketplace.affiliate` config, factory states `affiliateEnabled()`.
- [x] **AF-02 `ResolveAffiliateRate` + scope (S, P0).** Tests: disabled → null, enabled with rate, enabled with null rate → default, unpublished/hidden/suspended shop → null.
- [x] **AF-03 Requests + actions (M, P1).** Rules, percent↔bps conversion, owner-only enforcement. Tests: opt-in saves rate, out-of-bounds rate 422, rate required when on, staff submission 422 (G-S1), toggle off keeps rate, default off on new products.
- [x] **AF-04 Seller UI (M, P1).** Affiliate panel with live breakdown in `seller/products/form.tsx`; hidden for staff. sm/md/lg check.
- [x] **AF-05 Part A foundation (L, P1, only if G-A0 = no).** Profiles, referral capture, `order_items` snapshot, `AffiliateCommission` ledger entry, refund adjustment, accruals. Tests: earns only on enabled products, no self-referral (buyer, owner, staff), snapshot unchanged after the seller edits the rate, completion idempotent, refund adjusts proportionally.
- [x] **AF-06 Buyer-workspace affiliate page (M, P2, only if G-A0 = no).** Activate profile, copy link for eligible products with their rate.
- [x] **AF-07 Product list badge + bulk toggle (S, P2).**
- [x] **AF-08 e2e (S, P1).** Seller enables a product at 5%, a referral order credits the ledger; disabled product earns nothing; staff cannot see the panel; 360/768/1280, axe.

---

## 6. Order of work and rollout

1. **Independent starts:** V-01/V-02, S-01, AF-00/AF-01 can begin in parallel.
2. **S-02 → S-03 must land before any staff UI.** S-03 is the riskiest change (touches ~25 requests); ship it behind no UI first, then enable S-04/S-07.
3. **AF-03/AF-04 depend on S-03** only for the owner-only rule; until then the owner is the only operator, so they can ship earlier if needed.
4. Suggested release slices: **(1)** Video (V-01 → V-09), **(2)** Staff (S-01 → S-08), **(3)** Affiliate opt-in (AF-00 → AF-04, plus AF-05/06 if required).
5. Each slice is independently shippable and each migration is additive with safe defaults (nullable columns, `affiliate_enabled = false`, empty `shop_staff`).

## 7. Risks and open questions

- **Affiliate premise (F1):** if the business believes a program already runs, confirm where before spending on Part A.
- **Refund policy (G-A4):** platform commission is not reversed on refund today; reversing affiliate commission but not platform commission is an inconsistency the business should decide on deliberately.
- **Mobile video upload:** 30 MB on mobile data inside a multipart form with up to 9 photos can time out; watch failure rates and consider direct-to-storage (G-V3).
- **Unmoderated video (G-V4):** relies on user reports; revisit if abuse appears.
- **Duration is client-trusted** without `ffprobe`; the 30 MB cap is the real server-side bound.
- **Staff data exposure:** staff can open customers and orders. `GetSellerCustomer` already hides email/phone; keep it that way and include a test.
- **Auth refactor regressions (S-03):** the parameterised route matrix test is the safety net; do not skip it.
