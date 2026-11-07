# 00 - Repo Audit (read-only)

Audited: 2026-11-02, branch `production`, 2 commits (`init`, `chore: configure defaults`), clean tree.
Method: read files only. `vendor/` and `node_modules/` are **not installed** and `php` is **not on PATH**, so versions below come from `composer.lock` / `package-lock.json`, and nothing was executed (no tests, lint, or build run).

## 1. Stack and versions

| Area         | Fact                                                                                                                                | Source                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Starter      | `laravel/vue-starter-kit` (Vue + Inertia + Fortify + shadcn-vue)                                                                    | composer.json            |
| PHP          | `^8.3` (CI uses 8.3)                                                                                                                | composer.json, tests.yml |
| Laravel      | 13.38.0 (`^13.17`)                                                                                                                  | composer.lock            |
| Inertia      | server `inertia-laravel` 3.5.2, client `@inertiajs/vue3` 3.9.1, `@inertiajs/vite`                                                   | locks                    |
| Frontend     | Vue 3.5.44, **TypeScript** 5.9.3, `vue-tsc`                                                                                         | package-lock             |
| Build        | Vite 8.3.5 through **Vite+** (`vp build/dev/check`), `laravel-vite-plugin` 3                                                        | package.json             |
| Routes in TS | Laravel **Wayfinder** (PHP 0.1.23, Vite plugin); generated into `resources/js/{routes,actions,wayfinder}` (gitignored)              | gitignore                |
| Tailwind     | **v4.3.3**, CSS-first (`@import 'tailwindcss'`, `@theme inline` in `resources/css/app.css`). No `tailwind.config.js`                | app.css                  |
| UI lib       | shadcn-vue ("new-york-v4", neutral base) over **reka-ui** 2.11, `class-variance-authority`, `tailwind-merge`, `vue-sonner` (toasts) | components.json          |
| Icons        | `@lucide/vue` 1.61                                                                                                                  | package.json             |
| Font         | **Instrument Sans** (400/500/600) via `bunny()` in `vite.config.ts` + `@fonts` Blade directive. No Manrope                          | vite.config.ts           |
| SSR          | script `build:ssr` exists; `bootstrap/ssr` gitignored                                                                               | package.json             |
| Node         | CI uses 22; local machine has v26.3.0                                                                                               | tests.yml                |

## 2. Backend setup

| Area                      | Fact                                                                                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth                      | **Fortify** (views rendered via Inertia in `FortifyServiceProvider`), email verification, password reset, **2FA**, **passkeys** (`laravel/passkeys`, `PasskeyAuthenticatable`). **Session-based only.** |
| Sanctum / API             | **Not installed.** No `routes/api.php`, no `api` entry in `bootstrap/app.php` `withRouting`. Exception handler already renders JSON for `api/*` and `expectsJson()`.                                    |
| Roles/permissions         | **None** (no spatie/permission, no role column, no gates, no policies).                                                                                                                                 |
| DB                        | SQLite default (`.env.example`); `compose.yaml` and `.devcontainer` exist (Sail); services in compose not inspected in detail.                                                                          |
| Queue / cache / session   | all `database` driver.                                                                                                                                                                                  |
| Storage                   | `FILESYSTEM_DISK=local`; AWS vars present but empty.                                                                                                                                                    |
| Broadcast                 | `BROADCAST_CONNECTION=log`. **No Reverb/Pusher.**                                                                                                                                                       |
| Mail                      | `log` mailer.                                                                                                                                                                                           |
| Search / media / payments | none installed (no Scout, no media lib, no gateway SDK).                                                                                                                                                |
| Locale                    | `APP_LOCALE=en`; **no `lang/` directory**. PHP/Blade copy uses `__()` (e.g. `ProfileController`); Vue pages contain hard-coded English strings and there is no JS i18n library.                         |
| Migrations                | `users` (**ULID PK**), `password_reset_tokens`, `sessions`, `cache`, `jobs`, `passkeys`, `two_factor` columns.                                                                                          |
| Models                    | `User` only (`HasUlids`, `final`, attribute-style `#[Fillable]`/`#[Hidden]`).                                                                                                                           |
| Routes                    | `web.php`: `/` (Welcome), `dashboard` (auth+verified). `settings.php`: profile, security, password, appearance, passkey well-known.                                                                     |
| Middleware                | `HandleAppearance`, `HandleInertiaRequests`, `AddLinkHeadersForPreloadedAssets` appended to `web`.                                                                                                      |
| Inertia shared props      | `name`, `auth.user` (whole `User` model), `sidebarOpen`. No locale, brand, flash, cart count, or unread counts.                                                                                         |
| AppServiceProvider        | `CarbonImmutable`, `prohibitDestructiveCommands` in prod, strict password rules in prod.                                                                                                                |

