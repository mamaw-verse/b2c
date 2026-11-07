# Empty, error and loading rules

Every list, detail pane and form region resolves to exactly one of four states. Precedence: **error > empty > loading > data** — an error always replaces the skeleton, and an empty result replaces everything.

## Loading

- First paint of a region → `skeleton` shaped like the real content (never a bare spinner for lists). `aria-busy` on the region or a labelled `skeleton` wrapper ("Loading…").
- Subsequent page loads → keep old data + "Load more" spinner in the sentinel.
- Action-level loading stays inside the control (`btn` `aria-busy` + spinner); the page does not skeleton.

## Empty

- `emptyState`: icon tile, title stating the fact ("No orders to ship"), one-line explanation, one action ("Continue shopping").
- Never blame the user and never show raw counts that imply an error ("0 items" alone is not an empty state).
- Filtered-empty differs from first-use-empty: "No results for “x”" + Clear filters, not onboarding copy.

## Error

- Region failed → `errorState` with Retry (real retry, keeps filters/scroll).
- Form-level failures → [validation](validation.md) rules, not ErrorState.
- Partial failures (e.g., 2 of 5 bulk actions failed) → banner listing the failed rows, not a toast.

## Offline

- Banner ("You're offline — changes will send when you're back"), content stays usable read-only; composer/actions that need the network are disabled with the reason visible.

Components: `skeleton`, `emptyState`, `errorState`, `banner`, `spinner`, `infiniteSentinel`.
