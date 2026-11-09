---
paths:
    - 'resources/js/lib/workspaces.ts'
    - 'resources/js/layouts/**'
    - 'resources/js/pages/admin/**'
    - 'resources/js/pages/seller/**'
    - 'resources/js/pages/account/**'
---

# Workspaces and navigation

The app has three workspaces (portals), each with its own shell, page directory, route prefix, and audience:

| Workspace | Label           | Route prefix | Pages                        | Audience                      |
| --------- | --------------- | ------------ | ---------------------------- | ----------------------------- |
| `buyer`   | "My account"    | `/account/*` | `resources/js/pages/account` | Every authenticated user      |
| `seller`  | "Seller Centre" | `/seller/*`  | `resources/js/pages/seller`  | Users with an approved shop   |
| `admin`   | "Admin"         | `/admin/*`   | `resources/js/pages/admin`   | Users with `role === 'admin'` |

All navigation is defined centrally in `resources/js/lib/workspaces.ts` and rendered by `resources/js/layouts/workspace-shell.tsx` (sidebar on md+, bottom tabs + drawer on phones). Never hardcode nav links in pages or layouts — add a `WorkspaceNavItem` to the right workspace's `nav` array.

## Which workspace does a new feature belong to?

- **buyer**: things a shopper does for themselves — orders/purchases, addresses, chats, notifications. Account settings (Profile, Security, Appearance) live in the shared `accountSettingsNavGroup`, which also appears in the admin menu.
- **seller**: managing a shop — seller orders, products, shop settings. If the page serves the user's role _as a seller_, it goes here, not in buyer.
- **admin**: operating/moderating the marketplace — dashboard, moderation queue, reports, user management, audit log, settings. Admin routes must be authorized via an `App\Http\Requests\Admin\*` form request using `$user->isAdmin()` (return `Response::denyAsNotFound()` for non-admins).

A feature that serves multiple audiences (e.g. orders exist for buyers _and_ sellers) gets a page and nav item per workspace, under that workspace's route prefix — do not cross-link workspaces.

## Adding a menu item

Add an entry to the matching `nav` group in `workspaces.ts`:

- `href`: use the generated Wayfinder route helper (`@/routes/...`) when the route exists.
- `matchPrefix`: URL prefix that marks the item active; use `exact: true` for workspace home items that would otherwise match everything.
- `icon`: a `lucide-react` icon.
- `badgeKey`: `'orders' | 'chat' | 'queue'` if the item shows a live count (wired in `workspace-shell.tsx` via the `badges` prop / `pendingQueueCount`).

## Planned-but-unbuilt sections

If a nav item points to a section that doesn't exist yet, add a `'workspace.section': false` flag to `workspaceFeatures` and set `feature` on the item. `navGroups()` filters flagged items out so no dead links render; flip the flag to `true` when the section ships.

## Discoverability caveat

Workspace entry points are **not** linked across portals — the admin portal, for example, is only reachable by typing `/admin/dashboard` (or via the workspace switcher in the drawer/user menu where implemented). If a user logs in and "only sees the account portal", that is expected; check their role and navigate to the workspace home directly.