## 3. Conventions (from code and `.ai/guidelines/*`)

These guidelines are the repo's declared rules for AI agents. **Several differ from the planning prompt** (see section 8).

| Topic            | Rule                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PHP style        | `declare(strict_types=1)` everywhere, `final` classes (Pint enforces `final_class`), Pint `laravel` preset + strict rules, Larastan **level 7** over `app/ bootstrap/app.php config/ database/ routes/`.                                                                                                                                                                                |
| Actions          | `app/Actions/<Name>`, named for what they do, **no suffix**, single `handle()`, constructor DI, `DB::transaction()` when multi-model. Callable from HTTP, API, jobs, commands, MCP. Scaffolded via `php artisan make:action`.                                                                                                                                                           |
| Controllers      | **CRUD-only public methods** (`index/create/store/show/edit/update/destroy`); no custom verbs. Non-CRUD becomes its own noun controller (`PostApprovalController@store`) or an invokable. Thin: form request -> one action -> response. **No `abort`/`authorize`/validation in controllers.** The guideline even uses a moderation queue as an example (`ModerationController@update`). |
| Authorization    | **No policies, no gates, no `can:`**. Authorize and validate **only in FormRequests** (`authorize()` returns `Response::allow()`/`denyAsNotFound()`). One dedicated FormRequest per endpoint, named `List/Show/Create/Update/Delete<Thing>Request`. Complex checks in `App\Rules`.                                                                                                      |
| Migrations       | **Up only**, never a `down()`.                                                                                                                                                                                                                                                                                                                                                          |
| Tests            | Pest 5 (`tests/Feature`, `tests/Unit` suite declared). **No browser tests** (no Playwright / Pest browser). `RefreshDatabase` is commented out in `tests/Pest.php`. Feature tests exist for auth and settings only.                                                                                                                                                                     |
| Git              | Stage new files immediately with `git add`; **never commit** (user commits). `AGENTS.md`, `CLAUDE.md`, `.claude`, `.cursor` etc. are gitignored.                                                                                                                                                                                                                                        |
| Minimal code     | Least code that works; prefer collections and typed accessors.                                                                                                                                                                                                                                                                                                                          |
| AI               | Use the Laravel AI SDK for any AI feature.                                                                                                                                                                                                                                                                                                                                              |
| Frontend layout  | `resources/js/{pages,layouts,components,components/ui,composables,lib,types}`. Pages are lowercase-folder + PascalCase (`auth/Login.vue`, `settings/Profile.vue`). Layout chosen by name prefix in `app.ts`. `components/ui` is shadcn output (excluded from lint/fmt).                                                                                                                 |
| Frontend tooling | Vite+ `vp check` (lint type-aware, `denyWarnings`, fmt: 4 spaces, single quotes, Tailwind class sorting for `cn/clsx/cva`). `vue-tsc --noEmit`.                                                                                                                                                                                                                                         |
| CI               | `.github/workflows/tests.yml`: `composer setup` then `composer ci:check` (= `npm run check`, `types:check`, then `composer test` = pint --test, phpstan, `artisan test`). Dependabot configured.                                                                                                                                                                                        |

## 4. Theme and responsiveness

