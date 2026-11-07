# Foundations (Phase 1)

## Brand switching (DECIDED)
- Raw brand values live in `:root, [data-brand="default"]`; each extra brand is a generated `[data-brand="<name>"]` block (`src/brand-<name>.css`).
- Aliases (`--primary`, `--ring`, `--surface-inverse`, ...) are declared on `:root, [data-brand]`, so they re-resolve on **any element** that carries `data-brand`. Put it on `<html>` for the whole app, or on a wrapper for side-by-side previews.
- Tailwind tokens use `@theme inline`, so utilities follow the variables at runtime. No rebuild to swap a brand.

## New brand
`node scripts/seed-to-scale.mjs --seed "#rrggbb" --name <brand> [--radius round]` writes `src/brand-<brand>.css`, then re-measures every pair in `scripts/contrast-pairs.mjs`. Add the file to `src/main.css`, run `npm run build`.
The scale is rebuilt at the same relative luminance as the default scale, with the seed's hue and saturation, so contrast is inherited by construction and then verified.

## Deviations from the seed
| Token | Old | New | Reason |
|---|---|---|---|
| `--shadow-*` runtime vars | `--shadow-card-hover` etc. (self-referencing in `@theme inline`) | `--elevation-*` | Avoids a `var()` cycle; Tailwind `--shadow-*` maps to them |
| `--border-control` | `#869089` (3.30 on white, **2.93** on surface-muted) | `#818b84` (3.52 white, 3.13 surface-muted) | Fields on muted panels failed 3:1 |
| `--fs-input` at lg | `.875rem` by width | `.875rem` only for `min-width:64rem` **and** `pointer:fine` | Landscape iPad would zoom on focus |
| `--sidebar-w` | 220px account, 225px seller/admin | 220px everywhere | Alignment drift |
| `--surface-brand-soft`, `--surface-inverse` | hex | `var(--brand-50)`, `var(--brand-900)` | Same value; follows the brand |
| Added | | `--ring-inverse`, z-index scale, touch sizes, reduced-motion, safe-area utilities | Listed as DECIDED in the brief |

All other seed values are unchanged, and every contrast figure quoted in the seed comments was re-measured and matches (see the last table in `contrast.md`).

## Decision log
- DECIDED: demo brand is plum (hue 310), not blue, so it cannot be confused with the `--info` blue.
- PROPOSED: storefront and account keep the bottom tab bar at `md`; only seller/admin switch to a collapsed rail at `md`. (`--tabbar-h` stays until `lg`.)
- PROPOSED: touch-target sizes: `sm` buttons stay 44px tall (smaller padding and text), `lg` is 48px.
