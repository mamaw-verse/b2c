# Seller Video, Staff Accounts & Optional Affiliate — Spec, Implementation Plan & Tasks

Three seller-facing features, specified against the code on `production` (`eb4319c`). **Revision 2** (this edit) is aligned to commit `4715692`, where all tasks in §3.5, §4.6 and §5.4 landed, and to the business answers recorded in §7.

1. **Product video** — one video per product, always the first slide in the gallery carousel.
2. **Shop staff** — a seller may add up to 2 staff members.
3. **Optional affiliate participation** — opt-in per product instead of all-or-nothing.

### Status at a glance (Revision 2)

| Area                      | State                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| Video (V-01 → V-10)       | **Done.** Follow-ups in §8.1 (S3 video upload & signed-URL delivery) and §8.2 (admin moderation). |
| Staff (S-01 → S-09)       | **Done**, but the permission set changed (§7, answer 5). Follow-ups in §8.3.                      |
| Affiliate (AF-00 → AF-08) | **Done, then parked.** No further affiliate work until the items in §5.0 are answered.            |
| Payables / payouts (new)  | **Done (P-01 → P-06).** P-07 e2e to be handled by user. §8.4.                                     |

Sizing: S ≤ 0.5 day, M ≈ 1–2 days, L ≈ 3+ days. Priority: P0 blocks later tasks, P1 core scope, P2 optional.

> **Planning note.** `.ai/rules/planning.md` says wave work is tracked in `07-wave-3-implementation-tasks.md`. This is a new feature set, so it has its own folder (same pattern as `seller-registration/` and `workspaces/`). Add a one-line pointer from `07` once the work is scheduled. Tick tasks here as they land and record decisions in §2. Ticked tasks are history: do not edit them; add a follow-up task instead.

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

Findings added in Revision 2 (read from `4715692`):

| #   | Finding                                                                                                                                                                                                                                                      | Consequence                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F11 | `ResolveReturn` writes a negative `Refund` ledger entry for the customer-facing amount and, for affiliate items, a **positive `Adjustment`** that gives the affiliate commission back to the seller. Platform commission is **not** reversed.                | Seller totals are already net of refunds, but platform and affiliate commission are treated differently on refund (see §7, answer 2 and G-P2).                                                     |
| F12 | `order_refunds` has no processed state. `ListPayouts` and `admin/payouts` only list seller payout requests; there is no view of what the platform owes in total.                                                                                             | Refunds are manual, so they need a processed state and an admin queue (§8.4).                                                                                                                      |
| F13 | Production video upload and delivery require S3 storage and signed-URL delivery with range support. The default disk is `local`; `s3` is defined in `config/filesystems.php`.                                                                                | Adopt the working S3 media core from `b2b-marketplace`: `MediaUploadService` (putFileAs on `s3`), `media` table, `products.video_media_id`, and `media.view` signed-URL streaming redirect (§8.1). |
| F14 | An admin moderation queue exists (`admin/moderation`; decisions approve/hide/reject/warn/suspend). Items come from user reports, auto-flags (keyword, halal, expiry) and shop applications. **Admins cannot create an item themselves.**                     | Manual flagging is a small addition, not a new page (§8.2).                                                                                                                                        |
| F15 | Staff can currently delete products (`DeleteSellerProduct` is "operated") and open the dashboard and customers pages. Chat messages carry `sender_id` but the seller UI shows no sender name. `order_refunds.resolved_by` already stores the resolving user. | The permission matrix needs tightening and staff must be identifiable (§8.3).                                                                                                                      |

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

