# Bot Check (Turnstile), Google Sign-In & Analytics — Spec, Implementation Plan & Tasks

|                              |                                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Repo**                     | `mamaw-verse/b2c` @ `f35f0da` (Laravel 13, Inertia 3, React, Fortify with passkeys + 2FA)                                                                                                         |
| **Reference implementation** | `/Users/john/Develop/b2b-marketplace/docs/google-sign-in-turnstile-analytics.md` and the code in `/Users/john/Develop/b2b-marketplace` (GitHub: `mamaw-verse/b2b-marketplace`, read at `62331d6`) |
| **Estimate**                 | ≈ 8 engineer-days (Turnstile 2 d, Google 3.5 d, Analytics 2.5 d)                                                                                                                                  |

Sizing: S ≤ 0.5 day, M ≈ 1–2 days, L ≈ 3+ days. Priority: P0 blocks later tasks, P1 core, P2 optional. Conventions in `.ai/rules/*` apply: Actions for logic, thin CRUD-only controllers, one form request per endpoint, no policies, complex checks in `App\Rules\*`, ULID tables, forward-only migrations, Wayfinder route helpers (no literal URLs), semantic tokens only, `git add` new files, never commit, e2e on all four projects.

> **About the reference document.** `docs/google-sign-in-turnstile-analytics.md` is not in the GitHub repository (not on `main`, no other branch has it), so I could not read it. The b2b implementation was read from its code instead (listed in each task). If the doc says something the code does not, the doc wins: say so and I will adjust. The b2b code is Livewire/Blade/Alpine and is used for **behaviour and security decisions only**, not for style.

---

## 0. Findings and scope

### 0.1 What b2c has today

| Area           | State                                                                                                                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Auth           | Fortify with registration, password reset, email verification, 2FA (confirm + `confirmPassword`) and **passkeys**. Views are Inertia pages in `resources/js/pages/auth/*`, built with Fortify `<Form>` + Wayfinder (`login.tsx`, `register.tsx`, `forgot-password.tsx`). |
| Credentials    | `FortifyServiceProvider::configureActions()` → `Fortify::authenticateUsing` does `Hash::check($request->input('password'), $user->password)` and rejects suspended users. `users.password` is **not nullable**.                                                          |
| Post-login     | `App\Http\Responses\LoginResponse` sends the user to the intended URL or the last workspace.                                                                                                                                                                             |
| Registration   | `Actions\Fortify\CreateNewUser` also accepts a pending **shop-staff invitation** (`staff_invitation_id` in session) and marks the email verified.                                                                                                                        |
| Password flows | `Settings\SecurityController@update` uses `PasswordUpdateRequest` (requires `current_password`). 2FA and passkey actions use `password.confirm`.                                                                                                                         |
| Page head      | `resources/views/app.blade.php` renders the SEO block (`App\Support\Seo`) and `<x-inertia::head>`. No CSP.                                                                                                                                                               |
| Missing        | No Socialite, no Turnstile, no analytics, no privacy-policy or cookie-notice page (only `seller/terms`).                                                                                                                                                                 |

### 0.2 What b2b does (the behaviour being ported)

| Part             | b2b implementation                                                                                                                                                                                                                                                  | Port to b2c?                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Turnstile verify | `Services/TurnstileVerifier` (siteverify, 5 s timeout, optional hostname/action check, fails closed), `Rules/TurnstileRule`, field `cf-turnstile-response` on login, register, forgot-password. Cloudflare dummy keys by default.                                   | **Yes**, simplified (§2).                                                                |
| "Human pass"     | `POST /human-check` issues an encrypted 20-minute cookie (`Support/HumanPass`) checked by `EnsureHumanPass` and a Livewire trait for guest forms.                                                                                                                   | **Not in v1** (P2, T-12). b2c has no guest-writable form today except what plan 10 adds. |
| Google sign-in   | Socialite, `users.google_id` (unique) + nullable password, links an existing account by **verified email**, creates new verified users, `Auth::login`, plus a **Google re-authentication** route that satisfies password confirmation for users without a password. | **Yes**, with extra security rules (§3.2).                                               |
| GA4 tag          | `gtag` snippet in the storefront layout when `GOOGLE_ANALYTICS_ID` is set.                                                                                                                                                                                          | **Yes**, but consent-gated and SPA-aware (§4).                                           |
| GA reporting     | `Services/GoogleAnalyticsService` (Data API, service account) feeding an admin analytics page.                                                                                                                                                                      | **P2** (T-30).                                                                           |

