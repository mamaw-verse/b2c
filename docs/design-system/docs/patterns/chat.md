# Chat

## Layout

- Phone: conversation list is the Chat tab; opening a conversation pushes the thread (back button returns to the list).
- Tablet/desktop: master-detail — list in a `--chat-list-w` column, thread alongside; active row `aria-current="true"`.

## Thread rules

- `ol` of messages, `aria-live="polite"` for incoming; own sends are confirmed locally, not re-announced.
- Bubbles: incoming on `--surface`, outgoing white-on-`--primary`; direction is position + sr-only sender prefix, never colour alone. Delivery status is text (Sent / Read / Not sent), icon secondary.
- Failed sends show "Not sent" + inline Retry; the bubble never vanishes.
- Product/order cards ride inside the thread as references; the composer (`textarea`, attach, send) stays pinned above the keyboard and safe area.
- Safety note ("Chats are monitored… never pay outside the app") is part of the thread, styled as a centred caption.

## Rules

- Composer textarea auto-grows to ~10rem; Enter sends (ports may keep Shift+Enter for newline).
- Report/Block live in the thread header menu → [report flow](report-flow.md).
- Do not mark a chat read until the thread is scrolled to the latest message.

Components: `chatList`, `chatThread`, `chatBubble`, `chatComposer`, `chatProductCard`, `chatOrderCard`, `avatar`, `menu`, `dialog`.
Reference: `screens/chat.html`.
