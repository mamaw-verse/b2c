# Cart → checkout

## Cart

- Items grouped by shop (`cartShopGroup`): shop select-all, item checkboxes, per-shop voucher row, chat link.
- Unavailable items stay visible with a reason ("Out of stock — remove to checkout") and are excluded from the total; they never silently disappear.
- Sticky bar: select-all + running total + Checkout. Above the bottom tab bar on phone (`bottom: tabbar-h + safe-area`); on desktop the bar is sticky inside the column and a summary card shows in the right rail.
- Quantity is `QuantityStepper` (48px buttons, live "quantity N" announcement); totals update optimistically.

## Checkout (one page, never a wizard on phone)

Section order: delivery address → items per shop → shipping option → vouchers → payment method → payment details. Sticky "Place order" bar (total + button) on phone; right-rail summary with the same button on desktop.

- Changing address/shipping/voucher re-computes `orderSummary` — the sticky bar total is always the source of truth.
- Payment method is a required radio group; missing choice → fieldset error + focus.
- "Place order" is the only primary action; it shows `aria-busy` while submitting and must not double-submit.

Reference: `screens/cart.html`, `screens/checkout.html`. Components: `cartShopGroup`, `cartItem`, `stepper`, `addressCard`, `shippingOptionPicker`, `voucherPicker`, `paymentMethodPicker`, `orderSummary`.
