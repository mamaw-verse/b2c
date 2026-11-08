---
paths:
  - 'tests/e2e/**'
---

# E2E

## tests/e2e contains live Playwright specs; docs/planning/ui-audit is read-only history
The `tests/e2e/` directory contains live Playwright specs that run via `scripts/e2e-run.sh`. Update these specs when changing URLs, selectors, or user flows. Run with `scripts/e2e-run.sh --project desktop-1280 --spec specs/<file>` to verify a single spec. The `docs/planning/ui-audit/` markdown files are archived planning artifacts (AI-generated audit reports and task lists) — never edit them as part of implementing a change; they are read-only historical records.
