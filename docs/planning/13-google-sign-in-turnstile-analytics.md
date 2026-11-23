# Google Sign-In, Bot Checking, and Analytics

Implementation notes for b2c (Laravel 13, Inertia + React, Fortify). Ported from `b2b-marketplace` and adapted: no Blade/Livewire, `users.name` (single field), Wayfinder-based routes elsewhere.

## Setup after pulling

```bash
composer update laravel/socialite google/analytics-data   # composer.lock was not regenerated
php artisan migrate
npm install && npm run build
```

### Environment variables

| Var | Purpose |
|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | Google OAuth. Redirect URI must be `${APP_URL}/auth/google/callback` and `${APP_URL}/auth/google/confirm/callback` in the Google Cloud console. |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile. Outside production, Cloudflare's always-pass dummy keys are used by default. **Required in production** or logins/registrations fail. |
| `HUMANCHECK_ENABLED` | Kill switch (default `true`). `phpunit.xml` sets it `false`. |
| `HUMANCHECK_TTL` / `HUMANCHECK_BIND_IP` | Human-pass cookie lifetime (s, default 1200) / bind to IP. |
| `TURNSTILE_EXPECTED_HOSTNAME` / `TURNSTILE_EXPECTED_ACTION` | Optional siteverify hostname/action enforcement. |
| `GOOGLE_ANALYTICS_ID` | GA4 measurement ID (`G-…`) for the gtag snippet. |
| `GA4_PROPERTY_ID` / `GOOGLE_ANALYTICS_CREDENTIALS` | GA4 Data API property ID and path to a service-account JSON key (admin dashboard). |

## 1. Google Sign-In

- Routes (`routes/web.php`): `auth/google` + `auth/google/callback` (guest, throttle 6/min); `auth/google/confirm` + `auth/google/confirm/callback` (auth, throttle 6/min).
- `App\Http\Controllers\Auth\GoogleAuthController`:
  - Requires a Google ID and `verified_email === true`.
  - Looks up by `google_id`, then by email (links `google_id` to the existing account; rejects if the email is already tied to a different Google ID); otherwise creates a verified user with null password. All inside a transaction with row locks.
  - Suspended users are refused. Success: `Auth::login($user, true)`, session regenerate, `redirect()->intended(route('dashboard'))`. Errors go to `login` under the `google` error key.
  - Confirm flow: re-runs OAuth with `login_hint` and `prompt=login`, requires the same `google_id`, then `session()->passwordConfirmed()`.
- Migration `2026_11_20_000100_...`: adds unique nullable `users.google_id`, makes `users.password` nullable. `google_id` is hidden from serialization; `User::hasPassword()` / `hasGoogleIdentity()` added.
- Fortify: password login rejects accounts with no password; confirm-password view receives `hasGoogleIdentity`.
- Security settings: Google-only users set a password without "current password" (`PasswordUpdateRequest`). Account deletion still requires a password.
- UI: `components/google-auth-button.tsx` on login, register (hidden for staff invitations) and confirm-password.

## 2. Bot checking (Cloudflare Turnstile)

- `components/turnstile-field.tsx` renders an invisible (`interaction-only`) widget and fills hidden `cf-turnstile-response`. Forms call `resetTurnstile` in `onFinish` (tokens are single-use). Site key is shared via the `turnstileSiteKey` Inertia prop (null when disabled).
- Enforced server-side on login (`Requests\Auth\LoginRequest`), password reset link (`PasswordResetLinkRequest`), both bound over Fortify's request classes in `FortifyServiceProvider`, and registration (`CreateNewUser`). Rule: `App\Rules\TurnstileRule::rules()` (required + verified when enabled, `nullable` when disabled).
- `App\Services\TurnstileVerifier` (siteverify, 5s timeout, fails closed, hostname/action checks; in `testing` accepts `valid-token` unless `Http::fake()` is active) and `TurnstileResult`.
- Human pass: `POST /human-check` (throttle 20/min) issues an encrypted `human_pass` cookie (`App\Support\HumanPass`, excluded from Laravel cookie encryption). `human` middleware alias (`EnsureHumanPass`) returns 403 `HUMAN_CHECK_REQUIRED` for JSON/Inertia requests. **Currently attached to no routes**; `lib/turnstile.ts` has `issueHumanPass()` for future public forms.

## 3. Analytics

- **GA4 gtag**: injected in `resources/views/app.blade.php` when `GOOGLE_ANALYTICS_ID` is set, on public pages only (excluded: `admin/*`, `seller/*`, `settings/*`, login/register/password/2FA/email/`user/*`/`auth/*`). SPA navigations rely on GA4 enhanced measurement (history changes). No consent banner.
- **GA4 Data API**: `App\Services\GoogleAnalyticsService::getOverview()` (active users, sessions, page views, bounce rate, avg session duration). `Admin\DashboardController` passes `analyticsConfigured` and a deferred `analytics` prop; `pages/admin/dashboard.tsx` shows a "Site traffic (last 30 days)" section.

## Tests

- `tests/Feature/Auth/GoogleAuthenticationTest.php`
- `tests/Feature/Auth/TurnstileTest.php`
- `tests/Feature/GoogleAnalyticsTest.php`

Run: `php artisan test --filter="Google|Turnstile"` then the full suite. Not executed when written (no PHP available), so expect to fix small issues.

## Manual test checklist

1. Login/register/forgot-password: widget loads, submit works; with a bad/absent token the form shows a security-check error.
2. "Continue with Google": new user created and signed in; existing email gets linked; second Google account on same email is rejected.
3. Google-only user: password login fails; can set a password in Settings → Security without a current password.
4. Confirm-password screen shows "Confirm with Google" only for linked users.
5. Home page source contains gtag (with `GOOGLE_ANALYTICS_ID`); login/admin pages do not.
6. Admin dashboard shows traffic stats once GA4 credentials are set; otherwise the section is hidden.
