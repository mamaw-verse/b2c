# ConfirmDialog

Feedback · Phase 2 · Live sheet: `styleguide/components/confirm-dialog.html`

## 1. Purpose
Asks for confirmation before destructive or irreversible actions.

**Use when**
- Cancel order, delete listing, suspend shop, discard changes.

**Don't use when**
- Reversible actions (use Undo toast).

## 2. Anatomy
1. `` centered on every tier.
2. Title as a question.
3. Consequence text (`aria-describedby`).
4. Safe action (neutral, initial focus) + destructive action (danger).

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Destructive | danger confirm |  |
| Neutral | primary confirm | Mark as shipped. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Buttons. |
| Pressed | n/a: Buttons. |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | rendered |
| Error | n/a: Show a Banner inside the dialog body and keep it open. |
| Selected | n/a: n/a |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Centered, not a sheet (confirmations must be deliberate). Buttons stack full width in DOM order: safe action first, destructive last (nearest the thumb). |
| Tablet (md, 768px+) | Buttons in a row, right-aligned. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| title | string | — | Question. |
| text | string | — | Consequence. |
| confirm / cancel | string | — | Specific verbs. |
| tone | `danger` \| `primary` | `danger` |  |
| onConfirm | fn | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `alertdialog` (native modal dialog). |
| Accessible name | `aria-labelledby` title, `aria-describedby` text. |
| Keyboard | Escape cancels; Tab cycles inside (page is inert). |
| Focus management | Initial focus on the safe action; focus returns to the trigger on close. |
| ARIA | — |
| Touch target | Buttons 44px. |
| Reduced motion | Fade/scale removed under reduced motion. |
| Announcements | Title + description announced on open. |

## 8. Tokens used
`--border`, `--border-control`, `--brand-950`, `--danger`, `--danger-hover`, `--danger-pressed`, `--dur`, `--ease-out`, `--elevation-sheet`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-h3`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--r-button`, `--r-panel`, `--surface`, `--surface-muted`, `--touch-min`, `--z-modal`

## 9. Content rules
- Title is a question naming the object.
- Buttons repeat the verb (“Cancel order” / “Keep order”), never Yes/No.

## 10. Do / Don't
**Do**
- Explain consequences (refund timing).

**Don't**
- Don’t confirm non-destructive actions.

## 11. HTML usage
```html
<button type="button" class="btn btn-danger" data-ds-open="cd1"><span>Cancel order</span></button>
<dialog id="cd1" aria-labelledby="cd1-title" aria-describedby="cd1-desc" role="alertdialog" class="z-modal bg-surface p-0 shadow-sheet transition-[translate,opacity,scale,display,overlay] transition-discrete duration-token m-auto w-[min(24rem,calc(100vw-2rem))] rounded-panel starting:open:opacity-0 starting:open:scale-95">
  <div class="flex max-h-[inherit] flex-col ">
    <div class="flex items-center gap-2 px-5 pt-5">
      <h2 id="cd1-title" class="flex-1 text-h3">Cancel this order?</h2>
    </div>
    <div class="overflow-y-auto overscroll-contain px-5 pt-2 pb-5" id="cd1-desc">
      <p class="text-body text-muted-foreground">The seller will be notified and your payment will be refunded within 3–5 banking days.</p>
    </div>
    <div class="flex flex-col gap-2 sm:flex-row sm:justify-end px-5 pb-5">
      <button type="button" class="btn btn-neutral" data-ds-close autofocus><span>Keep order</span></button>
      <button type="button" class="btn btn-danger" data-ds-close value="confirm"><span>Cancel order</span></button>
    </div>
  </div>
</dialog>
```

## 12. Test notes
- Focus starts on the safe action and returns to the trigger.
- Escape closes.
- Background inert.
