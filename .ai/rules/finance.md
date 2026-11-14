---
paths:
    - 'app/Actions/Finance/**'
    - 'app/Actions/Seller/**'
    - 'app/Actions/Order/**'
    - 'app/Actions/Cart/PlaceOrder.php'
    - 'app/Models/Order*.php'
    - 'app/Models/Ledger*.php'
    - 'app/Models/Payout.php'
    - 'app/Models/Fulfillment*.php'
---

# Orders, fulfillment and finance

- All money is integer centavos (`App\Support\Money`). Never introduce float/decimal money columns or arithmetic.
- Order status transitions go through Actions that also write an `OrderEvent`; controllers never set `orders.status`.
- Commission is snapshotted per `order_items` row at `PlaceOrder`; never recompute it from the current category rate afterwards.
- Ledger entries are append-only and idempotent (unique `order_id` + `type`). Corrections are new `adjustment`/`refund` entries, never updates or deletes.
- Credit the seller ledger only from the shared `CompleteOrder` action, so buyer confirmation and the auto-complete job cannot diverge.
- Fulfillment state (`orders.fulfillment_status`, `fulfillments`) is separate from the buyer-facing `orders.status`; see `docs/planning/07-wave-3-implementation-tasks.md` W3-10.
- Authorization (seller owns shop, admin only for payouts) lives in the endpoint's form request, using `Response::denyAsNotFound()`.

## Payables and manual payouts (facilitator model)

- Platform model: The platform is a payment facilitator, not merchant of record. Customer payments sit in the payment processor account (escrow-like).
- Three payable obligations:
    1. Sellers: Net balance in ledger entries (sales proceeds - platform commission - affiliate commission - refunds ± adjustments - requested/paid payouts), split into available (`available_at <= now()`) and held. Negative balances represent money owed by the seller to the platform.
    2. Customers: Approved returns/refunds (`order_refunds`) that have not yet been marked processed (`processed_at IS NULL`).
    3. Affiliates: Accrued, non-cancelled `affiliate_earnings` net of reversals. Payouts are parked (read-only figure).
- Manual processing: All seller payouts and customer refunds are processed manually out-of-band by admins. The admin updates the record with a required payment reference, recording an audit log, order event, and customer notification.
- Refund processed state: `order_refunds` tracks `processed_at`, `processed_by` (admin user FK), and `reference`.
- Open decision (G-P2): Whether platform commission is retained or reversed on customer refunds remains open; current implementation keeps platform commission and reverses affiliate commission.
