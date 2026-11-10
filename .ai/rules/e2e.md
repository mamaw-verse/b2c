---
paths:
    - 'tests/e2e/**'
---

# E2E

## tests/e2e contains live Playwright specs; docs/planning/ui-audit is read-only history

The `tests/e2e/` directory contains live Playwright specs that run via `scripts/e2e-run.sh`. Update these specs when changing URLs, selectors, or user flows. Run with `scripts/e2e-run.sh --project desktop-1280 --spec specs/<file>` to verify a single spec. The `docs/planning/ui-audit/` markdown files are archived planning artifacts (AI-generated audit reports and task lists) — never edit them as part of implementing a change; they are read-only historical records.

## Coverage plan — read before writing or auditing specs

`docs/planning/08-e2e-coverage-plan.md` is the authoritative record of what is and is not covered. Before writing a new spec or extending an existing one:

1. Read §2 of that document to understand gap severity and avoid duplicate work.
2. Follow the implementation plan in §3 (selectors, screenshot names, serial flow).
3. Register the spec in `tests/e2e/scenarios.json` (see §4).
4. Tick the matching row in the §5 progress tracker once the spec passes on all four projects.

**Do not start writing specs from scratch.** The plan already captures the right selectors and flows derived from reading the React pages directly. Deviating without a documented reason wastes work.

## When a gap is closed

- Tick the row in `docs/planning/08-e2e-coverage-plan.md` §5.
- Add any new routes to `accessibility.spec.ts`.
- Run on all four projects (`desktop-1280 tablet-768 mobile-360 iphone-safari`) before marking done.