| Gate     | Decision                                                                            | Recommended default                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Blocks                 |
| -------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **G-A0** | Does an affiliate program already exist outside this repo (another service/branch)? | **Deferred (parked).** Part A was built assuming "no"; see §5.0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | — (parked)             |
| G-V1     | Video limits                                                                        | MP4 (H.264/AAC) or WebM, **≤ 50 MB** (`config('marketplace.video.max_kb') = 51200`), **≤ 60 s**. Size and MIME enforced server-side; duration enforced client-side only (no `ffprobe` in the stack).                                                                                                                                                                                                                                                                                                                              | V-02, V-04, U-01, U-03 |
| G-V2     | Poster/thumbnail                                                                    | **None in v1**: the slide uses `preload="metadata"` and thumbnails show a play tile. Client-captured poster or server `ffmpeg` poster later.                                                                                                                                                                                                                                                                                                                                                                                      | V-06                   |
| G-V3     | Upload path & delivery                                                              | **Aligned to `b2b-marketplace` source of truth:** Video uploads use `MediaUploadService` storing to the configured `s3` disk (`Storage::disk('s3')->putFileAs()`) under `marketplace.video.storage_prefix`. Assets are tracked in a `media` table and linked via `products.video_media_id`. Delivery uses short-lived S3 signed URLs (`Storage::disk('s3')->temporaryUrl()`) via a shared `media.view` route (`GET /media/{media}/view`), preserving HTTP byte-range streaming directly from S3 without proxying overhead (§8.1). | U-01 → U-08            |
| G-V4     | Video moderation                                                                    | **Revised:** goes live immediately, covered by user reports **and** admins can flag any product manually from the moderation page, without waiting for a report (§8.2).                                                                                                                                                                                                                                                                                                                                                           | M-01 → M-03            |
| G-S1     | Staff permissions                                                                   | **Revised:** one fixed **staff** role limited to **order management, product management (create/edit), return/refund resolution and chat replies**. Staff cannot delete anything and cannot add or manage staff. **Owner-only:** everything else (dashboard, customers, finance, payouts, payout account, shop settings, vouchers, team, affiliate fields). Replies and resolutions must show **who** acted.                                                                                                                      | S-10 → S-14            |
| G-S2     | Adding staff                                                                        | **Invite by email, staff accepts** (signed link, 7-day expiry). Pending invites count toward the cap of 2.                                                                                                                                                                                                                                                                                                                                                                                                                        | S-01 → S-03            |
| G-S3     | Membership rules                                                                    | A user may be staff of **one** shop; a shop owner cannot be staff; an active staff member cannot apply for their own shop; staff cannot buy from or follow their own shop.                                                                                                                                                                                                                                                                                                                                                        | S-01, S-05             |
| G-A1     | Backfill of existing products                                                       | `affiliate_enabled = false` when no program exists (F1). If G-A0 = "exists", backfill **to true** to preserve current behaviour, then let sellers opt out.                                                                                                                                                                                                                                                                                                                                                                        | AF-02                  |
| G-A2     | Rate model                                                                          | Per-product rate in basis points, bounded by platform `min_bps`/`max_bps`; null = platform default. Proposed starting values (**need business sign-off**): default 500 (5%), min 100, max 3000.                                                                                                                                                                                                                                                                                                                                   | AF-02, AF-03           |
| G-A3     | Who funds the affiliate commission                                                  | **The seller**, deducted from the sale proceeds at completion (this is what "control over margins" implies). Platform commission is unchanged.                                                                                                                                                                                                                                                                                                                                                                                    | AF-05                  |
| G-A4     | Refund handling                                                                     | **Partly answered (§7, answer 2):** seller totals are net of platform commission, affiliate commission and refunds; refunds are paid manually. Whether platform commission is retained on refunded items is still open (**G-P2**). Affiliate reversal on refund is built (AF-05).                                                                                                                                                                                                                                                 | P-01                   |
| G-P1     | Payables model                                                                      | The platform is a **payment facilitator, not merchant of record**; customer payments sit in the processor account (escrow-like). The payout page must answer what is owed to **sellers, affiliates and customers (refunds)**. All payouts and refunds are processed **manually**.                                                                                                                                                                                                                                                 | P-01 → P-07            |
| G-P2     | Commission on refunded items                                                        | **Open.** Today platform commission is kept on refunds and affiliate commission is returned to the seller (F11). Confirm whether both should be reversed, both kept, or the current split. Does not block P-01 → P-06 (seller totals stay "net of commissions and refunds" either way); it changes only the ledger amounts.                                                                                                                                                                                                       | P-02 (amounts)         |

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

