# Assumptions & Open Questions

Running log. **DECIDED** = settled by owner; **PROPOSED** = recommended default, changeable; **OPEN** = needs an answer before the linked work.

## Assumptions (PROPOSED — built on unless corrected)

| #   | Assumption                                                                                                                                                                 | Basis / impact if wrong                                                                                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| A1  | MVP checkout places orders **without payment collection** — no gateway, no COD. Orders sit in `to_pay`/`pending`; the entire payment layer lands post-MVP (owner decision) | Schema already accommodates payments; if unpaid fulfillment needs gating earlier, payment milestone pulls forward |
| A2  | Marketplace config defaults: `first_listings_pending=3`, `return_window=7d`, `auto_confirm=7d`, `commission=5%`, `autohide=3`, `chat_context=5`                            | Tunable via `settings`; wrong defaults only need config changes, no migration                                     |
| A3  | Seller **Customers** page is in **v1** (owner decision) — added to M3 scope                                                                                                | If descoped later, saves ~2–3 dev-days in M3                                                                      |
| A4  | One shop per seller (D4); multi-shop is a schema change, not config                                                                                                        | If multi-shop needed, `shops.user_id` unique constraint comes out early                                           |
| A5  | PH addresses: free-text in MVP; structured region/province/city dataset is v2                                                                                              | If checkout needs validated addresses, M2 grows                                                                   |
| A6  | Seller sets flat shipping fee per order/shop in MVP                                                                                                                        | If per-item or weight-based needed, `orders.shipping_fee` model changes                                           |
| A7  | Vouchers MVP = shop-level fixed/percent codes only; platform-wide + free-shipping vouchers are v2                                                                          | Broader scope adds rules engine work to M6                                                                        |
| A8  | PWA = manifest + install basics in MVP; offline/service-worker depth is v2                                                                                                 | If offline is required, M7 grows                                                                                  |
| A9  | Email notifications via existing Mailpit/SMTP; push (FCM/APNs) only matters when native app exists                                                                         | If web push needed in MVP, add a push package + subscription table                                                |

## Open questions (OPEN)

| #   | Question                                                                                                                                                                                                                                  | Needed by                               | Recommended default                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------- |
| Q1  | Which payment gateway + payment-method set when the payment layer is built? Owner still deciding — **leave open**                                                                                                                         | Post-MVP                                | Revisit when payments are scheduled; Phase 3 comparison stands (Xendit vs PayMongo) |
| Q5  | Refund method once payments exist — manual payout adjustment, gateway refund, store credit?                                                                                                                                               | Post-MVP                                | Open with Q1 — depends on the gateway/payment methods chosen                        |
| Q7  | Affiliate premise (G-A0): does an affiliate program already run elsewhere? If yes, the built foundation (profiles, referral cookie, earnings) may duplicate or conflict and must be removed or re-pointed.                                | Before un-parking affiliate (`09` §5.0) | Assume "no" (program parked); confirm before any affiliate work resumes             |
| Q8  | Affiliate commission bounds (G-A2): sign off 5% default, 1% min, 30% max — currently placeholders.                                                                                                                                        | Before un-parking affiliate (`09` §5.0) | Keep the placeholders until the business signs off                                  |
| Q9  | Affiliate payout rules: minimum amount, hold period (reuse seller `payouts.hold_days` or separate), payout method, who may become an affiliate (any verified user vs approval step), identity/tax requirements for a payment facilitator. | Before un-parking affiliate (`09` §5.0) | No affiliate payouts while parked; decide all five together                         |
| Q10 | Commission on refunded items (G-P2): platform commission is kept on refunds while affiliate commission is returned to the seller. Should both be reversed, both kept, or the current split kept?                                          | Before un-parking affiliate (`09` §5.0) | Confirm the current split or reverse both; changes ledger amounts only (P-02)       |
| Q11 | Affiliate attribution policy: last-click within 30 days is current behaviour — confirm, including self-referral and shop-staff exclusions (already enforced).                                                                             | Before un-parking affiliate (`09` §5.0) | Keep last-click 30 days with the existing self-referral/staff exclusions            |
| Q12 | Affiliate terms and disclosure: affiliate terms of service and buyer-facing disclosure.                                                                                                                                                   | Before un-parking affiliate (`09` §5.0) | Draft ToS + buyer disclosure before launch                                          |

## Resolved this phase

- **D20 payments:** payment integration **deferred** (owner) — no gateway SDK, no COD handling in MVP. Orders are placed unpaid (`to_pay`); `PaymentGateway` contract + `NullPaymentGateway` + `payments`/`payment_webhooks`/`payout_ledger` schema retained so it slots in later. Gateway choice stays **OPEN** (Q1).
- **Q2 AI tools:** configure **Kiro, Antigravity, and OpenCode** (Codex already done) — folded into M0 foundation.
- **Q3 commission:** **category-level override only** for now; per-shop override deferred (no `shops.commission_pct` column).
- **Q4 guest cart:** **login required to add to cart** — no guest/session cart, no merge-on-login.
- **Q6 cancellation:** yes — buyer can cancel while order is `to_pay`/`to_ship`.
- **A3 seller Customers:** moved to **v1** (owner), added to M3.
- **D27 search:** Scout + Typesense, DB fallback behind the same repository method.
- **D38 tokens:** port `tokens.css`/`tokens.json` + Manrope into `resources/css`/`resources/js/lib`; no external build system copied.
- **Q1 (inertia.php):** `.vue` extension cleanup folded into roadmap T4.