- Tokens live in `resources/css/app.css`: shadcn variable set (`--background`, `--primary`, `--muted-foreground`, `--border`, `--radius: 0.5rem`, sidebar and chart vars) mapped via `@theme inline`, with a `.dark` block. Current palette is **neutral grayscale**, not the green brand. Dark mode via `.dark` class (`useAppearance`, `HandleAppearance` cookie).
- **Breakpoints are Tailwind v4 defaults** (not overridden): sm 640, md 768, lg 1024, xl 1280, 2xl 1536. These match your tiers (phone <640, tablet 640-1023, desktop 1024+).
- Existing layouts use Tailwind's default **min-width (mobile-first)** prefixes (`sm:`, `md:`, `lg:`). No desktop-first `max-*` patterns were found in layouts/pages.
- No bottom tab bar, bottom sheet, sticky action bar, or safe-area handling exists. `<meta viewport>` is plain (no `viewport-fit=cover`). Existing shell is the shadcn **sidebar** (`AppSidebarLayout`) or header layout.
- `components.json` still references `tailwind.config.js`, which does not exist (harmless for Tailwind v4; relevant only when running the shadcn-vue CLI).
- Hard-coded colors remain in `Welcome.vue` and `app.ts` (`progress.color: '#4B5563'`).

## 5. Existing shadcn-vue UI components (`components/ui`)

alert, avatar, badge, breadcrumb, button, card, checkbox, collapsible, dialog, dropdown-menu, input, input-otp, label, navigation-menu, select, separator, sheet, sidebar, skeleton, sonner, spinner, tooltip (listing was truncated at 25 entries; the remainder was not enumerated). Button heights are 32-40px (`h-8/h-9/h-10`): **below the 44px touch target** in your quality bar.

## 6. Already built toward the page inventory

| Inventory item                                                                                   | Status                                         |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Auth (login, register, reset, verify, 2FA, passkeys)                                             | exists (not in inventory, reusable as is)      |
| Buyer settings (profile, security, appearance)                                                   | exists, partially covers "buyer settings"      |
| Dashboard                                                                                        | placeholder only                               |
| Welcome                                                                                          | Laravel starter splash, to be replaced by home |
| Everything else (catalog, cart, checkout, orders, shops, chat, seller center, moderation, admin) | **nothing built**                              |

## 7. Fit for mobile reuse

| Question                   | Answer                                                                                                                                                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Business logic in Actions? | Convention says yes. In practice only `CreateNewUser`/`ResetUserPassword` (Fortify contracts) exist in `app/Actions`. Profile logic is **inline in `ProfileController`** (`fill`, `isDirty`, `save`, logout/delete). |
| `/api` surface             | None.                                                                                                                                                                                                                |
| Auth                       | Session only (Fortify). No token auth.                                                                                                                                                                               |
| Controllers return         | Inertia responses/redirects. No API Resources.                                                                                                                                                                       |
| Rate limiters              | `login`, `two-factor`, `passkeys` defined.                                                                                                                                                                           |

The Action-first convention is a good base for sharing logic between Inertia and a future `/api/v1`.

## 8. Concerns (real ones only)

| #   | Concern                                                                                                               | Impact                                                                                                                                                               | Cheap alternative                                                                                                                                                               |
| --- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | **Repo guideline: no policies/gates; authorize only in FormRequests.** Your prompt asks for "authorization policies". | Moderation/role design must follow the repo. Roles-per-endpoint checks live in each FormRequest, so a shared role check needs a reusable trait or `App\Rules` class. | Follow the repo. Put role helpers on `User` (`isModerator()`, etc.) and call them from FormRequests.                                                                            |
| C2  | **Repo guideline: no browser tests.** Your prompt wants 360/768/1280 verification, "browser tests if feasible".       | Responsive acceptance cannot be automated with Playwright/Pest Browser under current rules.                                                                          | Keep Feature/Unit tests for behavior. Do the 360/768/1280 check manually (or via the browser preview), recorded as a checklist per ticket. Ask whether to lift the rule (OPEN). |
| C3  | **Repo guideline: controllers are CRUD-only; migrations up-only; never commit.**                                      | Shapes naming (e.g. `ShopApplicationApprovalController@store`) and workflow.                                                                                         | Adopt as is.                                                                                                                                                                    |
| C4  | `User` docblock says `@property int $id` and `types/auth.ts` says `id: number`, but the DB uses **ULIDs (strings)**.  | Wrong types at the Inertia boundary and for the future API.                                                                                                          | Fix docblock/TS type when touching those files (Phase 4 ticket, needs approval).                                                                                                |
| C5  | `HandleInertiaRequests` shares the **entire `User` model** as `auth.user`.                                            | Leaks any new column (phone, role, etc.) to every page and is not API-shaped.                                                                                        | Share an explicit subset or an API Resource when adding roles/brand props.                                                                                                      |
| C6  | Default **queue/cache/session = database** and **broadcast = log**, SQLite default.                                   | OK for dev. Chat realtime, queued moderation jobs, and Meilisearch need Redis/Reverb/Postgres or MySQL for production.                                               | Decide in Phase 3. No change now.                                                                                                                                               |
| C7  | Vue pages have hard-coded English strings and there is no JS i18n layer; `lang/` is missing.                          | Conflicts with "all copy in translation files from day one".                                                                                                         | Phase 3 proposes the smallest option (Laravel JSON translations shared via Inertia).                                                                                            |
| C8  | Font (Instrument Sans), grayscale palette, and 32-40px controls differ from the design system.                        | Expected, not a defect. Button/Input sizing needs a mobile-size variant.                                                                                             | Token swap in `app.css` plus a `touch` size variant. Nothing changed now.                                                                                                       |

