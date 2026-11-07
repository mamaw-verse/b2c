# Porting to Laravel + Inertia

This package is framework-neutral on purpose: every component is a documented HTML string + Tailwind classes + ARIA contract. Each sheet (`styleguide/components/*.html`, `docs/components/*.md`) is the spec — port the **structure and classes**, not the file.

## 1. Assets and tokens

1. Copy `src/tokens.css` into the app's CSS entrypoint **above** your utilities. It contains `@import "tailwindcss"`, the runtime variables (`:root`, media-tier overrides, `[data-brand]` blocks) and the `@theme inline` mapping. If the app already imports Tailwind, keep the variables + `@theme inline` block only.
2. Copy `src/components.css` (`@layer components` recipes: `.btn`, `.field`, `.badge`, `.card`, `.panel`) and `src/variants.css` (the `data-force` state variants — styleguide/testing aid, keep them; they're also useful for visual tests).
3. Fonts: copy `fonts/` (Manrope variable, self-hosted) and the `@font-face`/preload markup. To swap typefaces, change `--font-sans` and the files — nothing else references the font name.
4. Icons: copy `icons/sprite.svg`; inline it once in the root layout (`<use href="#i-name">`). To swap icon sets, regenerate via `scripts/icons.json` + `scripts/build-icons.mjs`, or replace with the app's icon component keyed by the same names.
5. JS: `dist/ds.js` is demo behaviour (dialogs, combobox, bulk select, master-detail, composer autosize, validation). In React/Vue ports, replicate the *behaviour contract* on the sheet (section 7) rather than porting the file — native `<dialog>`, `showModal()`, and focus-return are the required parts. For Blade/Livewire-style ports, `ds.js` is usable as-is.
6. Add new brands by generating `src/brand-<name>.css` (`node scripts/seed-to-scale.mjs --seed "#hex" --name <name>`), then re-measure pairs in `scripts/contrast-pairs.mjs`.

## 2. Runtime brand switching

- Brand values live under `[data-brand="<name>"]`; aliases (`--primary`, `--ring`, `--surface-inverse`, …) are declared on `:root, [data-brand]` so they re-resolve wherever the attribute sits.
- Whole-app switch: render `<html data-brand="{{ $brand }}">` server-side. Tenant/shop-level brands: set `data-brand` on a wrapper element — every semantic utility follows automatically because all utilities resolve through `var()`.
- Never hardcode a resolved hex in components: utilities (`text-primary`, `bg-surface`, `border-border`) and the component recipes already point at variables. The scan gate (`npm run scan`) rejects raw hex in component markup; apply the same rule to ported templates.

## 3. Mapping components

The component sheet's **API/props** table is the contract; the **HTML usage** section is the reference markup.

| HTML pattern | Blade | Inertia (React/Vue) |
|---|---|---|
| Helper function (e.g. `btn()`) | `<x-btn>` component or class-variant package | `<Button>` with `variant`/`size` props |
| `data-ds-open`, `data-ds-close` dialogs | `<dialog>` + Alpine/Livewire or `ds.js` | `useRef` + `showModal()`/`close()`; keep Escape/backdrop/`openers` focus-return |
| `data-ds-*` behaviours (bulk, combobox, master-detail, composer) | `ds.js` as-is | Re-implement per sheet; `data-ds-*` names may become props/events |
| Sticky/fixed bars + safe areas | Identical CSS (`pb-safe`, `--tabbar-h`, `z-*`) | Same classes; `env(safe-area-inset-*)` works unchanged |
| `{{BRAND_NAME}}` | `{{ config('app.name') }}` / brand setting | Same |

Rules that must survive every port (from the sheets' accessibility section):

- Role/name/keyboard/focus contract per component (e.g., tabs are a real `tablist`, chips are `aria-pressed`, dialogs are native `<dialog>`).
- Text state labels — never status by colour alone (StatusPill keeps its icon + text).
- 44px minimum touch targets (`min-h-touch`), 48px primary (`min-h-touch-primary`), `pb-safe` on anything pinned to the bottom.
- Inputs ≥ 16px on phone/tablet (`--fs-input` handles this; don't shrink in the port).
- Focus into overlays on open and back to the trigger on close; `aria-expanded`/`aria-controls` on comboboxes/menus; `aria-busy` on loading buttons; live regions for toasts, bulk counts and incoming chat.
- Semantic tokens only — the sheet's "Tokens used" list is the allowed set.

## 4. Component-by-component

Each `docs/components/<slug>.md` carries the same 12 sections as the HTML sheet, including the reference snippet (section 11) and test notes (section 12). Port in dependency order: `core` (btn, badge, card) → forms → feedback/overlays → navigation → data display → commerce → chat → seller → moderation.

Suggested checklist per ported component:

- [ ] Markup matches section 11 (roles, `aria-*`, `<time>`, `<mark>` where used).
- [ ] All sheet variants/sizes render via props; states cover at least default/disabled/loading/error where listed.
- [ ] Responsive rules from section 5 kept (mobile-first `md:`/`lg:` only).
- [ ] Keyboard + screen-reader pass per section 7; focus contract verified for overlays.
- [ ] Copy comes from props/i18n keys — no strings inside the component.
- [ ] Renders under a different `data-brand` without edits.

## 5. Known PROPOSED/OPEN items to decide during the port

- Support tickets as a dedicated channel (currently chat covers buyer↔seller).
- Bulk CSV product upload for sellers (currently form-only).
- Voice/barcode search input affordances.
- Whether the account shell keeps the bottom tab bar at `md` (PROPOSED: yes).