### 0.3 Findings that change the plan

| #   | Finding                                                                                                                                                                                                                                                | Consequence                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| H1  | Fortify's `password.email` and `register` routes are registered by the package, so there is nowhere to add a validation rule for forgot-password.                                                                                                      | One `EnsureTurnstile` web middleware keyed on route names covers login, register and forgot-password uniformly (T-02).     |
| H2  | `authenticateUsing` calls `Hash::check(…, $user->password)`; with a nullable password this is `Hash::check(…, null)`.                                                                                                                                  | It must treat a null password as "no match" (T-14). Otherwise Google-only accounts error out at login.                     |
| H3  | A Google sign-in that calls `Auth::login()` **skips Fortify's 2FA challenge**. b2b does exactly this.                                                                                                                                                  | In b2c a user with confirmed 2FA must still go to `two-factor.login` (T-15).                                               |
| H4  | b2b links an existing account by Google's verified email without checking whether the **existing account's email was ever verified**. An attacker could pre-register `victim@x.com` with a password and keep it after the victim signs in with Google. | When linking to an account whose `email_verified_at` is null, clear its password (and remember token) at link time (T-13). |
| H5  | b2c's `password.confirm` (2FA, passkey changes) and `current_password` rules assume a password exists.                                                                                                                                                 | Google-only users need a Google re-authentication path and a "set password" path (T-17, T-18).                             |
| H6  | Staff invitations are consumed in `CreateNewUser`. A Google sign-up with an invited email would skip that.                                                                                                                                             | Reuse `AcceptShopStaffInvitation` in the Google sign-up path (T-13).                                                       |
| H7  | Inertia navigations use `history.pushState`; a GA tag in `app.blade.php` would log one page view per full load only, and reset-password and invitation URLs carry tokens.                                                                              | Send page views manually from the Inertia `navigate` event with redacted paths (T-24).                                     |
| H8  | There is no privacy page or consent UI, and the project serves the Philippines (Data Privacy Act).                                                                                                                                                     | GA stays **off until the visitor accepts** a notice (T-22/T-23); counsel/DPO to confirm wording (gate G-C1).               |
| H9  | Admin and seller workspaces are internal users and carry customer data.                                                                                                                                                                                | Analytics is not sent from `/admin/*` or `/seller/*` (G-C2).                                                               |

### 0.4 Decision gates

| Gate | Decision                                                 | Recommended default                                                                                                                                                                                   |
| ---- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G-T1 | Turnstile failure mode (Cloudflare down, script blocked) | **Fail closed** for auth forms with a clear message; no low-risk fail-open in v1.                                                                                                                     |
| G-T2 | Which forms                                              | Login, register, forgot-password. Not 2FA challenge, passkey sign-in or Google (each already has a strong factor or its own challenge).                                                               |
| G-T3 | e2e strategy                                             | e2e runs with `TURNSTILE_ENABLED=false`, plus one spec using Cloudflare's always-pass test keys that proves the widget wiring.                                                                        |
| G-G1 | Link by email                                            | Link an existing account only when Google reports a verified email; apply H4.                                                                                                                         |
| G-G2 | Who may use Google                                       | Any user, including admins, **subject to 2FA challenge (H3)** and suspension.                                                                                                                         |
| G-G3 | Password-less accounts                                   | Support Google re-auth for `password.confirm` (T-17) **and** a "set password" flow (T-18). If you want less scope, drop T-17 and make "set password" mandatory before 2FA or passkeys can be enabled. |
| G-G4 | Unlink                                                   | P2. Allowed only when the account has a password.                                                                                                                                                     |
| G-C1 | Consent wording and retention                            | Needs legal/DPO sign-off before analytics goes live. Build with Accept / Decline, default **no tracking**.                                                                                            |
| G-C2 | Excluded areas                                           | `/admin/*`, `/seller/*`, and all auth, reset and invitation URLs.                                                                                                                                     |
| G-C3 | Event list                                               | `page_view`, `sign_up`, `login`, `view_item`, `add_to_cart`, `begin_checkout`, `purchase`. No user ids, emails or names are ever sent.                                                                |

