# Workspaces: Buyer / Seller / Admin

## Goal

Organise the app into three workspaces. One account may belong to several.
The URL prefix is the source of truth for the current workspace — never the
session (session only remembers the last workspace for the post-login
destination).

## Verified facts (2026-11-08)

- Every route under `/seller/*` and `/admin/*` resolves to a FormRequest with
  `authorize()`. `ProductController@create` reuses `ShowSellerDashboardRequest`
  (unconventional pairing, but authorized). No endpoint would 500 for a user
  without a shop — `authorize()` runs before the controller body and all
  checks are null-safe.
- Cross-tenant reads are already scoped: seller order show, product
  edit/update/delete and shipment check `shop_id === $user->shop->id`; buyer
  order show checks `order->user_id`. No policies needed.
- `suspended` is never read on the request path — a suspended (approved) shop
  currently has full Seller Centre access. Gap, fixed in step 1.
- Pending/rejected sellers currently get 404 on every `/seller/*` route
  (`isSeller()` false); only `/seller/register` is reachable.
- Exactly one `role = 'seller'` user exists (`seller@example.com`, approved
  shop). None without a shop. Schema default is `'buyer'` (not `'user'`):
  migrate `seller` → `buyer`.
- Dead `href: '#'` nav items: seller-layout Marketing + Finance;
  admin-layout Users + Audit log + Settings.
- `unreadCounts.chat` aggregates buyer **and** shop conversations.
- `config('fortify.home')` = `/dashboard`; `/chat` and `/notifications` live
  at top level and render in the public shell.
- `CreateCartItemRequest` / `CreateCheckoutRequest` do not guard own-shop
  purchases. `CreateConversationRequest` also allows messaging your own shop
  (left as-is, out of scope).

## Target model

| Workspace | Prefix   | Access                                    |
| --------- | -------- | ----------------------------------------- |
| Buyer     | /account | every verified non-admin user             |
| Seller    | /seller  | approved, non-suspended shops (non-admin) |
| Admin     | /admin   | `users.role === 'admin'`                  |

- Admins get a single unified shell: every buyer and seller surface is
  stripped for them — reads redirect to `/admin/dashboard`, mutations 404
  (`workspace:buyer` group + the admin check in `EnsureWorkspaceAccess`).
  Only the admin workspace and `/settings/*` (profile settings) stay
  reachable. `Workspace::accessibleBy` mirrors this, so the shared
  `workspaces` prop, `RememberWorkspace`, and `LoginResponse` all agree.

- `users.role` stays `buyer | admin` (existing schema default). Migrate
  `seller` → `buyer`; drop the `role === 'seller'` branch from `isSeller()`.
- Seller access states: no shop → `/seller/register`; pending →
  `/seller/register` status view; rejected → `/seller/register` with
  `rejection_reason` and re-apply; approved → Seller Centre; suspended →
  read-only status page at `/seller/suspended` (contact link), all mutations
  denied.
- `/dashboard` 301 → `/account`; `/chat` 301 → `/account/chat`;
  `/notifications` 301 → `/account/notifications`.
- Buyer chat `/account/chat` (conversations where `user_id` = user); seller
  chat `/seller/chat` (conversations where shop owner = user). Same
  controllers/pages, scoped by route prefix.
- Notifications scoped per workspace via `data->workspace`
  (`COALESCE(..., 'buyer')`); only buyer notifications exist today.
- Authorization: FormRequests stay as they are; `workspace:seller` /
  `workspace:admin` middleware aliases are the safety net on the route
  groups. No policies added (no unscoped id fetches found).
- Own-product guard: seller cannot cart or check out own-shop items
  (validation error); product page shows "This is your product".
- Shared props: `workspaces: [{key,label,href,current}]` (allowed only),
  `seller: {status,suspended,shop_name,shop_id} | null`,
  `unreadCounts` scoped to the current workspace. No raw role strings.
- `resources/js/lib/workspaces.ts` holds nav items/labels/icons/match
  prefixes/visibility for all three workspaces; layouts read from it.
- `WorkspaceSwitcher` component in the user menu of all three layouts, the
  public header, and the mobile account drawer.
- `RememberWorkspace` stores `last_workspace` in session on `/account`,
  `/seller`, `/admin` hits; Fortify `LoginResponse` resolves intended URL →
  last workspace (if still allowed) → first allowed workspace home.
- Dead nav items removed; not-yet-built sections gated behind
  `workspaceFeatures` flags in `workspaces.ts`.
- Settings pages stay at `/settings/*` in the buyer layout, reachable from
  every workspace's user menu; for admins they render inside the admin
  shell (`AppLayout` picks the admin shell when the shared `workspaces`
  prop is admin-only).
- Admin menu = admin entries + the profile settings group; the admin
  shell hides the notifications bell, and the storefront chrome hides
  chat/notifications/"Sell on" entries and the product "Chat" buttons.

## Implementation steps

1. `workspace:seller` / `workspace:admin` middleware + aliases + suspended
   enforcement (`/seller/suspended` page) + tests.
2. Role migration (`seller` → `buyer`), `isSeller()` cleanup, shared props
   (`workspaces`, `seller`, scoped `unreadCounts`).
3. Routes/redirects (`/dashboard`, `/chat`, `/notifications`, `/account`
   home, `/account/chat`, `/seller/chat`, `/account/notifications`,
   `/seller/notifications`), Wayfinder regeneration, Fortify home +
   LoginResponse + RememberWorkspace.
4. `workspaces.ts`, `WorkspaceSwitcher`, layout updates, dead links removed,
   scan rule for `href: '#'`.
5. Chat and notification scoping per workspace (requests + actions +
   pages).
6. Own-product purchase guard (requests + product page UI).
7. Tests: persona matrix, switcher, scoping, guard; e2e spec updates.

## Deferred / reported

- Admin notifications page: not added (no admin notifications exist; the
  admin shell shows no bell since `/account/notifications` is stripped).
- Storefront commerce (`/cart`, `/checkout`, `order-confirmed`, `reports`)
  stays reachable for admins — these are public-shell flows, not workspace
  pages; only the `/account` and `/seller` workspace surfaces are
  stripped.
- `CreateConversationRequest` still allows messaging your own shop.
- Seller nav "Chats" now points to `/seller/chat`; buyer badge split done in
  step 5.
