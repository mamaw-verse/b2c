# Product detail sticky action bar

The signature marketplace pattern: **Shop | Chat | Add to cart | Buy now** pinned to the viewport bottom on phone and inline in the details column on desktop.

## Behaviour

- Phone/tablet: `fixed inset-x-0 bottom-0 z-sticky-bar`, `shadow-sticky`, `pb-safe` (home-indicator padding). The page gets matching bottom padding so the bar never covers content (variation sheet scrolls above it).
- `lg:`: `static`, border/shadow removed — the same element renders as a normal row inside the details column. Do not duplicate markup per tier.
- Add to cart / Buy now open the `variationPicker` bottom sheet when variations exist; single-SKU products add directly and confirm via Toast ("Added to cart").

## Rules

- Exactly one primary action (Buy now). Secondary uses `.btn-secondary`.
- Shop/Chat are labelled icon columns ≥ 48px, hidden on desktop (the shop card there carries the same links).
- Loading a variation sheet skeletons its options, never the whole page.

Components: `stickyBar` (StickyActionBar), `variationPicker`, `chatComposer` (Chat target), `carousel` (gallery), `priceBlock`, `reviewCard`.
Reference: `screens/product.html`.
