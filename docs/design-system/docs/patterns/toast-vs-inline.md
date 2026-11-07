# Toast vs inline error

Choose by where the user's attention is, and whether the message must persist.

## Toast (`role="status"`, polite, auto-dismiss ~5s)

Use for **confirmation of a completed action** or non-blocking background events:
- "Added to cart", "Message sent", "Report received", "Listing rejected — message sent".
- One actionable link max ("Undo", "View"). Never a form inside a toast.
- Toasts stack from the bottom, above `z-toast`, and pause on hover/focus. Critical failures are never toasts.

## Banner (persistent, inside the layout)

Use when the message must survive until resolved:
- Offline, payment declined, item no longer available, partial bulk failures, session-expiring.
- Toned by severity (info/success/warning/danger), icon + text, optional action, optional dismiss for non-critical.

## Inline error / fieldset error

Use for anything the user can fix right now — always at the point of input, tied by `aria-describedby` (see [validation](validation.md)).

## EmptyState / ErrorState

Use when a whole region has no content or failed to load — never a toast for page-level failure.

## Rule of thumb

- Result of your action → toast.
- Problem blocking the current task → inline or banner.
- A region can't render → state component.
