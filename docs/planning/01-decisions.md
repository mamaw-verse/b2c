# 01 — Decisions

Status of every decision going into the PRD and architecture phases.
**DECIDED** = confirmed by the user, do not reopen. **PROPOSED** = my recommendation, needs approval.
**OPEN** = still needs an answer or a Phase 3 investigation.

## Product

| #   | Decision                                                                                                                                                                       | Status  | Notes                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ---------------------------------------------------------- |
| D1  | Market: Philippines; currency PHP (₱)                                                                                                                                          | DECIDED |                                                            |
| D2  | English first, Filipino-ready; all copy in translation files from day one                                                                                                      | DECIDED | No `lang/` dir exists yet — see Gaps in `00-repo-audit.md` |
| D3  | Business model: commission per completed order, configurable per category and per shop                                                                                         | DECIDED | Subscriptions and listing fees out of MVP                  |
| D4  | Roles: guest, buyer, seller (one shop), moderator, admin; one account can be buyer + seller                                                                                    | DECIDED | Buyer upgrades via "Start selling"                         |
| D5  | Seller onboarding: application → admin/moderator review → shop live                                                                                                            | DECIDED |                                                            |
| D6  | Generic configurable verified/official badge module; badges only after verification                                                                                            | DECIDED | Not tied to one certification type                         |
| D7  | Listing moderation: first N listings need approval (N configurable); afterwards post-moderation via auto-flags + reports                                                       | DECIDED | Both thresholds config                                     |
| D8  | Payments: online gateway (e-wallets + cards) + COD; funds held until delivery confirmed; seller paid minus commission via payout ledger; manual payouts in MVP                 | DECIDED | Gateway choice is OPEN (see D20)                           |
| D9  | Shipping: seller-fulfilled; seller sets fee, marks shipped with tracking number; courier APIs v2                                                                               | DECIDED |                                                            |
| D10 | Orders split per shop under one checkout                                                                                                                                       | DECIDED |                                                            |
| D11 | Chat: buyer↔seller only; text + images + product/order cards; report/block; moderators read reported threads only                                                              | DECIDED |                                                            |
| D12 | Reviews: verified purchasers only, after order completion; stars + text + photos                                                                                               | DECIDED |                                                            |
| D13 | Returns/refunds: buyer requests within configurable window; seller resolves; unresolved → moderation dispute queue                                                             | DECIDED |                                                            |
| D14 | White-label: one brand per deployment in MVP; all brand assets/copy/colors from config/DB + CSS variables; schema must not block multi-tenancy                                 | DECIDED | Cheapest tenancy path proposed in Phase 3                  |
| D15 | Compliance: Philippine Data Privacy Act principles (consent, minimal data, deletion/export on request)                                                                         | DECIDED |                                                            |
| D16 | MVP scope: browse, search, product detail w/ variations, cart, checkout, order tracking, seller center, chat, reviews, basic vouchers, notifications, admin moderation console | DECIDED | Flash-sale/campaign blocks v2                              |

## Responsive & UX

| #   | Decision                                                                                                                         | Status  | Notes                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------- |
| D17 | Mobile-first: phone (360–639) → tablet (640–1023) → desktop (1024+); `min-width` queries only; verified at 360/768/1280          | DECIDED | Tailwind defaults (640/768/1024/1280) match — see audit          |
| D18 | Shopee-style interaction patterns (not branding/assets); Lazada only for official-store trust badge                              | DECIDED |                                                                  |
| D19 | Per-tier behavior: bottom tab bar on phone, drawers/sheets, card-fallback tables, sticky action bars, split-view chat on tablet+ | DECIDED | Full list in original brief; restated in PRD acceptance criteria |

## Technology & stack

| #   | Decision                                                                                                                                 | Status                                    | Notes                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| D20 | Payment gateway (PayMongo vs Xendit)                                                                                                     | OPEN                                      | Decide in Phase 3 on marketplace split-payout support                                                     |
| D21 | Vue → React migration (React 19, Inertia React, Radix UI, lucide-react, sonner)                                                          | DECIDED                                   | Done as pre-step; verified via Sail (build, tsc, phpstan, Pest all green)                                 |
| D22 | Backend stays Laravel/Fortify/Inertia; same business logic serves Inertia + versioned `/api/v1` JSON (Sanctum) for the future native app | DECIDED (direction), PROPOSED (mechanics) | No `api.php` or Sanctum yet — new packages in Phase 3                                                     |
| D23 | Authorization via FormRequests per endpoint (repo convention) — no policies/gates                                                        | DECIDED                                   | User confirmed; overrides the brief's "policies" wording                                                  |
| D24 | Browser tests allowed                                                                                                                    | DECIDED                                   | User confirmed; repo guideline updated. Used for 360/768/1280 verification where feasible                 |
| D25 | Controllers CRUD-only + thin; business logic in `app/Actions` `handle()` classes; multi-model ops in `DB::transaction()`                 | DECIDED                                   | Repo convention, confirmed in `.ai/guidelines`                                                            |
| D26 | `declare(strict_types=1)`, `final` classes, up-only migrations, Pest, Pint, Larastan L7                                                  | DECIDED                                   | Existing conventions; keep                                                                                |
| D27 | Search: Scout vs plain DB                                                                                                                | OPEN                                      | Sail already runs **Typesense** — PROPOSED: Scout + Typesense over adding Meilisearch. Confirm in Phase 3 |
| D28 | Realtime chat: Laravel Reverb                                                                                                            | PROPOSED                                  | Nothing exists; Reverb is the first-party fit for the stack. Alternatives (Pusher/Ably) noted in Phase 3  |
| D29 | DB for dev/CI: Postgres via Sail (SQLite still supported locally)                                                                        | DECIDED (de facto)                        | `.env` now points at Sail Postgres on forwarded port 54329                                                |
| D30 | Native app framework (Flutter / RN / Capacitor-PWA)                                                                                      | OPEN                                      | Phase 3 comparison + recommendation                                                                       |

