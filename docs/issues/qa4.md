# Task Implementation Plan

Source: QA round 4 (`b2c_revisions_1.pdf` + the placeholder-thumbnail screenshot from the previous revision document).

Work is grouped so each group ships as one commit and one push, in this order: **A → B → C → D → E**.

## Decisions (confirmed with the requester)

| #   | Topic                               | Decision                                                                                                                                                                           |
| --- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Placeholder thumbnail               | Reproduce with: create a product with no images, then edit it and add image(s). The placeholder row stays in the gallery, the catalog card and the PDP.                            |
| 2   | Variant shipping                    | Parent weight/dimensions stay visible when variants are enabled and act as defaults for every variant. Each variant may override them.                                             |
| 3   | Return/refund request notifications | Sent to every shop operator (owner + active staff), the same recipients as new-order notifications today (`Shop::operators()`). Channels: in-app (`database`) and e-mail (`mail`). |
| 4   | Register-shop link for staff        | Add a "Register my own shop" entry in the workspace switcher, next to the "Seller Centre" entry.                                                                                   |
| 5   | Seller chat naming                  | Sellers see the customer's full name in the conversation list and in the thread header.                                                                                            |

---

## Group A: Product gallery placeholder (commit 1)

### Task A.1: Placeholder thumbnail still shown after images are added

- **Source Reference:** Revisions p1 ("Placeholder thumbnail still appears in product gallery") and the screenshot ("2 of 3" gallery, catalog card with a package icon).
- **Target Files:**
    - `app/Actions/Seller/UpdateSellerProduct.php`
    - `app/Actions/Seller/CreateSellerProduct.php`
    - `app/Models/Product.php` (`toDetail`, `toCard`)
    - `app/Http/Controllers/Seller/ProductController.php` (`edit`)
    - `resources/js/pages/seller/products/form.tsx`
    - new migration `database/migrations/xxxx_remove_placeholder_product_images.php`
    - `tests/Feature/Seller/` (new `ProductImagePlaceholderTest.php`)
- **Solution & Implementation Details:**
    - **Root Cause / Logic:**
        - `CreateSellerProduct` inserts a placeholder row (`url = ''`, `icon = 'package'`) when no images are uploaded. The row exists so readers that do `images->first()->icon` never hit `null`.
        - On edit, `form.tsx` builds `keep_image_ids` from **every** existing image, including the placeholder (the comment above `existingImages` says this is deliberate). `UpdateSellerProduct` therefore keeps the placeholder at `sort_order` 0 and appends the real uploads after it.
        - `Product::toDetail()` returns every row, so the PDP gallery shows the placeholder as slide 1 ("2 of 3" in the screenshot). The catalog card falls back to the icon whenever `firstWhere('url', '!=', '')` is empty, so it looks wrong for products whose first-sorted row is the placeholder in other readers.
    - **Exact Code Changes:**
        1. `form.tsx`: stop sending placeholder ids. Build `keep_image_ids` from `existingImages.filter((img) => img.url !== '')`.
        2. `UpdateSellerProduct`: after processing uploads, delete any `url = ''` rows if at least one real image exists. Re-create a single placeholder only when the product ends with zero images (current behaviour).
            ```php
            $hasReal = $product->images()->where('url', '!=', '')->exists();
            if ($hasReal) {
                $product->images()->where('url', '')->delete();
            }
            ```
            This must also run when `keep_image_ids` is absent but `images` is not empty (already inside the same `if`).
        3. `Product::toDetail()`: return only rows with a non-empty `url` when at least one exists; otherwise return the single placeholder so the gallery still renders an icon.
        4. `Seller\ProductController::edit`: keep returning `id`, `url`, `icon`, but filter placeholders out of `images` so the uploader never receives them.
        5. Migration: `DB::table('product_images')->where('url', '')->whereIn('product_id', fn ($q) => $q->select('product_id')->from('product_images')->where('url', '!=', ''))->delete();` This cleans the rows already created by the bug. `down()` is a no-op.
- **Verification:** Pest test: create a product without images, assert one placeholder row. Update it with one uploaded image (`Storage::fake('public')`, `UploadedFile::fake()->image()`), assert no `url = ''` row remains, `toDetail()['images']` has exactly one entry, and `toCard()['image_url']` is set. Update again removing the only image and assert a placeholder is restored. Manual: repeat the reproduction steps and confirm the catalog card, the PDP gallery and the seller list show only the uploaded photo.

