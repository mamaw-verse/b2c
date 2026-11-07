# Final report

Generated at the end of Phase 5. Verification after the Phase 6 halal pass: **948 Playwright runs (158 pages × 2 brands × 3 widths), 0 issues** — see `verification.md` for the regenerated machine report.

## What was built

| Phase | Delivered |
|---|---|
| 1 Foundations | Seed tokens + DECIDED additions (z-scale, touch sizes, ring + inverse ring, reduced motion, safe-area utilities); `tokens.json` (DTCG); seed-to-scale brand generator; demo (plum) brand; contrast report generated from tokens; violation scan; Manrope self-hosted; Lucide sprite. |
| 2 Core components | 34 sheets: actions, forms, feedback, overlays, navigation, data display — all in the fixed 12-section format, generated from data definitions in `sheets/defs/` via `sheets/lib/build.mjs`. |
| 3 Commerce + chat | 50 sheets: product card/grid, price block, rating/review, shop header/card, verified badge, vouchers, PH address form, shipping/payment pickers, cart, checkout summary, variation picker, sticky action bar, reviews, plus ChatList/Thread/Bubble/Composer, chat cards, NotificationItem, ReportDialog. |
| 4 Seller + admin | 9 sheets: TaskCard, OrderRow/OrderActionBar, ProductForm sections, VariantMatrix (table ≥768, cards <768), StockInput, accessible SalesChart with data-table disclosure, ShopSettings, StatusPill, ModerationQueueItem, QueueFilterBar, ModerationDetailPane, ReasonPicker, ModerationActionBar, BulkActionBar, AuditLogList, ContentPreview slots. |
| 5 Layouts, screens, docs | 5 shells (Public, Account, Seller, Admin, Auth) with phone drawer/tabbar → `md` rail → `lg` fixed sidebar; 15 reference screens composed only from package components; responsive iframes at 360/768/1280 on every responsive-critical sheet and every screen/shell page; docs (index, foundations, 11 patterns, content guide, `PORTING.md`); 216 screenshots (36 pages × 2 brands × 3 widths); `design-system.zip` (17MB, excludes `node_modules`). |
| 6 Halal pass | 4 sheets (HalalBadge, HalalCertificateCard, HalalFacts, HalalVerificationChecklist) + cold-chain note; brand-independent `--halal*` tokens, `.badge-halal(-solid)`, `.pattern-geo`; 16 icons; `halal` queue type + checklist in moderation; halal-first sample data; `{{BRAND_NAME}}` resolves via `BRAND_NAME` env; 12 markup fixes (changelog); media() simplified (placeholder attrs and dot-grid removed). |

## Token deviations (measured, per the seed rules)

| Token | Old | New | Ratio / reason |
|---|---|---|---|
| `--border-control` | `#869089` | `#818b84` | 3.30→3.52 on white, 2.93→3.13 on `--surface-muted` (UI boundary ≥3:1) |
| `--surface-brand-soft`, `--surface-inverse` | hex | `var(--brand-50)`, `var(--brand-900)` | Same rendered value; follows the brand so nested previews work |
| `--fs-input` at ≥64rem | `.875rem` on width alone | `.875rem` only when `pointer:fine` | iPad landscape was zooming on focus |
| `--shadow-*` runtime names | same names | `--elevation-*` vars | Removed a `var()` cycle; utilities unchanged |
| `--sidebar-w` | 220/225px | 220px everywhere | Alignment drift |
| `priceBlock` `<s>` colour | `subtle-foreground` | `muted-foreground` | 4.44→~5.9 on `--surface-cta` (axe) |
| SalesChart non-max bars | `brand-300` | `brand-400` | Non-text boundary ≥3:1 vs surface |
| SegmentedControl `sm`, chip | 36px hit area | visual 36px + ::after expansion to ≥44px | Touch gate |

Everything else matches the seed; quoted ratios in the seed comments were re-measured and hold (0 failing pairs, both brands).

## Fixes during verification

- Dialog focus: native `<dialog>` + `openers` WeakMap returns focus to the trigger; verify asserts focus-in and focus-back on every page at 360px.
- Master-detail (`data-ds-master`/`data-ds-detail`) drives `aria-current`; bulk bars appear on selection and announce counts via live region.
- Heading order: preview pages get sr-only h1/h2; queue titles are `<p>` (rows aren't headings); product-grid screens get sr-only h2.
- `data-force` variants render hover/pressed/focus states live in the states matrix (styleguide only; useful for ports' visual tests).
- `sg.js` hardened (missing `[data-sample]` no longer throws).
- `verify.mjs` closes auto-opened preview dialogs before the focus pass; focus waits bumped to 8s (the one flake under parallel load was contention, not a defect).

## Unverified items

- iOS Safari specifically (Chrome engine verified; safe-area utilities are CSS-env based and standard).
- Real device touch drag for the sheet handle (logic is in `ds.js`; pointer events verified only via synthetic events).
- The `data-sg-autoheight` iframe autosize in browsers other than Chrome.

## Open questions (marked OPEN/PROPOSED)

- Support tickets vs chat for buyer↔platform (PROPOSED separate component).
- Bulk CSV upload for sellers (PROPOSED).
- Voice/barcode search affordances (PROPOSED icon slots only).
- Account shell keeps bottom tabs at `md` (PROPOSED; decided for storefront).
- `{{BRAND_NAME}}` and copy placeholders resolve at port time — i18n key mapping is intentionally out of scope.