> **Superseded in part (Revision 2).** The matrix below is what shipped in S-03. The business later narrowed staff to orders, products (no delete), return/refund resolution and chat; see the revised matrix in §8.3 (S-10).

Endpoint matrix (per G-S1, as shipped). "Operated" = owner or staff, "Owner" = owner only:

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

### 5.0 Status: PARKED (Revision 2)

The business chose to **defer** the affiliate question (§7, answer 1). Everything below in §5.1–§5.4 was built and tested in `4715692`; **no further affiliate work is planned** until the information below is supplied.

**Finished and in the codebase**

- Product opt-in (`affiliate_enabled`, `affiliate_commission_bps`), platform bounds in `config/marketplace.php` (`default_bps` 500, `min_bps` 100, `max_bps` 3000), `ResolveAffiliateRate`, `Product::scopeAffiliateEligible`, owner-only enforcement, seller form panel with margin preview.
- Part A foundation: `affiliate_profiles`, `affiliate_earnings`, `order_items` snapshot (`affiliate_profile_id`, `affiliate_bps`, `affiliate_amount`), `CaptureAffiliateReferral` middleware, `LedgerEntryType::AffiliateCommission`, accrual in `CreditSellerLedger`, proportional reversal in `ResolveReturn`.
- Buyer-workspace page (`/account/affiliate`) with profile activation and link copying; seller product list badge and bulk toggle (`BulkProductAffiliateController`).
- Tests: `AffiliateFoundationTest`, `AffiliateProgramLifecycleTest`, `tests/e2e/specs/affiliate.spec.ts`.

**Not built (and not planned while parked)**: affiliate payouts, an affiliate earnings dashboard beyond the buyer page, KYC/tax capture, fraud controls, admin management of affiliates.

**Information needed before un-parking**

1. **G-A0:** does an affiliate program already run elsewhere? If yes, Part A (profiles, referral cookie, earnings) may duplicate or conflict with it and should be removed or re-pointed.
2. **G-A2:** sign-off on the commission bounds (5% default, 1% min, 30% max are placeholders).
3. **Affiliate payout rules:** minimum amount, hold period (reuse the seller `payouts.hold_days` or separate), payout method, who may become an affiliate (any verified user, approval step), identity/tax requirements for a payment facilitator.
4. **G-P2:** whether platform commission and/or affiliate commission is reversed on refund (§7, answer 2).
5. **Attribution policy:** last-click within 30 days is the current behaviour; confirm, including self-referral and shop-staff exclusions (already enforced).
6. **Terms and disclosure:** affiliate terms of service and buyer-facing disclosure.

**Parking actions**

- [x] **AF-09 Hide the affiliate surfaces behind a flag (S, P1).** `/account/affiliate` is reachable from the buyer nav today and `CaptureAffiliateReferral` is always on. Add a `buyer.affiliate` feature flag (default `false`) in `workspaces.ts`, plus an env/config switch so referral capture and new profile activation are inert while parked; the seller opt-in panel may stay but should say earnings accrue only once the program launches. Existing data and tests stay. Tests: flag off → nav item absent, `/account/affiliate` 404, no cookie set; flag on → current behaviour.
- [x] **AF-10 Record the open questions with the business owner (S, P2).** Copy the six items above to `docs/planning/assumptions-and-open-questions.md` so they are not lost.

Affiliate amounts do appear in the payables view (§8.4, P-03) as a **read-only** figure taken from existing `affiliate_earnings`; there is no affiliate payout action.

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

## 7. Business answers and decisions (Revision 2)

Recorded after the first implementation pass. Each answer maps to tasks in §8.

