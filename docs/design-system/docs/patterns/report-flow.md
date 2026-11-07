# Report flow (buyer side)

Flag → reason → confirm → thank-you. Deliberately low-friction but never one-tap.

## Steps

1. **Entry points** — flag icon on product detail ("Report"), review cards ("Report review"), chat header menu, order overflow. Always an icon + accessible label, never icon-only-without-label.
2. **Reason picker** (`reportDialog` / ReasonPicker): template radios ("Counterfeit", "Off-platform payment", "Harassment"…) + optional details field. One is always required — the form cannot submit empty.
3. **Confirm** — danger-confirm `ConfirmDialog` for destructive reports (user/shop) — standard submit for content reports.
4. **Receipt** — Toast "Report received. Our team reviews within 24 hours." The item is not hidden from the reporter's view optimistically.

## Rules

- Reports are append-only; the UI never shows outcomes to the reporter ("We'll review", not verdicts).
- Attach context automatically (product ID, order ID, last N chat lines) — the reporter never pastes screenshots manually in the flow.
- Rate-limit copy is the inline kind (banner), not a toast (see [toast vs inline](toast-vs-inline.md)).

Components: `reportDialog`/`reasonPicker`, `confirmDialog`, `toast`, `iconBtn`.
Related: [moderation review flow](moderation-flow.md).
