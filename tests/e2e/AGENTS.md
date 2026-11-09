# E2E pipeline — agent playbook

This directory contains a self-contained Playwright e2e suite with a
screenshot pipeline, designed to be executed by AI agents or CI.
Nothing here touches the app's own dependencies — `tests/e2e` has its
own `package.json`.

## Layout

- `playwright.config.ts` — 4 projects: `desktop-1280`, `tablet-768`, `mobile-360` (Chromium viewports) and `iphone-safari` (real WebKit engine, iPhone UA + touch).
- `specs/` — test specs. `smoke.spec.ts` covers public pages + auth boundaries.
- `scenarios.json` — machine-readable scenario manifest; read this first when
  extending coverage or executing steps manually.
- `helpers.ts` — `shot(page, name)` writes named full-page screenshots to
  `output/screenshots/<project>/<name>.png`; `uniqueEmail()` for registrations;
  `createVerifiedUser(email)` seeds a verified fixture user through
  `vendor/bin/sail artisan` (needed because `verified` routes like
  `/seller/register` block UI-registered accounts).
- `output/` — gitignored run artifacts (screenshots, traces, HTML report, results.json).

## Running

Prereq: Docker running for Laravel Sail. From the repo root:

```bash
scripts/e2e-run.sh --setup --build   # first run: installs Playwright + builds assets
scripts/e2e-run.sh                   # subsequent runs
scripts/e2e-run.sh --project mobile-360 --spec specs/smoke.spec.ts
```

Env vars:

- `E2E_BASE_URL` — target app (default `http://localhost`, i.e. Sail port 80).
- `E2E_OUTPUT_DIR` — override artifact dir (the runner sets a per-run timestamped dir).

## Agent instructions

1. Verify the app responds: `curl -sf http://localhost` (run `vendor/bin/sail up -d` first if not).
2. Ensure assets exist: `public/hot` (Vite dev) or `public/build` (built). Otherwise run `vendor/bin/sail npm run build`.
3. Run `scripts/e2e-run.sh` (add `--setup` once if `node_modules` is missing here).
4. Report: list pass/fail per project from `output/*/results.json`, attach
   screenshots from `output/*/screenshots/<project>/`, and note any traces in
   `output/*/artifacts/` for failed tests.
5. New scenarios: prefer stable selectors (`input[name=...]`, `[data-test=...]`),
   always call `shot()` at meaningful steps, use `uniqueEmail()` for writes, and
   add the scenario to `scenarios.json`.

## Notes

- Newly registered users may land on `/email/verify` (Fortify `verified`
  middleware guards `/dashboard`); the spec accepts both.
- Registrations create real users in the dev database via unique emails — do not
  point `E2E_BASE_URL` at a production or shared environment.
- Runs are serial (`workers: 1`) because scenarios write to one database.

## Wave 3

Planned specs and route additions are listed in `docs/planning/07-wave-3-implementation-tasks.md` §4. Keep `scenarios.json` and `specs/accessibility.spec.ts` in sync with every new route.