### 0.5 Out of scope

Other social providers (Facebook, Apple); reCAPTCHA; the b2b "human pass" cookie (P2 only); server-side GA (Measurement Protocol); ads or remarketing tags; Google Tag Manager; session-recording tools.

---

## 1. Shared groundwork

### T-00. Environment keys and config (S, P0)

**Files:** `config/services.php`, `.env.example`, `app/Http/Middleware/HandleInertiaRequests.php`

- [ ] `config/services.php`:
    - `turnstile` → `enabled` (`TURNSTILE_ENABLED`), `key` (`TURNSTILE_SITE_KEY`), `secret` (`TURNSTILE_SECRET_KEY`), `protected_routes` (`login.store`, `register.store`, `password.email`; confirm real names with `php artisan route:list`), `expected_hostname` (`TURNSTILE_EXPECTED_HOSTNAME`, optional).
    - `google` → `client_id`, `client_secret`, `redirect` (`GOOGLE_REDIRECT_URI`, default `${APP_URL}/auth/google/callback`), `confirm_redirect` (`GOOGLE_CONFIRM_REDIRECT_URI`).
    - `google_analytics` → `measurement_id` (`GOOGLE_ANALYTICS_ID`), `property_id` (`GA4_PROPERTY_ID`), `credentials` (`GOOGLE_ANALYTICS_CREDENTIALS`, a path outside the web root).
- [ ] `.env.example`: all keys, empty by default, with a comment that Cloudflare publishes always-pass test keys for local use. Do not commit real keys. Defaults: `TURNSTILE_ENABLED=false` locally and in `phpunit.xml`; `true` in production env.
- [ ] `HandleInertiaRequests::share()` adds a small public `integrations` prop: `turnstileSiteKey` (null when disabled), `googleEnabled` (client id and secret present), `analyticsId` (null when unset). No secrets.
- [ ] Tests: the prop is null/false when unconfigured and populated when configured.

**Done when:** pages can read `integrations.*` and nothing is exposed that is not meant to be public.

---

## 2. Bot check (Cloudflare Turnstile)

Flow: the form renders a Turnstile widget inside its `<form>`, Cloudflare injects a hidden `cf-turnstile-response` input, the server verifies the token before Fortify handles the request.

### T-01. Verifier action and rule (M, P0)

**Files:** `app/Actions/Security/VerifyTurnstileToken.php`, `app/Rules/TurnstileToken.php`, tests

Reference: `b2b-marketplace/app/Services/TurnstileVerifier.php`, `TurnstileResult.php`, `Rules/TurnstileRule.php`.

- [ ] `VerifyTurnstileToken::handle(string $token, ?string $ip): bool` posts `secret`, `response`, `remoteip` to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with `Http::asForm()->timeout(5)`. Returns `false` on empty token, non-2xx, `success: false`, timeout or exception (G-T1); logs a warning with the Cloudflare error codes, never the token or secret. When `expected_hostname` is configured, a mismatch returns `false`.
- [ ] `TurnstileToken` rule wraps it for any future form request, with the message "Please complete the security check."
- [ ] No test-only branches inside production code (b2b accepts a magic `valid-token` in `testing`; do **not** copy that). Tests use `Http::fake()`.
- [ ] Tests: success, `success:false`, HTTP 500, timeout, empty token, hostname mismatch, secret never logged.

### T-02. Middleware on auth routes (M, P0)

**Files:** `app/Http/Middleware/EnsureTurnstile.php`, `bootstrap/app.php`, tests

- [ ] On `POST` requests whose route name is in `services.turnstile.protected_routes`, when `turnstile.enabled`: verify the `cf-turnstile-response` input; on failure throw `ValidationException::withMessages(['cf-turnstile-response' => 'Please complete the security check.'])` so Inertia shows it as a field error.
- [ ] Register it in the `web` group (appended after session and CSRF middleware). Skipped entirely when disabled.
- [ ] Tests (Pest feature): login, register and forgot-password each reject a missing and an invalid token, accept a valid one, and are untouched when disabled; non-protected POSTs (for example `reports`) are unaffected; a failed check does not count a login attempt against another user.

