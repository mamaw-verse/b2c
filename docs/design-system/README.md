# Marketplace design system

White-label, mobile-first multi-vendor marketplace components (storefront, buyer account, seller centre, admin moderation, chat). Static HTML + Tailwind CSS v4 + minimal vanilla JS — framework-neutral for porting to Blade or Inertia.

```
npm install
npm run build       # fonts, icons, styleguide, CSS, tokens, contrast report, violation scan
npm run verify      # Playwright + axe on every page, both brands, 360/768/1280
npm run verify:shots  # same + writes screenshots/
npm run serve       # http://localhost:4173/styleguide/
npm run brand:demo  # regenerate the demo brand from a seed colour
```

- `styleguide/` — rendered system: foundations, 97 component sheets, 5 shells, 15 screens, both brands.
- `docs/` — index, foundations, contrast, verification, REPORT, patterns, content guide, per-component sheets.
- `PORTING.md` — Blade/Inertia mapping, token wiring, runtime brand switching, porting checklist.
- `dist/` `tokens/` `fonts/` `icons/` `screenshots/` — the shippable assets. Manrope and Lucide are self-hosted and replaceable.
