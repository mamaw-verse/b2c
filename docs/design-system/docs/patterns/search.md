# Search

## Flow

1. Header search input is a combobox: `role="combobox"`, `aria-expanded`, listbox of suggestions + "Recent searches" group, `aria-activedescendant` for keyboard navigation.
2. Enter → results page; query echoed in the heading ("“insulated tumbler” · 1,240 results").
3. No-match → polite "No matches. Press Enter to search anyway." — the form still submits.

## Behaviour per tier

- Phone: search row is the whole sticky header; suggestions dropdown `position:fixed`-like under the bar.
- Desktop: wide search field in the full header; recent + trending groups allowed.

## Rules

- Debounce suggestion fetches; cache per session.
- Never navigate on arrow keys — arrows only move `aria-activedescendant`; Enter on a highlighted option selects it.
- Clear-all recents is a separate small action, never inside the list options.
- Voice/barcode inputs are PROPOSED additions; keep the icon slots in mind in ports.

Components: `searchInput`, `chip` (sort), `productGrid`, `infiniteSentinel`.
Reference: `screens/search.html`.