## 9. Gaps vs decided scope

Missing entirely: roles (buyer/seller/moderator/admin), Sanctum + `/api/v1`, all marketplace domain tables and models, media/image pipeline, search, payment gateway, realtime chat transport, push notifications, i18n layer, brand/config store, PWA manifest/service worker, mobile layout primitives (bottom tab bar, bottom sheet, sticky action bar), Manrope font, status/moderation color tokens, any Feature tests beyond auth/settings.

Reference template: no HTML zip found in `docs/`, `design/`, `reference/`, or elsewhere in the repo (those folders do not exist). I will rely on the tokens in your prompt.

## 10. Summary and conventions for all later work

The scaffold is a clean, current Laravel 13 / Inertia 3 / Vue 3 + TS / Tailwind 4 / shadcn-vue starter with Fortify (sessions, 2FA, passkeys), Pest, Pint, Larastan L7 and an Action-first backend convention. Only `User` exists, so the marketplace is greenfield on top of a solid foundation.

Conventions I will follow:

1. Business logic in `app/Actions/<VerbNoun>` with `handle()`; the same action serves Inertia and a future `/api/v1`.
2. CRUD-only, thin controllers; non-CRUD concepts become noun controllers. Auth and validation only in per-endpoint FormRequests (no policies/gates).
3. `declare(strict_types=1)`, `final` classes, ULID keys, up-only migrations, Pint + Larastan L7 clean.
4. Tailwind v4 `@theme inline` + CSS variables (extend the existing shadcn token names rather than adding a parallel system); mobile-first `min-width` only; defaults breakpoints 640/768/1024/1280.
5. Reuse shadcn-vue + lucide; add components only where missing.
6. Pest Feature/Unit tests; no browser tests unless you lift the rule.
7. Stage new files with `git add`, never commit. No code changes until Phase 4 approval.

## Questions to resolve (batched, with defaults)

| #   | Question                                                                                                              | Recommended default                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Q1  | Lift the "no browser tests" rule so 360/768/1280 checks can be automated?                                             | Keep the rule for now; manual responsive checklist per ticket.            |
| Q2  | Confirm that "authorization policies" in your brief should become **FormRequest-based authorization** per repo rules? | Yes, follow the repo.                                                     |
| Q3  | The HTML template zip was not found. Provide it, or proceed from the tokens only?                                     | Proceed from tokens; add the zip to `docs/reference/` later if available. |

---

## Addendum (2026-11-02, after owner answers)

| Item               | Resolution                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1 browser tests   | **DECIDED: allowed.** `.ai/guidelines/general.blade.php` updated. Browser tests cover 360/768/1280 checks. Tooling (Pest browser plugin vs Playwright) to be chosen in Phase 3.                                                                                                                                                                                                                                                                      |
| Q2 policies        | **DECIDED:** follow repo. FormRequest-based authorization, no policies/gates.                                                                                                                                                                                                                                                                                                                                                                        |
| Q3 template        | **Found** at `/Users/john/Downloads/wadiya-marketplace-template` (21 static HTML pages + README, 300K). Not yet copied into the repo. Pages: index, products, product-detail, shops, shop-profile, categories, category, cart, checkout, chat, account-{dashboard,orders,start-selling,addresses,settings}, seller-{dashboard,orders,products,customers,messages,settings}. Uses Tailwind v2 CDN and Manrope via Bunny (neither to be carried over). |
| Frontend framework | **DECIDED: React 19 (replaces Vue).** Swap performed from `laravel/react-starter-kit` (main, 2026-10-29).                                                                                                                                                                                                                                                                                                                                            |

