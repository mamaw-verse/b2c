# Halal pass: fixes and improvements

## Bugs fixed

| # | Where | Problem | Fix |
|---|---|---|---|
| 1 | All rendered pages | Raw `{{BRAND_NAME}}` shown in headers, vouchers, footers | Build substitutes the demo brand name (`sheets/data.mjs`, env `BRAND_NAME`); text inside `<code>` keeps the token |
| 2 | Product, 360px | Sticky bar clipped "Buy now" off-screen | Shortcuts 48px, buttons `min-w-0`, icon hidden under 400px |
| 3 | Product, checkout (phone/tablet) | Bottom tab bar stacked under the sticky action bar | `publicPage({ tabbar: false })` |
| 4 | Checkout, desktop | "Place order" shown twice (summary and bottom bar) | Bottom bar is `lg:hidden` |
| 5 | Search, category, shop | Stray commas between filter chips (array printed with `,`) | `chipRow` joins arrays |
| 6 | Orders | "To Ship" tab selected while every order said "To Receive" | Selected tab is "To Receive" |
| 7 | Cart | Stepper jumped between left and right; item checkbox misaligned with shop checkbox | Stepper always right-aligned; checkboxes share a column |
| 8 | Admin detail pane | Listing photos stacked into a 480px column; action bar wrapped into two ragged rows | Photos in one row; action bar uses a container query (inline actions only when the pane is >= 48rem, otherwise a More menu) |
| 9 | Admin dashboard | Queue volume formatted as pesos ("₱56,150"); stat cards stacked one per row on phone | Chart takes a formatter; stat cards 2-up |
| 10 | Phone header | Search placeholder truncated ("Search product") | Logo mark hidden on phone (Home is in the tab bar); placeholder "Search halal products" |
| 11 | Address card | "Default" badge used the sale (red) tone | Primary tone |
| 12 | Shop header | Empty near-black banner | Geometric pattern banner |

## Added

- Tokens `--halal`, `--halal-soft`, `--halal-hover`; classes `.badge-halal`, `.badge-halal-solid`, `.pattern-geo`.
- Components: HalalBadge, HalalCertificateCard, HalalFacts, HalalVerificationChecklist, cold-chain note (4 new component sheets).
- Screens: halal home hero and trust strip, halal filter chips, product detail certification section, seller halal form section and expiry banner, halal moderation items.
- Content: halal-first sample products, categories, shops and copy (dates, frozen meat, hijab, malong, prayer mat, Qur'an).
- `docs/halal.md`.

## Not changed

Screenshots in `screenshots/` are not regenerated; run `npm run verify:shots` after merging.