### T-03. React widget component (M, P0)

**Files:** `resources/js/components/turnstile-widget.tsx`, `resources/js/pages/auth/{login,register,forgot-password}.tsx`

- [ ] `<TurnstileWidget />` reads `integrations.turnstileSiteKey` (renders nothing when null), loads `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit` once (idempotent loader), renders the widget **inside the form**, with `appearance: 'interaction-only'`, `size: 'flexible'` and the theme taken from the `.dark` class. Exposes `reset()` through a ref so forms can reset it after a server error.
- [ ] Show `errors['cf-turnstile-response']` through the existing `FormField` error style (`role="alert"`).
- [ ] Disable the submit button until a token exists; if the script has not produced a widget after about 10 seconds show "The security check could not load. Disable content blockers or try again." (fail-closed, G-T1).
- [ ] Reset the widget on any validation error and after expiry.
- [ ] Layout: the widget must not shift the form; reserve space only when the challenge is interactive. Check at sm (360), md (768), lg (1280), with keyboard focus order and dark mode.
- [ ] `<link rel="preconnect" href="https://challenges.cloudflare.com">` on the three pages via Inertia `<Head>`.

### T-04. Tests and e2e (M, P1)

- [ ] Pest: shared-prop test from T-00; middleware tests from T-02.
- [ ] Playwright (`specs/auth.spec.ts` or the existing auth spec; register in `scenarios.json`): with Cloudflare's always-pass **test** keys the widget loads and login, register and forgot-password succeed; with a tampered token (route-intercepted) each shows the error. Run on desktop-1280, tablet-768, mobile-360, iphone-safari, with an axe pass.
- [ ] Add `TURNSTILE_ENABLED=false` to the e2e environment so the other specs are unaffected (G-T3); document it in `tests/e2e/AGENTS.md`.

---

## 3. Google sign-in

### 3.1 Flow

`/auth/google` → Google → `/auth/google/callback` → resolve user (link or create) → suspension check → 2FA challenge if enabled → otherwise log in and use the existing `LoginResponse`.

### 3.2 Security rules (mandatory)

1. Accept the Google identity only if it has an ID and a **verified** email.
2. Match by `google_id` first, then by lower-cased email. A different `google_id` already on that email is an error.
3. Linking to an existing account whose own email was **unverified** clears its password and remember token and marks the email verified (H4).
4. Suspended users cannot sign in (same message as the password path).
5. A user with confirmed two-factor authentication goes to the two-factor challenge and is **not** logged in yet (H3).
6. Everything runs in a transaction with `lockForUpdate()` on the user rows; callbacks are rate limited (`throttle:10,1`); `state` handling stays with Socialite.
7. New Google accounts are normal buyers, email verified, password `null`; staff invitations for that email are accepted exactly as in registration (H6).

### T-10. Dependency and Google Cloud setup (S, P0)

- [ ] `composer require laravel/socialite`; commit the lockfile change.
- [ ] Document in the PR how to create the OAuth client (Google Cloud Console → Credentials → OAuth client ID, "Web application"), the **authorised redirect URIs** to register for local, staging and production (`…/auth/google/callback` and `…/auth/google/confirm/callback`), scopes `openid email profile`, and publishing the consent screen. Add the steps to `README`/`docs` next to the Turnstile and GA setup notes.

### T-11. Schema and model (S, P0)

**Files:** migration, `app/Models/User.php`

- [ ] Migration: `users.google_id` string nullable **unique**; `users.password` nullable (`->change()`). Forward-only.
- [ ] `User`: `@property string|null $google_id`; add `hasPassword(): bool`. Do **not** add `google_id` to `#[Fillable]`; set it with `forceFill` inside the action.
- [ ] Factory states `googleOnly()` (no password, `google_id` set).

### T-12. (P2) Human-pass cookie for guest write endpoints — parked

b2b's `/human-check` + 20-minute `human_pass` cookie protects guest Livewire forms. b2c has no such forms now. Revisit if guest-facing write endpoints appear (for example the share endpoint in plan 10): reuse `VerifyTurnstileToken` from T-01 behind a small `POST human-check` route and an encrypted cookie. Not scheduled.

### T-13. `AuthenticateWithGoogle` action (L, P0)

