# {{BRAND_NAME}} design system

White-label, mobile-first marketplace design system: storefront, buyer account, seller centre, admin moderation and chat. Framework-neutral — static HTML + Tailwind CSS v4 + minimal vanilla JS — built to be ported into Blade or Inertia (React/Vue) components. See `PORTING.md`.

## Start here

- `styleguide/index.html` — the whole system rendered: foundations, 97 component sheets (each in the fixed 12-section format), 5 layout shells and 15 reference screens, switchable between the default and demo brands. Serve statically (`npm run serve`) or open directly.
- `dist/` — built CSS (`styles.css`), `ds.js`, `sprite.svg`. No CDN at runtime; Manrope is self-hosted in `fonts/` and Lucide is inlined in `icons/sprite.svg` (both replaceable).
- `tokens/` — `tokens.json` (W3C DTCG) and `tokens.css`; brand scales live in `src/brand-*.css`.

## Docs

- [Foundations](foundations.md) — token architecture, brand switching, deviations from the seed, decision log.
- [Halal tailoring](halal.md) — status vocabulary, brand-independent `--halal*` tokens, where the mark appears, moderation checks.
- [Contrast report](contrast.md) — every foreground/background pair, measured, both brands.
- [Verification](verification.md) · [Final report](REPORT.md) — overflow, touch targets, input sizing, axe-core, dialog focus — 948 runs.
- [Halal pass changelog](CHANGELOG-halal-pass.md) — 12 fixes + additions merged 2026-11-05.
- [Components](components/index.md) — one Markdown sheet per component (generated).
- [Patterns](patterns/index.md) — flows built from the components.
- [Content guide](content-guide.md) — tone, labels, errors, empty states, formats, Filipino-readiness.
- [PORTING](../PORTING.md) — mapping to Blade / Inertia, token wiring, runtime brand switching, porting checklist.

## Quality gates (all enforced by `npm run build` + `npm run verify`)

- No hardcoded hex, px font sizes or brand strings in components/sheets (`npm run scan`).
- Every fg/bg pair measured; normal text ≥ 4.5:1, large text and UI boundaries ≥ 3:1 (`npm run contrast`).
- No horizontal scroll, ≥ 44px touch targets, inputs ≥ 16px on phone/tablet, axe-core clean, dialog focus in/return — verified in headless Chrome at 360/768/1280px in both brands.

## Scripts

| Command | Does |
|---|---|
| `npm run build` | fonts → icons → styleguide → CSS → tokens → contrast → scan |
| `npm run verify` | Playwright checks on every page, both brands, 360/768/1280 |
| `npm run verify:shots` | same + writes `screenshots/` for screens, layouts, component previews |
| `npm run brand:demo` | regenerate the demo brand from a seed colour |
| `npm run serve` | static server for the styleguide |
