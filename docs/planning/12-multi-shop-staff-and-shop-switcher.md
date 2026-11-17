# 12 — Multi-shop staff, dual ownership and the Seller Centre shop switcher

## Findings (before changes)

- `shop_staff` was already the membership table (shop, user, email, per-shop `status`), but a Postgres partial unique index `shop_staff_user_id_unique` limited each user to **one** membership.
- `User::operatedShop()` returned "owned shop, else the single staff shop" and was the only shop resolver; `User::ownsShop()` meant "owns any approved shop", `$user->shop` was `hasOne`.
- ~25 seller FormRequests/controllers guarded owner-only actions with `ownsShop()` and then read `$user->shop` — correct only while a user could have one shop.
- Invitation, registration and invite-validation rules explicitly blocked "owner of a shop" and "staff at another shop".
- Customers pages were owner-only (and an existing test asserted staff get 404).
- Seller notifications are database notifications tagged `workspace: 'seller'` (only `SellerOrderNotification` today, sent to `Shop::operators()`). Nothing in the payload names the shop, so `GetNotifications` and the shared `unreadCounts.notifications` count every seller notification the account has, across all its shops. "Mark all read" (`MarkNotificationRead`) clears every unread notification regardless of workspace.

## Design

| Concern | Decision |
| --- | --- |
| Schema | No new table. Migration swaps the unique index to `(shop_id, user_id)` (partial, `user_id IS NOT NULL`). Status stays per membership row. |
| Roles | Derived per shop (`ShopRole`): `shops.user_id` = Owner, active `shop_staff` row = Staff. Never stored on the user. |
| Owned shops | Still one owned shop per account (`shops_user_id_unique`, `hasOne`); the resolver is generic over N. |
| Active shop | `App\Support\ActiveShop`: session key `seller.active_shop_id` used only as a hint, re-validated against live memberships every request; invalid/missing falls back to owned, non-suspended shop first. Memoised per web request only. |
| Resolution API | `User::operatedShop()` (unchanged signature, now the active shop), `operatedShops()`, `activeShopRole()`, `roleIn()`. |
| Privilege split | `ownsShop()` now means "owner of the **active** shop"; `ownsAnyShop()` is the global check. Seller requests read `operatedShop()`, never `$user->shop`. |
| Switching | `PUT /seller/active-shop` (outside `workspace:seller` so a suspended shop can be left). Non-member → 404. Redirects to the new shop's role-appropriate home. |
| Customers | List/detail open to any operator of the active, non-suspended shop; still read-only; still require an order with the active shop. |
| Notifications | Seller notifications carry `shop_id`; the seller list, the header bell count and "mark all read" are scoped to the **active shop**. Each shop in the switcher shows its own unread count so activity in a non-active shop is not invisible. Buyer notifications are untouched. |
| UI | `ShopSwitcher` in the seller header: "My shops" (Owner badge) vs "Managed shops" (Staff badge), active shop + role always shown. |

## Implementation tasks

### Part A — multi-shop staff, dual ownership, switcher, customers (done)

- [x] A1. Migration: replace `shop_staff_user_id_unique` with partial unique `(shop_id, user_id)`.
- [x] A2. `ShopRole` enum and `App\Support\ActiveShop` resolver (session hint, live validation, fallback, per-request memo).
- [x] A3. `User`: `operatedShop()` via resolver, `operatedShops()`, `activeShopRole()`, `roleIn()`, `staffMemberships()`; `ownsShop()` = owner of active shop; add `ownsAnyShop()`.
- [x] A4. `PUT /seller/active-shop` (`ActiveShopController`, `UpdateActiveShopRequest`), outside `workspace:seller`.
- [x] A5. Sweep seller requests/controllers from `$user->shop` to `operatedShop()`.
- [x] A6. Invitation, accept, leave and shop-application rules made per shop; accepting activates the joined shop.
- [x] A7. Chat scoped to the active shop (`Conversation::isParty`).
- [x] A8. Customers list/detail open to staff of the active shop; nav item unrestricted.
- [x] A9. Shared props `seller.shops[]` (+ per-shop `role`, `active`); `ShopSwitcher` in the seller header.
- [x] A10. Admin user screens: `staff_shops` list.
- [x] A11. Tests: `MultiShopStaffTest` plus updates to the route-matrix, customer-exposure and invite tests.

