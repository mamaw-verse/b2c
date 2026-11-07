# BottomSheet

Overlays · Phase 2 · Live sheet: `styleguide/components/bottom-sheet.html`

## 1. Purpose
Phone-first sheet that stays a sheet on every tier (variation picker, share, action sheet). Max 36rem wide on tablet/desktop.

**Use when**
- Pickers tied to the bottom action bar (variation, quantity).
- Action sheets.

**Don't use when**
- Desktop-heavy forms (Modal).

## 2. Anatomy
1. `` anchored bottom.
2. Handle (drag to dismiss; also Close button).
3. Header, scrollable body, sticky footer + safe area.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `kind: "sheet"` |  |
| Action sheet | list of buttons in body | Share / report menu on phone. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Children. |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | n/a: Skeleton in body. |
| Error | n/a: Banner in body. |
| Selected | n/a: n/a |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Full width from the bottom. |
| Tablet (md, 768px+) | Centered horizontally, 36rem max, still from the bottom. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| open | boolean | false |  |
| title | string | — |  |
| dismissible | boolean | true | Swipe/backdrop/Escape. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Native modal dialog. |
| Accessible name | Title. |
| Keyboard | Escape closes; swipe is never the only way (Close button). |
| Focus management | Into sheet on open; back to trigger on close. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Slide removed under reduced motion. |
| Announcements | Title on open. |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--brand-950`, `--dur`, `--ease-out`, `--elevation-sheet`, `--foreground`, `--fs-body`, `--fs-h3`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-button`, `--r-panel`, `--ring`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--z-modal`, `currentColor (icons)`

## 9. Content rules
- Short title; actions as verbs.

## 10. Do / Don't
**Do**
- Keep primary action in the sticky footer.

**Don't**
- Don’t exceed 90dvh.

## 11. HTML usage
```html
<button type="button" class="btn btn-secondary" data-ds-open="bs1"><span>Select variation</span></button>
<dialog id="bs1" aria-labelledby="bs1-title" class="z-modal bg-surface p-0 shadow-sheet transition-[translate,opacity,scale,display,overlay] transition-discrete duration-token mt-auto mb-0 w-full max-h-[90dvh] rounded-t-panel md:mx-auto md:max-w-xl starting:open:translate-y-full">
  <div class="flex max-h-[inherit] flex-col ">
    <div class="flex justify-center pt-2 md:hidden" data-ds-sheet-handle><span class="h-1.5 w-10 rounded-full bg-border-control" aria-hidden="true"></span></div>
    <div class="flex items-center gap-2 border-b border-border py-1 pl-4 pr-1 md:py-2">
      <h2 id="bs1-title" class="flex-1 text-h3">Share</h2>
      <button type="button" class="btn btn-icon btn-ghost text-foreground" aria-label="Close" data-ds-close><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg></button>
    </div>
    <div class="overflow-y-auto overscroll-contain flex-1 p-4">
      <ul class="grid">
        <li>
          <button type="button" class="flex min-h-touch-primary w-full items-center gap-3 rounded-button px-2 text-body hover:bg-surface-muted" data-ds-close><svg class="icon" aria-hidden="true"><use href="#i-copy"/></svg>Copy link</button>
        </li>
        <li>
          <button type="button" class="flex min-h-touch-primary w-full items-center gap-3 rounded-button px-2 text-body hover:bg-surface-muted" data-ds-close><svg class="icon" aria-hidden="true"><use href="#i-message-circle"/></svg>Send in chat</button>
        </li>
        <li>
          <button type="button" class="flex min-h-touch-primary w-full items-center gap-3 rounded-button px-2 text-body hover:bg-surface-muted" data-ds-close><svg class="icon" aria-hidden="true"><use href="#i-share-2"/></svg>More options</button>
        </li>
      </ul>
    </div>
  </div>
</dialog>
```

## 12. Test notes
- Drag handle closes after 80px.
- Scroll lock active.