---

## Group B: Variant form (commit 2)

### Task B.1: Variant table columns overlap

- **Source Reference:** Revisions p1 bullet 1 (first screenshot).
- **Target Files:** `resources/js/components/variant-matrix.tsx`
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** The desktop table uses `table-fixed` with ten columns. Every column except the option-1 column has a fixed width (`w-28`, `w-36`, `w-32`, `w-40`), and together they are wider than the container. With `table-fixed` the unsized option-1 column collapses to near zero width, so its labels and the option-2 labels paint over each other.
    - **Exact Code Changes:**
        1. Give the option-1 header and row header a width: `w-32 min-w-32`. Give the option-2 header and cell the same `min-w-28`.
        2. Set a minimum table width so the wrapper scrolls instead of squeezing: `className="w-full min-w-[1100px] table-fixed text-body"`. The existing wrapper already has `overflow-x-auto`.
        3. Make the option columns `sticky left-0 bg-surface` so the labels stay visible while scrolling horizontally.
- **Verification:** Create 3 sizes x 3 colours. Confirm all labels are readable at 1024px, 1280px and 1536px widths, and that horizontal scrolling keeps the option labels visible.

### Task B.2: No validation errors for invalid variant values

- **Source Reference:** Revisions p1 bullet 1 (second sentence, e.g. sale price greater than regular price) and bullet 2 ("No form errors appear on the screen").
- **Target Files:**
    - `resources/js/components/variant-matrix.tsx`
    - `resources/js/pages/seller/products/form.tsx`
    - `app/Http/Requests/Seller/CreateSellerProductRequest.php`
    - `app/Http/Requests/Seller/UpdateSellerProductRequest.php`
- **Solution & Implementation Details:**
    - **Root Cause / Logic:**
        - The server already validates `variations.*.sale_price` with `lt:variations.*.price`, but the form only renders `errors.variations`. Laravel returns keys such as `variations.2.sale_price`, which nothing displays.
        - The error key for a failing rule on a hidden field (see B.3) has no visible target at all, so the submit looks like it does nothing.
        - There is no client-side check, so the seller only finds out after a round trip, and then sees nothing.
    - **Exact Code Changes:**
        1. `VariantMatrix`: add an optional prop `errors?: Record<string, string>` and pass `errors` from the form. Render per-cell messages under the input for `variations.{i}.price|sale_price|stock|sku|weight|length|width|height`, with `aria-invalid` and `aria-describedby`, and the danger border class.
        2. Mobile card layout inside `VariantMatrix` gets the same per-field messages.
        3. Live client check in the matrix: when `sale_price` is set and `sale_price >= price`, show "Sale price must be lower than the regular price." before submit. The server rule remains the source of truth.
        4. `form.tsx`: add an error summary at the top of the form (role `alert`) listing every error key that has no visible field, with a link to the field when it exists. On a failed submit, scroll to and focus the first error.
        5. Request classes: add custom messages for the variation rules (`variations.*.sale_price.lt`, `variations.*.price.min`, `variations.*.stock.min`) that name the variation, for example "Sale price for Large / Blue must be lower than its regular price."
- **Verification:** Set a variant sale price above its regular price and confirm the inline message appears before submit and after a server rejection. Submit an empty variation price and confirm the message shows on the right row.

### Task B.3: Cannot create a product with variants (hidden shipping fields are required)