### Part B — per-shop notification scoping (new, merged into this plan)

- [x] B1. **Payload:** in `SellerOrderNotification::toArray()` add `'shop_id' => $this->order->shop_id`.
- [x] B2. **Backfill migration** `2026_11_17_000100_backfill_shop_id_on_seller_notifications`: for `notifications` rows with `data->>'workspace' = 'seller'` and no `shop_id`, set `shop_id` from `orders.shop_id` via `data->>'order_id'` (pgsql only, `data` is text cast through `::jsonb`). Rows whose order no longer exists stay untagged and are dropped from seller lists (they are unreachable anyway).
- [x] B3. **Query helper:** `App\Support\NotificationScope::apply($query, $workspace, $activeShop)` is the single definition of a workspace's notifications (seller = `workspace = 'seller' AND shop_id = :active shop`; no active shop matches nothing; buyer unchanged). The list and count use it now; B8 (mark read) reuses it.
- [x] B4. **List:** `GetNotifications::handle()` takes the active shop when `$workspace === Workspace::Seller` and uses the helper; no active shop returns an empty collection.
- [x] B5. **Header count:** in `HandleInertiaRequests`, replace the seller branch of `unreadCounts.notifications` with the helper for the active shop.
- [x] B6. **Per-shop unread:** add `unread_notifications` to each entry of `seller.shops[]` (single grouped query: `shop_id` => count of unread seller notifications for the user, not N queries); extend `SellerShop` in `types/navigation.ts`.
- [x] B7. **Switcher UI:** show a small unread count next to each non-active shop in `ShopSwitcher` (text label, e.g. "3 new", not colour alone); add the combined total of non-active shops to the trigger's `aria-label`, and show the same count as a visible badge on the trigger so sighted and screen-reader users get the same information.
- [x] B8. **Mark read:** `MarkNotificationRead` takes an optional scope. From the seller workspace, "mark all read" only clears the active shop's seller notifications; a single id must belong to the scope (otherwise no-op). From the buyer inbox, "mark all read" now clears only buyer notifications (it previously also cleared seller ones, which would defeat per-shop scoping). `NotificationReadController` takes a new validated `workspace` field (`buyer` or `seller`); `seller` is honoured only when the user operates a shop, otherwise 404.
- [x] B9. **Frontend wiring:** `pages/notifications.tsx` sends `workspace` with the read requests.
- [x] B10. **Tests** (`tests/Feature/Notification/PerShopNotificationsTest.php`):
  - a user who owns A and staffs B receives order notifications for both; the seller list and bell count show only the active shop's, and switching changes them;
  - `seller.shops[].unread_notifications` reports the other shop's count;
  - "mark all read" in shop A leaves shop B's and the buyer notifications unread;
  - marking a notification id from a non-active shop is a no-op;
  - the backfill assigns `shop_id` to legacy rows and leaves orphaned rows out of the list;
  - removed from shop B, its notifications no longer appear or count.
- [x] B11. **Docs/e2e:** no dedicated notification scenario in `tests/e2e/scenarios.json` (only shell visits to `/account/notifications`); left unchanged.

Dependencies: B1 → B2 → B3 → (B4, B5, B6, B8) → (B7, B9) → B10. Part B needs no new tables and is reversible (the migration only adds a JSON key).

## Edge cases covered by `tests/Feature/Seller/MultiShopStaffTest.php`

Forged session id, switching to a stranger's/pending/unknown shop, guests/buyers/admins, removal from the active shop mid-session (fallback + flash, or back to application flow), leaving a shop, suspended active shop, owner-only routes while acting as staff in a managed shop, order/chat/customer scoping on both sides of a switch.

## Decisions on the open questions

1. **Customer email for staff:** accepted as is. Staff see the same customer details as owners (email, phone numbers, shipping addresses); no masking.
2. **Notification counts:** now in scope as Part B. Seller notifications and counts are scoped per shop, with a per-shop unread count in the switcher so a non-active shop's activity is still visible.
3. **Deep links to a non-active shop:** accepted as is. A link to an order, chat or customer in a shop that is not the active one returns 404 until the user switches shops.
