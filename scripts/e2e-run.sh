#!/usr/bin/env bash
#
# e2e-run.sh — orchestrate the Playwright e2e + screenshot pipeline.
#
# Usage:
#   scripts/e2e-run.sh [--setup] [--build] [--spec <file>] [--project <name>]
#
#   --setup     Install Playwright deps + Chromium inside tests/e2e (first run).
#   --build     Build frontend assets before running (needed unless `npm run dev`
#               / the Vite dev server is already running).
#   --spec      Run a single spec, e.g. --spec specs/smoke.spec.ts
#   --project   Run a single viewport project (desktop-1280|tablet-768|mobile-360)
#
# Output lands in tests/e2e/output/<run-id>/:
#   screenshots/<project>/*.png   named step screenshots
#   artifacts/                    failure screenshots, traces
#   report/                       Playwright HTML report
#   results.json                  machine-readable results
#
set -euo pipefail
cd "$(dirname "$0")/.."

E2E_DIR="tests/e2e"
RUN_ID="$(date +%Y%m%d-%H%M%S)"
OUTPUT_DIR="output/${RUN_ID}"
SETUP=0
BUILD=0
EXTRA_ARGS=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        --setup)   SETUP=1; shift ;;
        --build)   BUILD=1; shift ;;
        --spec)    EXTRA_ARGS+=("$2"); shift 2 ;;
        --project) EXTRA_ARGS+=(--project "$2"); shift 2 ;;
        *)         EXTRA_ARGS+=("$1"); shift ;;
    esac
done

if [[ $SETUP -eq 1 || ! -d "$E2E_DIR/node_modules/@playwright/test" ]]; then
    echo "==> Installing Playwright in $E2E_DIR"
    (cd "$E2E_DIR" && npm install && npx playwright install --with-deps chromium)
fi

echo "==> Ensuring Sail is up"
vendor/bin/sail up -d

echo "==> Waiting for the app"
for i in $(seq 1 30); do
    curl -fsS -o /dev/null "http://localhost:${APP_PORT:-80}" && break || sleep 2
done

if [[ $BUILD -eq 1 || ( ! -f public/hot && ! -d public/build ) ]]; then
    echo "==> Building frontend assets"
    vendor/bin/sail npm run build
fi

echo "==> Running e2e suite (run: $RUN_ID)"
mkdir -p "$E2E_DIR/$OUTPUT_DIR"
(cd "$E2E_DIR" && E2E_OUTPUT_DIR="$OUTPUT_DIR" npx playwright test ${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"}) || true

echo ""
echo "Done. Results in $E2E_DIR/$OUTPUT_DIR"
echo "  screenshots: $E2E_DIR/$OUTPUT_DIR/screenshots"
echo "  report:      (cd $E2E_DIR && npx playwright show-report $OUTPUT_DIR/report)"
