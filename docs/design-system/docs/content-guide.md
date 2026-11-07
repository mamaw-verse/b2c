# Content guide

English first, Filipino-ready. All copy is passed in — components hold no baked-in strings, so every label can come from your i18n layer (Taglish is common in PH commerce; short English fallbacks should exist for every string).

## Tone

- Warm, direct, transactional. Say what happened and what to do next; skip apologies except real failures.
- Verbs over nouns: "Arrange shipment", not "Shipment arrangement".
- Never blame the user: "Enter the packed weight", not "You forgot the weight".

## Buttons and links

- One primary action per section; the label states the result ("Place order", "Show 248 results", "Reject listing").
- Destructive labels name the object ("Suspend shop", "Remove photo"), never bare "Delete" where context is ambiguous.
- Links for navigation, buttons for action. Link text is meaningful without "click here".

## Errors

- Start with what to do, not what went wrong: "Enter a valid PH mobile number (09XX XXX XXXX)".
- Match the field: one field, one message, at the field.
- Success is quiet — toast or check, not a paragraph.

## Empty states

- State the fact, then the next step: "No orders to ship" → "New orders appear here." + one action.
- Filtered-empty offers reset: "No results for “x”" → Clear filters.

## Numbers, dates, currency

- Currency: `₱1,250` — no decimals unless the amount has centavos (`₱1,348.50`); tabular numerals everywhere numbers compare.
- Counts: compact (`1.2k sold`, `12.4k`) — `compact()` in `ds.js`/helpers; exact value on the detail view.
- Times in lists: relative ("2h ago", "Yesterday") → absolute on detail ("Oct 30, 2026, 4:12 PM"); always `<time>`.
- Phones: `+63 917 123 4567` display, `09XX XXX XXXX` accepted in forms.
- SLA/age: "3h 52m · SLA 4h (8 min left)" / "SLA breached".

## Filipino-readiness

- Strings are placeholders/`{{BRAND_NAME}}`-style tokens or call-site copy — port them to your translation keys 1:1.
- Keep honorific-friendly space: "Salamat po!" fits everywhere; avoid microcopy baked into icons/images.
- Plurals come from ICU/Intl rules in the port ("1 item" / "2 items"), not `+ "s"` concatenation — `plural` helpers in ports.
