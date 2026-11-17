# 12 — Multi-shop staff, dual ownership and the Seller Centre shop switcher

## Findings (before changes)

- `shop_staff` was already the membership table (shop, user, email, per-shop `status`), but a Postgres partial unique index `shop_staff_user_id_unique` limited each user to **one** membership.
- `User::operatedShop()` returned "owned shop, else the single staff shop" and was the only shop resolver; `User::ownsShop()` meant "owns any approved shop", `$user->shop` was `hasOne`.
- ~25 seller FormRequests/controllers guarded owner-only actions with `ownsShop()` and then read `$user->shop` — correct only while a user could have one shop.
- Invitation, registration and invite-validation rules explicitly blocked "owner of a shop" and "staff at another shop".
- Customers pages were owner-only (and an existing test asserted staff get 404).

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
| UI | `ShopSwitcher` in the seller header: "My shops" (Owner badge) vs "Managed shops" (Staff badge), active shop + role always shown. |

## Edge cases covered by `tests/Feature/Seller/MultiShopStaffTest.php`

Forged session id, switching to a stranger's/pending/unknown shop, guests/buyers/admins, removal from the active shop mid-session (fallback + flash, or back to application flow), leaving a shop, suspended active shop, owner-only routes while acting as staff in a managed shop, order/chat/customer scoping on both sides of a switch.

## Open questions

- Customer details expose email, phone numbers and shipping addresses; staff now see them. Mask email for staff if that is not intended.
- Per-shop unread counts for notifications are still account-wide for the seller workspace.
- Deep links to a resource in a non-active shop return 404 until the user switches.