- **Source Reference:** Revisions p1 bullet 2.
- **Target Files:**
    - `resources/js/pages/seller/products/form.tsx`
    - `resources/js/components/variant-matrix.tsx`
    - `app/Http/Requests/Seller/CreateSellerProductRequest.php`
    - `app/Http/Requests/Seller/UpdateSellerProductRequest.php`
    - `app/Actions/Seller/CreateSellerProduct.php`
    - `app/Actions/Seller/UpdateSellerProduct.php`
    - `app/Models/ProductVariation.php`
    - `app/Http/Controllers/Seller/ProductController.php`
    - `tests/Feature/Seller/` (new `ProductVariantShippingTest.php`)
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** `weight` is `['required', 'numeric', 'min:0.01']` on the parent product. `form.tsx` renders the shipping section only under `{!hasVariations && (...)}` (around line 750), so with variants enabled `weight` is never posted, validation fails on `weight`, and no field shows the error. This confirms the investigation in the revisions document.
    - **Decision applied:** the parent shipping fields stay visible as defaults; variants may override.
    - **Exact Code Changes:**
        1. `form.tsx`: always render the shipping section. When `hasVariations` is true, retitle it "Default shipping (applies to all variations unless overridden)" and show helper text. Remove the `!hasVariations` gate. Keep the `errors.weight|length|width|height` display.
        2. `VariantMatrix`: per-variant weight/length/width/height inputs already exist. Change the placeholders to show the parent default (for example `placeholder={defaultWeight ?? '—'}`) by passing `defaults={{weight,length,width,height}}` from the form (controlled by the parent inputs' state). An empty cell means "use the default".
        3. "Apply to all" keeps working and only overwrites the per-variant overrides.
        4. Backend keeps the parent rule (`weight` required), because the parent weight is now always submitted. A variant value of `null` means inherit. **Found while implementing:** neither request validated `variations.*.weight|length|width|height`, so `validated()` silently dropped every per-variant override. Both requests now validate them (shared `HasProductVariationRules` trait), which also holds the per-row error messages from B.2.
        5. `ProductVariation`: add `effectiveWeight()`, `effectiveLength()`, `effectiveWidth()`, `effectiveHeight()` that fall back to the parent product. Use them wherever a variation's shipping dimensions are read (the `Product::toDetail()` variation payload keeps the raw override and adds the effective values).
        6. `Seller\ProductController::edit` returns the parent values and the raw variant overrides so editing round-trips.
        7. Block the silent failure class generally: in `form.tsx`, if the server returns an error key that is not mapped to a rendered field, the summary from B.2 lists it.
- **Verification:** Pest: create a product with two variations, parent weight 0.5, one variant weight null and one 1.2. Assert 201/redirect, two variation rows, and `effectiveWeight()` returns 0.5 and 1.2. Assert a request with no parent weight fails with a `weight` error. Manual: enable variants, leave the default shipping empty, submit, and confirm the error appears next to the default shipping weight.

---

## Group C: Return/refund notifications (commit 3)

### Task C.1: In-app and e-mail notification to the seller when a customer requests a return/refund

- **Source Reference:** Revisions p2 bullet 1.
- **Target Files:**
    - new `app/Notifications/SellerReturnRequestedNotification.php`
    - `app/Actions/Order/RequestReturn.php`
    - `tests/Feature/Notification/` (new `ReturnRequestNotificationTest.php`)
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** `RequestReturn` updates the status and writes an `OrderEvent`, but sends no notification. Sellers only find out by opening the order.
    - **Exact Code Changes:**
        1. New queued notification modelled on `SellerOrderNotification`: `via()` returns `['database', 'mail']`. `toArray()` carries `type => 'order'`, `workspace => 'seller'`, `shop_id`, `order_id`, `title => 'Return/refund requested'`, a text with the order reference, and `url => route('seller.orders.show', $order)`. The `shop_id` and `workspace` keys are required so the per-shop notification scope (`NotificationScope`) counts and lists it for the right shop only.
        2. Mail: subject "Return/refund requested", greeting with the operator's name, the order reference, the customer's stated reason (truncated), and a "Review request" action to the seller order page.
        3. `RequestReturn::handle`: after the order status update and event, `DB::afterCommit(fn () => Notification::send($order->shop->operators(), new SellerReturnRequestedNotification($order, $reason)))`. This sends to the owner and every active staff member.
- **Verification:** Pest with `Notification::fake()`: request a return on an order whose shop has an owner and two staff (one inactive). Assert the owner and the active staff receive the notification on `database` and `mail`, the inactive staff does not, and the payload `shop_id` equals the order's shop.

### Task C.2: E-mail the customer when a refund is approved or declined

- **Source Reference:** Revisions p2 bullet 2.
- **Target Files:**
    - `app/Actions/Order/ResolveReturn.php`
    - new `app/Notifications/RefundDecisionNotification.php`
    - `app/Actions/Admin/ProcessRefund.php` (check for an equivalent decision path)
    - `tests/Feature/Seller/ReturnResolutionTest.php` (extend)
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** `ResolveReturn` notifies the customer with `OrderStatusNotification`, whose `via()` is `['database']` only, so no e-mail is sent.
    - **Exact Code Changes:**
        1. New `RefundDecisionNotification` (queued, `database` + `mail`) with an `approved` / `partially_approved` / `declined` outcome, the refunded amount (formatted with `Support\Money::format`) for approvals, and the seller's note for declines. The database payload keeps `workspace => 'buyer'` and the `orders.show` URL so the buyer notification list is unchanged.
        2. `ResolveReturn`: replace both `$order->user->notify(new OrderStatusNotification(...))` calls with the new notification, still inside `DB::afterCommit`.
        3. Do not change `OrderStatusNotification`, so other flows keep database-only delivery.
        4. Read `ProcessRefund` and `Admin\RefundController`. If an admin decision path also approves or declines a refund, send the same notification there. If it only processes payout mechanics for an already approved refund, leave it alone and note that in the commit message.
- **Verification:** Pest with `Notification::fake()`: approve a full refund, approve a partial refund, and decline. Assert the customer gets a `RefundDecisionNotification` on `database` and `mail` each time with the right amount or reason, and that existing assertions in `ReturnResolutionTest` still pass.

---

## Group D: Register link for staff (commit 4)

### Task D.1: "Register my own shop" entry in the workspace switcher

- **Source Reference:** Revisions p2 bullet 3.
- **Target Files:**
    - `app/Http/Middleware/HandleInertiaRequests.php`
    - `resources/js/components/workspace-switcher.tsx`
    - `resources/js/types/navigation.ts`
    - `resources/js/layouts/workspace-shell.tsx` (only if it builds its own list)
    - `tests/Feature/Seller/MultiShopStaffTest.php` (extend)
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** `useWorkspaceEntries()` shows "Start selling" only when the shared `seller` prop is `null`. For a staff member, `seller` describes the shop they currently operate, so the "Start selling" link is never rendered. `CreateShopRegistrationRequest` already allows registration when the user's own `shop` is `null` (the comment there says being staff elsewhere does not block owning a shop), which is why the URL works.
    - **Exact Code Changes:**
        1. `HandleInertiaRequests::share`: add `own_shop` inside the `seller` prop: `null` when `$user->shop === null`, otherwise `{ status }` for the user's own application. This is separate from the operated shop.
        2. `useWorkspaceEntries`: when `seller.role === 'staff'` and `seller.own_shop` is `null`, add an extra entry directly after "Seller Centre": label "Register my own shop", `href = sellerRegister().url`, `key = 'seller-register'`, icon `Store` (or `PlusCircle`), `current: false`. If `own_shop.status` is `pending`, `changes_requested` or `rejected`, show the same entry with the matching note ("Application pending" and so on). Do not show it when the user owns an approved shop.
        3. Extend `WorkspaceEntry`/`WorkspaceKey` handling in `navigation.ts` so the extra key is allowed. Both renderers (`WorkspaceSwitcherMenuItems` and `WorkspaceSwitcherList`) already map over entries, so the dropdown and the mobile drawer get the entry together.
        4. Confirm the seller shop switcher (`ActiveShopController`) is unaffected.
- **Verification:** Pest: a user who is staff at another shop and has no shop receives `seller.own_shop === null` and `seller.role === 'staff'` in the shared props; a user with a pending own shop receives `own_shop.status === 'pending'`. Manual: staff user opens the user menu and sees "Register my own shop" under "Seller Centre", and the link opens `/seller/register`.

---

## Group E: Seller Centre chat (commit 5)

### Task E.1: Thread and list use the customer's name, not the store name

- **Source Reference:** Revisions p2 bullet 4, part 1.
- **Target Files:**
    - `app/Actions/Chat/GetConversations.php`
    - `app/Http/Controllers/Chat/ConversationController.php`
    - `app/Models/Conversation.php`
    - `resources/js/types/chat.ts`
    - `resources/js/components/chat-list.tsx`
    - `resources/js/components/chat-thread.tsx`
    - `resources/js/pages/chat.tsx`
    - `tests/Feature/Chat/ChatTest.php` (extend)
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** `Conversation` is loaded with `shop` only, and both `ChatList` and `ChatThread` render `shop.name`. In the seller workspace the shop is the viewer's own shop, so every thread is labelled with the store name (every row shows "Barakah Pantry"). The search also filters on shop name.
    - **Exact Code Changes:**
        1. Seller workspace only: eager load `user:id,name` on conversations in `GetConversations` and in `ConversationController::show`, and expose it as `customer: { id, name }`. Do not expose the customer's e-mail or other fields (see `CustomerDataExposureTest`). The buyer workspace payload does not change.
        2. Search: in the seller workspace, filter on `user.name` instead of `shop.name` (`whereHas('user', fn ($q) => $q->where('name', 'like', $term))`). The buyer workspace keeps the shop-name filter. Escape `%` and `_` in the term.
        3. Types: add `customer?: { id: string; name: string } | null` to `Conversation`.
        4. `ChatList`: accept a `workspace` prop. Compute `displayName = workspace === 'seller' ? c.customer?.name ?? 'Customer' : c.shop.name` and use it for the avatar, the row title and the client-side filter. Hide the shop "online" dot in the seller view (it describes the shop, not the customer).
        5. `ChatThread`: accept `title` and `workspace`. Header, avatar and `aria-label` use the customer's full name in the seller view. In the seller view, replace the "Visit shop" link with nothing (the viewer's own shop) and make the report action target the customer is out of scope, so hide the report button in the seller view unless the existing `ReportDialog` supports a user target. Verify in `ReportDialog` before changing.
        6. `chat.tsx`: pass `workspace` and the computed title down.