### What the Vue to React swap changed

- Replaced `resources/js` wholesale with the React kit (`app.tsx`, `pages/*.tsx`, `layouts/`, `hooks/`, `components/`, shadcn React `components/ui`). Files are kebab-case (`two-factor-challenge.tsx`); hooks replace composables.
- Replaced `package.json` (React 19, `@inertiajs/react`, Radix UI, `lucide-react`, `sonner`, `@vitejs/plugin-react` + React Compiler via `@rolldown/plugin-babel`), `vite.config.ts`, `tsconfig.json` (`jsx: react-jsx`), `components.json` (shadcn "new-york", tsx), added `pnpm-workspace.yaml`. `package-lock.json` regenerated. **Side effect:** `vite-plus` moved 0.3.0 -> 1.4.0 and Vite is aliased to `@voidzero-dev/vite-plus-core` (upstream setup).
- `resources/views/app.blade.php`: `@viteReactRefresh`, `app.tsx`, `.tsx` page resolution.
- Inertia page names are now kebab-case, updated in `FortifyServiceProvider`, `ProfileController`, `SecurityController`, `routes/web.php`, `routes/settings.php`, and the 3 Feature tests that assert component names.
- Backend (final classes, strict types, Pest) was **not** overwritten; the upstream PHP differs from this repo in nearly every file. `resources/css/app.css` also kept as is.
- `composer.json` package name -> `laravel/react-starter-kit`.

### Not verified

`php`/`composer` are unavailable locally, so Wayfinder files (`resources/js/routes|actions|wayfinder`) are not generated. `tsc --noEmit` reports errors **only** for those missing imports. Lint (`vp check`), `vite build`, Pest, and Pint have not been run. Verification needs PHP (Sail or a local install).

### Supersedes earlier rows

Sections 1, 3, 4, 5, 6 and 7 above describe the old Vue frontend. Where they mention Vue/`.vue`/`@lucide/vue`/reka-ui/vue-sonner/vue-tsc, read React equivalents (`lucide-react`, Radix UI, `sonner`, `tsc`). C4 now applies to `resources/js/types/auth.ts` in the React kit (`id: number` vs ULID string); C7 (hard-coded copy, no i18n) still applies.

### Addendum 2: Sail + Boost + verification (2026-11-02)

- **Environment:** OrbStack + Laravel Sail (PHP 8.5 image, Postgres 18, Redis, Mailpit, Typesense per `compose.yaml`). `vendor/` and `node_modules/` now installed; `.env` created for Sail (pgsql, redis, mailpit). `FORWARD_*` ports appended to `.env` because 5432/6379/1025/8025 were already bound locally.
- **Boost:** `php artisan boost:install --guidelines --skills --mcp` run. It detected **Codex** only (`.codex/config.toml` already existed). Result: `AGENTS.md` generated (gitignored), guidelines synced into `.ai/guidelines`, 8 skills installed to `.agents/skills` (gitignored dir): inertia-react-development, wayfinder-development, tailwindcss-development, laravel-best-practices, fortify-development, testing-best-practices, infer-conventions, deploying-to-cloud. `boost:add-skill https://github.com/laravel/react-starter-kit` returns "no valid skills" — that repo ships none; the URL was interpreted as the starter kit itself.
- **Verified in Sail:** `artisan wayfinder:generate` OK; `npm run build` OK; `tsc --noEmit` OK; `vp check` OK (lint + format); Pint OK; **phpstan L7: 0 errors**; **Pest: 38/38 pass**.
- **Fixes made during verification:** `tests/Unit/` created (phpunit suite declared but dir missing); `User` docblock `id` -> `string` (ULID); `ProfileValidationRules` docblocks -> `Unique|ValidationRule` (upstream react kit convention; `Unique` is `Stringable` in L13); `types/auth.ts` `User.id` -> `string`.
- **Open:** skills/guidelines installed for Codex only. Other tools (Claude Code, Cursor, Devin) were never specified; Boost detected agents automatically.
