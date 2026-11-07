# Listing & filter sheet

Applies to: search results, category listing, shop product list, seller order list, admin queue.

## Anatomy

1. Result context line ("1,240 results for “insulated tumbler”" / "24 items · 2 SLA breached").
2. Quick sort/filter chips — horizontally scrollable on phone, wrapping on `md+`. `aria-pressed` toggles, never colour alone.
3. "Filters" button (`sliders-horizontal` icon) → `Modal → BottomSheet` with the full fieldsets (type, status, price range, shipping). Footer: Reset + "Show N results" primary.
4. The grid/list itself, then an `infiniteSentinel`; `lg:` may add `Pagination` for admin-style tables.

## Rules

- Filter state lives in the URL (ports: query params / `useHttp`), so back/forward and share work.
- The primary button label carries the result count.
- Applying filters announces the new count via the polite live region.
- No horizontal scroll at 360px: chips scroll inside their rail, never the page.
- Empty result → EmptyState with "Clear filters" (see [states](states.md)).

Components: `chip`, `dialog`, `fieldset`/`check`, `searchInput`, `infiniteSentinel`, `pagination`, `productGrid`.
Reference: `screens/search.html`, `screens/category.html`, `screens/admin-queue.html`.