| #   | Topic                     | Answer                                                                                                                                                                                                                                                                                                                                                                                                        | Where it lands     |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| 1   | Affiliate premise (F1)    | **Deferred.** Park all affiliate work now; add a note covering what is finished and what information is needed.                                                                                                                                                                                                                                                                                               | §5.0, AF-09, AF-10 |
| 2   | Refund / payout model     | The platform is a **payment facilitator, not merchant of record**. All customer payments sit in the payment processor account (escrow-like). The **payout page must show how much the platform owes sellers, affiliates and customers (refunds)**. Seller payout totals must already be **net of platform commission, affiliate commission and refunds**. **All payouts and refunds are processed manually.** | G-P1, G-P2, §8.4   |
| 3   | Mobile video upload       | Upload **videos to S3 with signed-URL delivery** matching `b2b-marketplace`. Store in S3 via `MediaUploadService`, track in `media` table, link via `products.video_media_id`, stream via `media.view` signed URLs. A **scheduled task prunes orphaned media**.                                                                                                                                               | G-V3, §8.1         |
| 4   | Unmoderated video         | Admin needs a **moderation page** (it already exists, F14) and must be able to **flag products manually** without waiting for user reports. Duration stays client-trusted; the 30 MB cap is the server bound.                                                                                                                                                                                                 | G-V4, §8.2         |
| 5   | Staff permissions         | Simple. Staff **cannot delete anything and cannot add staff**. Capabilities are limited to **order and product management, return/refund resolution and chat replies**. Sellers must be able to **identify which staff member replied**. Keep the customer email/phone protection and test it.                                                                                                                | G-S1, §8.3         |
| 6   | Auth refactor regressions | OK: keep the parameterised route-matrix test as the safety net. It is extended, not replaced.                                                                                                                                                                                                                                                                                                                 | S-10, S-11         |

Remaining risks (unchanged unless noted):

- **Refund commission asymmetry (G-P2):** platform commission is kept on refunds while affiliate commission is returned to the seller. Settle before the affiliate program un-parks.
- **Negative seller balance:** a refund approved after a payout can push a shop's ledger below zero. The payables view must show this as money owed **by** the seller, not hide it in a total (P-03).
- **Manual processing:** with manual payouts and refunds, the admin queue is the control. Every status change needs a reference and an audit-log entry (P-04, P-05).
- **Upload validation:** `MediaUploadService` enforces strict server-side validation (MIME allowlist `video/mp4`, `video/webm`, extension matching, and size bound `marketplace.video.max_kb`) prior to persisting to S3.
- **Duration is client-trusted** without `ffprobe`; the 30 MB cap is the real server-side bound.
- **Auth refactor regressions:** the route-matrix test is the safety net; do not skip it.

## 8. Revision 2 tasks (unfinished)

Ticked tasks in §3.5, §4.6 and §5.4 are not reopened. Everything here is new. Conventions in §1 apply; every task includes its tests and the sm/md/lg check where it touches UI.

### 8.1 S3 Video Upload & Signed-URL Delivery (Slice C: U-01 → U-08)

Source of truth: `b2b-marketplace` production implementation.
The goal is to only make video uploading and displaying work using the proven S3 storage, media core, signed-URL streaming, and PDP/moderation display pattern.

**Architecture:**

- **Storage:** S3 disk (`Storage::disk('s3')`) with bucket, region, credentials, endpoint, and `temporary_url` configuration.
- **Media Core:** Dedicated `media` table and `Media` model (`id`, `original_filename`, `extension`, `storage_path`, `mime_type`, `description`, `scan_status`, `uploaded_by_id`, timestamps). Products link via `products.video_media_id` (foreign key to `media.id`, restrictOnDelete or nullOnDelete) with `Product::video(): BelongsTo<Media, $this>`.
- **Upload & Validation:** `MediaUploadService` (called from seller actions/requests) validates MP4/WebM MIME and extension matching, enforces max size from `config('marketplace.video.max_kb')` (default 51200 KB = 50 MB), persists to S3 via `putFileAs()` under `marketplace.video.storage_prefix` (e.g. `media/YYYY/MM/DD/{uuid}.{ext}`), creates the `Media` record, and dispatches `ScanUploadedFileJob` (marks clean immediately if `services.clamav.enabled` is false).
- **Signed-URL Streaming Delivery:** Shared `media.view` route (`GET /media/{media}/view`). Gated by `marketplace.features.product_video_enabled` and `scan_status === 'clean'`. Authorized publicly for published/marketplace-visible products; private (owner, active staff, admin) otherwise. Issues time-limited S3 signed URL (`Storage::disk('s3')->temporaryUrl($media->storage_path, now()->addMinutes(30), ['ResponseContentType' => $media->mime_type])`) and redirects with `Cache-Control: private, max-age=300`. This offloads streaming from the PHP app server directly to S3 and preserves native HTTP byte-range request support.
- **Display:**
    - Storefront PDP: eager-loads `video`, places video as slide 1 in the gallery carousel using `<video controls preload="metadata" playsinline>` with `<source src="{{ route('media.view', $product->video) }}" type="...">`.
    - Admin moderation: previews video via `route('media.view', $media)`.
