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