## Design system

| #   | Decision                                                                                                                                                                     | Status                      | Notes                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| D31 | Token set from `design-system-phase1` package (tokens.json, role-named CSS variables, Tailwind v4 `@theme`)                                                                  | DECIDED (use as foundation) | User-provided at `/Users/john/Downloads/design-system-phase1`. Includes brand scale 50–950, semantic surfaces, status colors |
| D32 | Status colors: success `#067647`, warning `#b54708`, danger `#b42318`, sale/discount `#c2310f`, info — from the package's tokens                                             | DECIDED                     | Matches the "propose status tokens" requirement; already WCAG-checked                                                        |
| D33 | WCAG AA: contrast report passes 64/64 pairs (incl. muted `#566159` at 6.07:1)                                                                                                | DECIDED                     | `docs/contrast.md` in the package; muted-foreground darkened vs template's `#6b756e` to pass AA — adopt package values       |
| D34 | Font: Manrope variable, self-hosted (`@fontsource-variable/manrope`), system fallback                                                                                        | DECIDED                     | Replaces Instrument Sans; woff2 files already generated                                                                      |
| D35 | Icons: Lucide (matches repo's `lucide-react` + package's `lucide-static` sprite)                                                                                             | DECIDED                     | No emoji icons in UI                                                                                                         |
| D36 | Radius/elevation/spacing tokens from package `tokens.css` (panels 12, cards 11, buttons 8, etc.)                                                                             | DECIDED                     |                                                                                                                              |
| D37 | Brand swappability: palette via CSS variables + `tokens/brands/*.json` overrides; components read variables only                                                             | DECIDED                     | `brand:demo` in package proves the mechanism                                                                                 |
| D38 | How the package lands in the repo: port `tokens.css`/`tokens.json` + font setup into `resources/css` and a shared `tokens.json`; do NOT copy its build scripts or styleguide | PROPOSED                    | Detail in Phase 3; keeps repo's Vite/Tailwind v4 pipeline as the single build                                                |

## Process & repo

| #   | Decision                                                                                                                                        | Status  | Notes                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------- |
| D39 | No code changes until Phase 4 approved; phases stop for approval                                                                                | DECIDED | This file ends Phase 1                |
| D40 | No commits; stage new files only                                                                                                                | DECIDED | Repo convention                       |
| D41 | Template at `/Users/john/Downloads/wadiya-marketplace-template` = visual/page-inventory reference only; no Tailwind v2 CDN, no hotlinked images | DECIDED |                                       |
| D42 | Work runs through Sail/OrbStack (no host PHP)                                                                                                   | DECIDED | Sail services left running            |
| D43 | Boost generated `AGENTS.md`, `.ai/guidelines`, `.agents/skills`; Codex MCP configured. Other AI tools not configured                            | DECIDED | If more tools wanted, user names them |

## Open questions (non-blocking)

| #   | Question                                                                                                     | Recommended default                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Q1  | `config/inertia.php` still lists `.vue` extension — remove now or leave harmless?                            | Remove in the Phase 4 foundation ticket                                             |
| Q2  | Which AI tools beyond Codex to configure (Claude, Cursor, Devin)?                                            | Leave as-is unless requested                                                        |
| Q3  | Default values for config knobs (first-N listings, return window, commission %, report auto-hide threshold)? | Propose defaults in Phase 3; all live in a `marketplace` config + DB settings table |
| Q4  | PWA install prompt + offline basics — MVP or v2?                                                             | v2, but design URLs/manifest-ready now                                              |

## Contradictions resolved

| Brief item                         | Repo reality                          | Resolution                                               |
| ---------------------------------- | ------------------------------------- | -------------------------------------------------------- |
| "Authorization policies"           | Guidelines forbid policies/gates      | FormRequest authorization (D23)                          |
| "Run browser tests"                | Guidelines forbade browser tests      | User lifted the rule (D24); guideline file updated       |
| Desktop-first template breakpoints | Repo uses min-width Tailwind defaults | Template values = desktop end of a min-width scale (D17) |
| Template's `#6b756e` muted gray    | Fails AA at small sizes               | Adopt package's `#566159` (D33)                          |