**Files:** `app/Actions/Auth/AuthenticateWithGoogle.php`, tests

Reference: `b2b-marketplace/app/Http/Controllers/Auth/GoogleAuthController.php` (`resolveUser`, `resolveName`).

- [ ] `handle(SocialiteUser $google): User` implements §3.2 rules 1–3, 6 and 7 inside `DB::transaction`. Name: Google `name` (b2c has a single `name` column); fall back to the email local part. Throws a small domain exception per failure (unverified email, id conflict) that the controller maps to messages.
- [ ] Staff invitation: when `staff_invitation_id` is in the session and matches the email, call `AcceptShopStaffInvitation` like `CreateNewUser` does and flash the same welcome message.
- [ ] Tests: new user created verified with null password; existing verified user linked; existing **unverified** user linked with password cleared and `remember_token` rotated; same `google_id` returns the user; email owned by another `google_id` fails; Google email not verified fails; invitation accepted on sign-up; case-insensitive email match; two concurrent callbacks create one user.

### T-14. Credentials guard (S, P0)

**Files:** `app/Providers/FortifyServiceProvider.php`

- [ ] In `authenticateUsing`, return `null` when `$user->password === null` (generic invalid-credentials result; no hint about Google, to avoid account enumeration). Keep the suspension check.
- [ ] Test: a Google-only account trying a password login gets the normal error, not a 500.

### T-15. Controllers, routes, 2FA handoff (M, P0)

**Files:** `app/Http/Controllers/Auth/GoogleSessionController.php`, `routes/web.php`, tests

