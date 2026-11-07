# Order tracking

## Flow

Orders list → status tabs (All / To Pay / To Ship / To Receive / Completed / Cancelled / Return-Refund) → `orderCard` with a tracking note link → order detail.

## Order detail anatomy

1. Order ID (tabular) + status `badge`.
2. Current-status `banner` ("Out for delivery — arriving today before 9 PM") — always the freshest event, not a summary.
3. `timeline` (Order tracking): newest first, `aria-current="step"` on the active step, sr-only "Completed:"/"Current:" prefixes, `<time>` for every timestamp.
4. Address card, items, payment details, action row (Order received / Contact seller / Return-refund).

## Rules

- Status names come from a single enum in the port (`ToPay`, `ToShip`, …) — never free text, and never colour without a text badge.
- Courier events render as data, not styled prose: title + time + optional location detail.
- Cancelled/refunded orders reuse the same pane; the banner switches to the matching tone (neutral/danger).

Components: `tabs`, `orderCard`, `badge`, `banner`, `timeline`, `addressCard`, `orderSummary`.
Reference: `screens/orders.html`, `screens/order-detail.html`.