- **Maintenance:**
    - `ReconcileMediaOrphansJob`: identifies unreferenced `media` rows (not referenced by `products.video_media_id` or other FKs) older than 7 days, deletes their S3 objects and database rows.
    - `PurgeTestVideosCommand` (`media:purge-videos`): purges video media and S3 objects by prefix.

**Tasks:**

- [x] **U-01 S3 disk configuration & feature gates (S, P0).** Configure S3 disk in `config/filesystems.php` (`AWS_TEMPORARY_URL` / `temporary_url`, `throw: false`). Add `config/marketplace.php` settings: `video.max_kb` (51200), `video.storage_prefix` ('media'), `features.product_video_enabled`. Implement `EnsureFeatureEnabled` middleware / feature gate check. Dev/test uses `Storage::fake('s3')`.
- [x] **U-02 Media schema & product relation (S, P0).** Migration for `media` table (`original_filename`, `extension`, `storage_path`, `mime_type`, `description`, `scan_status` pending|clean|infected, `uploaded_by_id`, timestamps). `Media` model with `videoProducts()` relation + factory. Migration `add_video_media_id_to_products_table` (`video_media_id` FK on `products`). Update `Product` model (`video_media_id` fillable, `video(): BelongsTo<Media>`).
- [x] **U-03 Media upload service & scan job (M, P0).** `MediaUploadService`: `storeVideo(UploadedFile $file, int $uploaderId, string $description = 'Product video'): Media` with strict MIME/extension/size validation (`marketplace.video.max_kb`), S3 `putFileAs()` to date-partitioned UUID path, `Media::create()`, dispatch `ScanUploadedFileJob` if `services.clamav.enabled` (else immediate `clean`). Tests: accepted mp4/webm stored on s3, oversize/mov/mismatched rejected with 422.
- [x] **U-04 Signed-URL delivery route (media.view) (S, P0).** Route `GET /media/{media}/view` (`media.view`). Gates: `features.product_video_enabled`, `scan_status === 'clean'`. Authorization: public if product is published on active shop; private (owner, active staff, admin) otherwise. Issues 30-min S3 `temporaryUrl()` and redirects with `Cache-Control: private, max-age=300`. Tests: public access, unapproved/archived requires owner/staff/admin, disabled feature 404, infected/pending 404.
- [x] **U-05 Seller video upload & wiring (M, P0).** Integrate video upload with seller product management (`SyncProductVideo` / `UpdateSellerProduct` / video upload endpoint). Allows owner and active staff to upload new video, replace existing (old media orphaned or deleted), or remove (`video_media_id = null`). Tests: owner and staff can upload video, media record created and linked, remove detaches video.
- [x] **U-06 Video display on storefront PDP & moderation (M, P1).** Storefront product detail page eager-loads `video`, places video as slide 1 in carousel using `route('media.view', $media)` with `<video controls preload="metadata" playsinline>`. Admin moderation preview displays video via `media.view`. Verify responsive behavior at sm/md/lg.
- [x] **U-07 Maintenance jobs & commands (S, P1).** `ReconcileMediaOrphansJob` (checks `products.video_media_id` references, prunes unreferenced media and deletes S3 objects after 7-day grace period). `PurgeTestVideosCommand` (`media:purge-videos`) to purge test videos and S3 objects by prefix. Tests: orphans cleaned up, active references preserved.
- [x] **U-08 Test suite & verification (M, P1).** Feature tests matching `b2b-marketplace`: `ProductVideoUploadTest`, `MediaVideoUploadTest`, `MediaVideoDeliveryTest`; E2E verification of video upload, display on PDP, and moderation preview (360/768/1280 + iphone-safari, axe).