- [ ] Guest routes: `GET auth/google` → `GoogleSessionController@create` (`auth.google.redirect`, redirects through Socialite), `GET auth/google/callback` → `@store` (`auth.google.callback`). Both `throttle:10,1`.
- [ ] `@store`: call the action; on a domain exception redirect to `login` with `errors.google`; suspended → same error text as password login; **2FA**: if `$user->hasEnabledTwoFactorAuthentication()` put `login.id` and `login.remember` in the session and redirect to `two-factor.login` (this mirrors Fortify's own redirect; **VERIFY** the keys against the installed Fortify version); otherwise `Auth::login($user, true)`, `session()->regenerate()`, return the existing `LoginResponse`.
- [ ] Tests: success for each workspace type (buyer, seller, admin) lands where `LoginResponse` sends them; 2FA user is not authenticated after the callback and is redirected to the challenge; suspended user rejected; Google error or cancelled consent returns to login with a friendly message; authenticated users are redirected away; throttle returns 429; Socialite faked with `Socialite::shouldReceive(...)`.

### T-16. Login and register UI (M, P1)

**Files:** `resources/js/pages/auth/{login,register}.tsx`, `resources/js/components/google-sign-in-button.tsx`

- [ ] `<GoogleSignInButton />` (outline `Button`, inline Google "G" SVG, text "Continue with Google"), a plain anchor to the Wayfinder `redirect()` URL (full-page navigation, not Inertia `Link`). Rendered only when `integrations.googleEnabled`, above the form with an "or" divider. Shows `errors.google` as an alert.
- [ ] Responsive at sm, md and lg (full-width, ≥ 44 px tall, no overflow); dark mode; keyboard and screen-reader label ("Continue with Google").
- [ ] Also place it on the staff-invitation register variant, where the email is pre-filled, with a hint that the Google account must use that email.

### T-17. Google re-authentication for password confirmation (M, P1, G-G3)

**Files:** `app/Http/Controllers/Auth/GoogleConfirmationController.php`, `resources/js/pages/auth/confirm-password.tsx`, routes, tests

Reference: `GoogleAuthController::confirmRedirect/confirmCallback` in b2b.

- [ ] Authenticated routes `auth/google/confirm` (`@create`) and `auth/google/confirm/callback` (`@store`): redirect with `prompt=login` and `login_hint`; on return require the **same** `google_id`, verified email, then `session()->passwordConfirmed()` and `redirect()->intended(...)`.
- [ ] `confirm-password.tsx` shows "Confirm with Google" instead of the password field when the account has no password and has a `google_id`.
- [ ] Tests: matching account confirms; a different Google account is rejected; password users are unaffected; 2FA setup works after confirmation.

### T-18. Set-password flow for Google-only users (S, P1, G-G3)

**Files:** `app/Http/Requests/Settings/PasswordUpdateRequest.php`, `resources/js/pages/settings/security.tsx`

- [ ] `current_password` is required **only** when the user has a password; otherwise the card reads "Set a password". `security.tsx` receives `hasPassword`.
- [ ] Check `ProfileDeleteRequest` and any other `current_password` use for the same assumption and fix them (account deletion for password-less users should use the Google confirmation from T-17).
- [ ] Tests: Google-only user can set a password without a current one; users with a password still need it; setting a password does not log the user out.

### T-19. Tests and e2e (M, P1)

- [ ] Pest suites from T-13 to T-18 (`tests/Feature/Auth/GoogleSignInTest.php`).
- [ ] Playwright: the button appears when configured; clicking it navigates to `accounts.google.com` (intercept the request, do not call Google); a simulated callback error (`?error=access_denied`) shows the message; sm/md/lg + `iphone-safari`; axe. Full OAuth is covered by Pest with Socialite faked.

### T-20. (P2) Google status and unlink in settings (S)

- [ ] Security page shows "Google connected"; **Unlink** is available only when the account has a password (G-G4). Audit-log the link and unlink events with `RecordAuditLog`.

---

## 4. Analytics (GA4)

### 4.1 Approach

Nothing loads until the visitor accepts. After acceptance the client injects `gtag.js` for `GOOGLE_ANALYTICS_ID`, sends page views itself from Inertia navigations (H7), and sends a small, PII-free event set (G-C3). Admin, seller, auth and token URLs are never reported (G-C2, H9).

### T-21. Privacy page (M, P0, G-C1)

- [ ] A public **Privacy Policy** page (route, Inertia page, footer link) covering what is collected, GA and Turnstile (Cloudflare), Google sign-in, retention and contact. **Content must be written or approved by the business/DPO**; engineering provides the page and a placeholder draft only.

### T-22. Consent state and banner (M, P0)

**Files:** `resources/js/hooks/use-analytics-consent.ts`, `resources/js/components/cookie-notice.tsx`, `resources/js/app.tsx` or the public layouts

- [ ] Consent stored in `localStorage` (`analytics_consent` = `granted` | `denied`), read in a hook that is safe when storage is blocked (try/catch, default "unknown").
- [ ] Banner shown to buyer and public pages until a choice is made: short text, link to the privacy page, **Accept** and **Decline** buttons with equal prominence. Not shown in admin or seller workspaces. Fixed to the bottom, must not cover primary actions on 360 px screens, keyboard reachable, `role="region"` with a label, no focus trap.
- [ ] A way to change the choice later (footer link "Cookie settings").
- [ ] Tests (e2e): banner appears on first visit; choice persists; Decline sends nothing; Accept starts tracking; works on all four projects.

### T-23. Analytics loader and page views (M, P0)

**Files:** `resources/js/lib/analytics.ts`, `resources/js/app.tsx`

- [ ] `initAnalytics(measurementId)` runs only when an id exists **and** consent is granted: appends the `https://www.googletagmanager.com/gtag/js?id=…` script once, sets `window.dataLayer`/`gtag`, calls `gtag('config', id, { send_page_view: false, anonymize_ip: true })` (GA4 truncates IPs anyway; keep the flag harmless).
- [ ] `router.on('navigate', …)` (Inertia) sends `page_view` with `page_location` (origin + redacted path, **no query string**), `page_path` and `page_title`; also sends the first view after consent is granted.
- [ ] `redactPath()` maps token-bearing and internal routes: `/reset-password/*`, `/staff-invitations/*`, `/email/verify/*`, `/two-factor-challenge`, `/login`, `/register`, `/forgot-password` are **not sent**; `/admin/*` and `/seller/*` are not sent; everything else is sent without query parameters.
- [ ] Respect Do-Not-Track and Global Privacy Control signals as "denied" (G-C1 may relax this).
- [ ] Tests (e2e with request interception on `googletagmanager.com` and `google-analytics.com/g/collect`): no request before consent; requests after Accept; none after Decline; none from `/admin` or `/seller`; the reset-password page and `?email=` query never appear in any collected URL.

### T-24. Event helpers (M, P1, G-C3)

- [ ] `track(name, params)` no-op unless consent is granted. Wire: `sign_up` and `login` (`method: 'password' | 'google'`, from an Inertia flash flag set by `LoginResponse`/`RegisterResponse` and the Google callback, never from user data), `view_item` (product page), `add_to_cart`, `begin_checkout`, `purchase` (order confirmation, order id hashed or omitted, amounts in pesos from centavos). Parameters carry only product ids, names, categories and values; never emails, names, user ids or addresses.
- [ ] Tests: each event fires once at the right moment (e2e with intercepted collect calls); none carries personal data (assert on the request payload).

### T-25. Tests, docs and release (S, P1)

- [ ] `tests/Feature` for the shared prop and the privacy route; e2e as above; `npm run check`, `npm run types:check`, `composer lint`, PHPStan.
- [ ] Release note: create the GA4 property and web data stream, set `GOOGLE_ANALYTICS_ID`, publish the privacy page **before** enabling the id in production, verify in GA4 DebugView.

### T-30. (P2) Admin traffic overview from the GA Data API (M)

Reference: `b2b-marketplace/app/Services/GoogleAnalyticsService.php`, `tests/Feature/AdminAnalyticsDashboardTest.php`.

- [ ] `composer require google/analytics-data`; `App\Actions\Admin\GetTrafficOverview::handle(string $from, string $to): ?array` (active users, sessions, page views, bounce rate, average session duration) using a service account (`GOOGLE_ANALYTICS_CREDENTIALS` path, `GA4_PROPERTY_ID`). Returns `null` when unconfigured or on any API error (reported, never thrown).
- [ ] Cache 15 minutes; add a "Traffic" card to `admin/dashboard.tsx` that renders only when data exists. Credentials file stays out of git. Tests with a faked client; unconfigured and error cases return `null` and the card is hidden.

---

## 5. Order of work and rollout

| Step | Tasks             | Notes                                                                                                                                                                         |
| ---- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | T-00              | Everything else reads these props and keys.                                                                                                                                   |
| 2    | T-01 → T-04       | Turnstile is independent and protects the endpoints that Google sign-in will not replace (password login and register).                                                       |
| 3    | T-10, T-11, T-14  | Do T-14 together with T-11: once `password` is nullable, the credentials guard must already be in place.                                                                      |
| 4    | T-13, T-15 → T-19 | T-17/T-18 can follow in a second PR if needed, but **do not enable Google sign-in in production before them** or Google-only users cannot enable 2FA or delete their account. |
| 5    | T-21 → T-25       | Privacy page and consent before any production GA id is set.                                                                                                                  |
| 6    | T-20, T-30, T-12  | Optional.                                                                                                                                                                     |

Rollout and rollback are per feature and configuration-only: Turnstile off with `TURNSTILE_ENABLED=false`, Google hidden by leaving the client id empty, analytics off by leaving `GOOGLE_ANALYTICS_ID` empty. The migration in T-11 is additive (nullable columns) and safe to deploy first.

## 6. Risks

| Risk                                                                             | Mitigation                                                                                                                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Turnstile blocks real users (blockers, corporate proxies, Cloudflare outage)     | Clear fail-closed message, "interaction-only" widget so most users see nothing, monitor failed-check rate after launch; fail-open is a deliberate later decision (G-T1). |
| Google sign-in bypasses 2FA or suspension                                        | Explicit rules 4–5 and tests (T-15).                                                                                                                                     |
| Account takeover via pre-registered unverified email                             | Rule 3 / H4 and its test.                                                                                                                                                |
| Google-only users locked out of 2FA, passkeys or deletion                        | T-17 and T-18 are release blockers for Google sign-in.                                                                                                                   |
| Reset or invitation tokens leaking to Google Analytics                           | Path redaction, no query strings, e2e assertions (T-23).                                                                                                                 |
| Tracking before consent or without a privacy page (Philippines Data Privacy Act) | Default-off consent, privacy page first, DPO review (G-C1). This is an engineering plan, not legal advice.                                                               |
| Missing redirect URI breaks Google login per environment                         | Setup checklist in T-10 lists both callback URIs for every environment.                                                                                                  |
| The reference doc was not available                                              | Behaviour was read from b2b's code; confirm against the doc and adjust (header note).                                                                                    |