- **Verification:** Pest: seller opens `seller.chat.index`; the payload has `customer.name` for every conversation and no customer e-mail. Searching by part of a customer's name returns only that thread. The buyer workspace response is unchanged. Manual: the list and the thread header show the customer's full name.

### Task E.2: Customer and seller messages share the same alignment

- **Source Reference:** Revisions p2 bullet 4, part 2.
- **Target Files:**
    - `resources/js/components/chat-thread.tsx`
    - `resources/js/components/chat-bubble.tsx`
    - `resources/js/components/chat-cards.tsx`
    - `tests/Unit/` (small pure-function test for the alignment rule, if the repo's Node tests can import it)
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** `ChatThread` computes `isOut = m.sender_role === 'buyer' || m.sender_id === currentUserId`. That is correct for the buyer view. In the seller view, buyer messages are also treated as "out" (right-aligned, green), and the seller's own messages are "out" through the `sender_id` match, so everything renders on the right.
    - **Exact Code Changes:**
        1. Replace the rule with a workspace-aware helper:
            ```ts
            export function isOutgoing(
                m: Message,
                workspace: 'buyer' | 'seller',
            ): boolean {
                return workspace === 'seller'
                    ? m.sender_role === 'seller'
                    : m.sender_role === 'buyer';
            }
            ```
            In the seller view, messages from every operator of the shop (owner and staff) are outgoing, so teammates see the same side.
        2. Remove the `sender_id === currentUserId` fallback. Optimistic bubbles already set `sender_role` correctly in `chat.tsx`.
        3. Seller view: show a `senderLabel` on outgoing messages ("Owner" / staff name, which the existing code already derives from `m.sender`). Incoming customer bubbles show the customer's name as the sr-only prefix instead of the default "Seller, " so screen readers announce the right sender. `ChatBubble`'s `defaultPrefix` assumes a buyer viewer; pass `senderPrefix` explicitly from the thread.
        4. `ChatProductCard` / `ChatOrderCard` take the same `out` value, so they follow the new rule.
- **Verification:** Manual with two accounts: customer messages appear left (white bubble), seller messages right (green bubble), in both the seller and buyer workspaces. Buyer view must look the same as before. Component test or Pest assertion on the payload is not enough here, so add a Node unit test for `isOutgoing` in `tests/Unit` if the existing `*.test.mjs` runner can import TypeScript; otherwise cover it in the manual check.

---

## Rollout and checks

- Each group ends with: `vp check`, `npm run types:check`, `php artisan test --compact` for the touched areas, and `vendor/bin/pint --test` / `vendor/bin/phpstan` where the repo config applies.
- Commit message prefix follows the repo style (`fix(...)`, `feat(...)`), one commit and one push per group.
- Push target is the `production` branch, as requested.
