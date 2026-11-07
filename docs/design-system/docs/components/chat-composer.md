# ChatComposer

Chat & notifications · Phase 3 · Live sheet: `styleguide/components/chat-composer.html`

## 1. Purpose
Message input: attach (photo, product, order), auto-growing textarea, send.

**Use when**
- Bottom of ChatThread.

**Don't use when**
- Review text (TextArea).

## 2. Anatomy
1. Attach IconButton (opens action sheet).
2. Textarea (1–6 lines, 16px).
3. Send button (primary, round).
4. Safe-area bottom padding.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `chatComposer()` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Buttons. |
| Pressed | n/a: Buttons. |
| Focus-visible | rendered |
| Disabled | rendered |
| Loading | n/a: Bubble shows Sending. |
| Error | n/a: Bubble shows Not sent. |
| Selected | n/a: n/a |
| Empty | n/a: Send works only with text (no-op if empty). |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Pinned to the bottom; grows up to 160px. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same; Enter sends, Shift+Enter newline. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| onSend | fn | — |  |
| onAttach | fn | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Form. |
| Accessible name | sr-only label “Message”; buttons labelled. |
| Keyboard | Enter sends (not during IME composition); Shift+Enter newline. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | “Message sent” polite. |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--danger`, `--dur`, `--ease-out`, `--foreground`, `--fs-body`, `--fs-input`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--r-button`, `--r-field`, `--r-search`, `--ring`, `--subtle-foreground`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `currentColor (icons)`

## 9. Content rules
- Placeholder “Type a message”.

## 10. Do / Don't
**Do**
- Keep 16px text.

**Don't**
- Don’t disable Send; ignore empty.

## 11. HTML usage
```html
<form class="flex items-end gap-1 border-t border-border bg-surface px-2 pt-2 pb-[calc(.5rem+env(safe-area-inset-bottom,0px))]" data-ds-composer="thread">
  <button type="button" class="btn btn-icon btn-ghost text-foreground" aria-label="Attach photo, product or order"><svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg></button>
  <label for="cc1" class="sr-only">Message</label>
  <textarea id="cc1" rows="1" placeholder="Type a message" class="field max-h-40 min-h-touch flex-1 resize-none rounded-search py-2.5" data-ds-autosize enterkeyhint="send"></textarea>
  <button type="submit" class="btn btn-icon rounded-full" aria-label="Send"><svg class="icon" aria-hidden="true"><use href="#i-send"/></svg></button>
  <p class="sr-only" aria-live="polite" data-ds-live></p>
</form>
```

## 12. Test notes
- IME composition (Filipino keyboards) doesn’t send early.