### 8.2 Admin moderation and manual flagging (G-V4, answer 4)

The page exists (`admin/moderation`, F14) and already previews product video (V-10). What is missing is an admin-initiated flag.

- [x] **M-01 Manual flag action (M, P0).** `ModerationItemType::Manual` ("Admin flag"); `CreateAdminProductFlagRequest` (admin only; product ID, reason from the report-driven `ModerationReason` options, required note); `Admin\CreateModerationFlag` action creates a `ModerationQueueItem` with `flagged_by` = the admin, a `ModerationEvent`, and a `RecordAuditLog` entry; skips (returns the existing item) when an open item for that product already exists. Route: `admin.moderation.flags.store`. Tests: creates item, dedupes, non-admin 404, seller/buyer cannot call it.
- [x] **M-02 Flag UI (M, P1).** "Flag a product" on the moderation index: product search (name, slug, shop), reason, note. Optional (P2): a "Flag for review" action when an admin views the product page. sm/md/lg.
- [x] **M-03 Queue + e2e (S, P1).** Manual items appear under their own filter/label; detail pane shows the note, photos and video; the existing decisions (hide, reject, warn, suspend) work unchanged. e2e: admin flags a product with a video, hides it, buyers get 404 on it (`tests/e2e/specs/admin-moderation-flag.spec.ts`, passing on all four projects).

### 8.3 Staff permissions and identification (G-S1, answer 5)

Revised staff matrix (replaces §4.3 for staff). **Staff:** `ListSellerProducts`, `CreateSellerProduct`, `EditSellerProduct`, `UpdateSellerProduct`, `ListSellerOrders`, `ShowSellerOrder`, `CreateFulfillment`, `UpdateFulfillment`, `ResolveOrderReturn`, `CreateSellerOrderChat`, seller chat and notifications, and uploads (U-03). **Owner only:** `DeleteSellerProduct`, `ShowSellerDashboard`, customers, finance, payouts, payout account, shop settings, vouchers (all verbs), team management, `affiliate_*` fields and bulk affiliate.

Interpretation to confirm: "limited to order and product management, return/refund resolution and chat replies" is read strictly, so the **dashboard and customers pages become owner-only**, and staff land on **Orders**. Editing a product's media (replace photo, remove video) counts as editing, not deleting; leaving the shop (staff removing themselves) stays allowed.

- [x] **S-10 Revised matrix (M, P0).** Move `DeleteSellerProduct`, `ShowSellerDashboard`, `ListSellerCustomers`, `ShowSellerCustomer` to owner-only; staff home redirects to Orders; `workspaces.ts` hides Dashboard and Customers for staff (`roles`) and sets the seller home per role. Update the dataset in `ShopStaffRouteMatrixTest` (staff → 404 on the moved routes, 200 on the staff routes) and `seller-staff.spec.ts`.
- [x] **S-11 "Nothing destructive" guard (S, P0).** A route-derived test: iterate `Route::getRoutes()` for the `seller.*` group, and assert that every `DELETE` route and every route not listed in the staff allow-list returns 404 for staff, except the self-removal route `seller.staff.destroy` for their own membership. New seller routes then fail the test until classified. Also assert staff cannot call `seller.staff.store`.
- [x] **S-12 Identify the replying staff member (M, P1).** For seller-role messages, include `sender: { id, name, is_staff }` in the seller-workspace chat payloads (`GetMessages`, `GetConversations` preview). Show "Replied by <name>" under staff messages and "Owner" for the owner's own. The **buyer** payload must not expose staff names (the buyer sees the shop). Show "Resolved by <name>" on return/refund decisions using `order_refunds.resolved_by` and an actor on the "declined" order event. Tests: owner sees the staff name; buyer payload has no staff identity; resolution shows the right user.
- [x] **S-13 Customer data exposure test (S, P1).** Assert staff-visible and owner-visible seller payloads (`ShowSellerOrder`, `ShowSellerCustomer`, chat) never contain the buyer's email; phone appears only where delivery requires it, as an explicit exception in the test. Keeps the existing `GetSellerCustomer` behaviour.
- [x] **S-14 e2e (S, P1).** Staff signs in and lands on Orders; processes an order and resolves a return; replies in chat and the owner sees who replied; Dashboard, Customers, delete actions and Team are unavailable at 360/768/1280 + `iphone-safari`, axe.

