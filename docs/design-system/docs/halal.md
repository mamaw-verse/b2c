# Halal tailoring

How the design system supports a halal-only marketplace. Everything here is visual and structural. Certification rules themselves belong in the product and legal docs, not in this package.

## Principles

1. **A halal claim is a verified status, not seller copy.** The badge only renders `certified` after the platform has checked a certificate. Sellers never get a badge by typing "halal" in a title.
2. **The mark never changes with the brand.** `--halal`, `--halal-soft` and `--halal-hover` live outside the brand files so every white-label deployment shows the same trust colours. Contrast is measured in `docs/contrast.md`.
3. **Say what was checked.** Certifier, certificate number, expiry and scope are always visible on product detail (`HalalCertificateCard`, `HalalFacts`).
4. **Status is never colour alone.** Each status has its own icon and label.
5. **Non-food is "Muslim-friendly", not "halal".** Hijab, prayer mats and books need no certificate; they get a neutral badge on detail pages and none on cards.
6. **No interest-bearing payment UI.** The payment picker offers e-wallet, card (pay in full), online banking and COD. Do not add instalment or buy-now-pay-later patterns without sign-off.

## Status vocabulary

| Status | Who sees it | Meaning | Listing visibility |
|---|---|---|---|
| `certified` | Everyone | Certificate verified and valid today | Visible |
| `review` | Seller, admin | Certificate uploaded, not yet checked | Hidden from buyers |
| `expiring` | Seller, admin | Expires within the configured window (default 30 days) | Visible, seller warned |
| `expired` | Seller, admin | Past the valid-until date | Hidden from the day after expiry |
| `missing` | Admin | Halal claim with no certificate | Flagged |
| `na` | Everyone (detail page) | Non-food, Muslim-friendly | Visible |

## Where it appears

| Surface | Component | Notes |
|---|---|---|
| Product card (grid) | `HalalBadge` solid, `short`, top-left of photo | Sale badge stays top-right |
| Product card (list), cart, order lines | `HalalBadge` soft, `short` | Certifier is read by screen readers |
| Product detail | `HalalFacts` under the rating, `HalalCertificateCard` + seller declaration in a "Halal certification" section | Facts link down to the card |
| Cart / product | "Ships frozen" line and `coldChainNote` | Only for frozen meat and similar |
| Checkout summary | Halal confirmation line in `OrderSummary` | `orderSummary({ halal: true })` |
| Shop header | "Halal-only shop" badge | |
| Search / category | "Halal certified" filter chip (pressed by default) | Default on in a halal-only marketplace; keep as a visible, removable chip |
| Seller product form | "Halal information" section | Status, certifier, number, expiry, file, ingredients, declaration |
| Seller dashboard | Expiry warning banner | Names the number of listings at risk |
| Admin queue | `Halal check` item type, checklist in the detail pane, halal reason templates | |

## Moderation checks

`HalalVerificationChecklist` makes every decision defensible in the audit log:

1. Certifier is on the current accredited list.
2. Certificate number matches the certifier's registry.
3. Certificate is valid today.
4. Certificate covers this product.
5. Ingredients contain no pork, alcohol or their derivatives.

"Needs a manual check" never auto-approves.

Suggested auto-flag rules (configurable, per PRD §6.3): keywords such as pork, lard, bacon, ham, wine, liquor, gelatin (unspecified source) on listings that claim halal; "halal" in a title with no certificate attached; certificates expiring in 30 / 7 / 0 days; logo misuse reports.

## Before launch

- Replace the sample certifier names (IDCP, HDIP, MinHA) and certificate numbers with the current accredited list. In the Philippines, accreditation of halal certifying bodies sits with the National Commission on Muslim Filipinos (NCMF); verify the current list with them. Recent NCMF advisories have flagged products carrying "halal" labels from non-accredited certifiers, which is why check 1 above exists.
- Confirm certificate validity periods and display rules for certificate numbers with your legal advisor.
- Have a qualified person from your community review the copy, categories and imagery.
- Imagery: the decorative lattice (`.pattern-geo`) is a neutral geometric pattern, not religious iconography. Do not use the crescent as decoration; it is reserved for the status icon.