### 8.4 Payables and manual payouts (G-P1, answer 2)

**Model.** The processor account holds customer payments; the platform is a facilitator. The admin payout page answers **"How much do we owe, and to whom?"**:

- **Sellers:** the sum of each shop's ledger entries (sales − platform commission − affiliate commission − refunds ± adjustments − payouts already paid), split into held (before `available_at`) and available. This is already "net of commissions and refunds", so the seller figure needs no further deductions. A negative total is shown as **owed by the seller**.
- **Customers:** approved refunds (`order_refunds`) not yet marked processed.
- **Affiliates:** accrued, non-cancelled `affiliate_earnings` net of reversals. **Read-only**; payouts are parked (§5.0).

- [x] **P-01 Document the model (S, P0).** Add a short "Payables" section to `.ai/rules/finance.md` (facilitator model, the three obligations, manual processing, refund processed state) and note G-P2 as open.
- [x] **P-02 Refund processed state (S, P0).** Migration on `order_refunds`: `processed_at`, `processed_by` (FK users), `reference` (nullable strings/timestamps). Model/casts/docblock/factory. Backfill: existing refunds stay unprocessed (confirm with the business if production already has refunds, **G-P1**). Amounts in `ResolveReturn` stay as they are until G-P2 is decided.
- [x] **P-03 `Admin\GetPayables` action (M, P0).** Grouped SQL, no per-shop loops: seller totals by shop (held/available/negative), customer refund totals by buyer with order references, affiliate totals by profile (read-only), plus the three grand totals. Tests: a fixture with a completed sale, platform and affiliate commission, a partial refund, a paid payout and a processed refund, asserting every total; negative-balance shop reported as owed by the seller.
- [x] **P-04 Payout page (M, P1).** Rework `admin/payouts` into one page: three summary cards (Sellers / Customers / Affiliates) over three tabs. Sellers: existing payout requests with `ResolvePayout` (reference required, audit log) plus per-shop balances. Customers: pending refunds with the buyer, order reference, amount and a **Mark refunded** action. Affiliates: read-only accruals, no actions. Tables on lg, cards on sm/md.
- [x] **P-05 Process refund (M, P1).** `Admin\ProcessRefund` action, `UpdateOrderRefundRequest` (admin only; reference required), idempotent (already processed → no-op), `RecordAuditLog`, `OrderEvent` and a notification to the customer ("Your refund has been sent"). Route `admin.refunds.update`. Tests: sets the fields, double submit is a no-op, non-admin 404, totals in P-03 drop accordingly.
- [x] **P-06 Customer-visible refund status (S, P2).** Order detail shows "Refund approved" → "Refunded (ref …)".
- [x] **P-07 e2e (S, P1).** Admin sees owed totals, marks a payout paid and a refund processed, and the totals update; 360/768/1280, axe. (`tests/e2e/specs/admin-payables.spec.ts`; `/admin/payouts` already covered by `accessibility.spec.ts`.)

## 9. Order of work (Revision 2)

1. **Independent starts:** U-01 and U-02, M-01, S-10 and S-11, P-01 and P-02, AF-09.
2. **U-03 → U-04 → U-05** before U-06 (storefront display & moderation); U-07 (maintenance) and U-08 (tests) follow.
3. **S-10 before S-12/S-14:** permissions first, then the identification UI. S-11 must land in the same PR as S-10 so the matrix is never half-updated.
4. **P-02 → P-03 → P-04/P-05.** P-03's totals and P-05's mutation are tested together.
5. **M-01 → M-02 → M-03** are independent of the other slices and can ship first.
6. Suggested release slices: **(A)** staff tightening (S-10 → S-14), **(B)** manual flagging (M-01 → M-03), **(C)** S3 video upload & signed delivery (U-01 → U-08), **(D)** payables (P-01 → P-07). Affiliate stays parked behind AF-09.
