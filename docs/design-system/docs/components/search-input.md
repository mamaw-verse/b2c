# SearchInput

Forms · Phase 2 · Live sheet: `styleguide/components/search-input.html`

## 1. Purpose
Search field with suggestions (ARIA combobox). Lives in the sticky header on every storefront screen.

**Use when**
- Product and shop search; seller/admin list search.

**Don't use when**
- Filtering a short visible list (use chips).

## 2. Anatomy
1. `role=search` form.
2. Leading search icon.
3. Input `role=combobox`, `--r-search`.
4. Listbox of suggestions (recent / popular), `z-sheet`, `--shadow-popover`.
5. Polite live region with result count.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Header (md) | default | Phone + desktop header. |
| Large | `size: lg` | Search landing page. |
| With recent heading | `recent` | Empty query shows recent searches. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: Search is never disabled. |
| Loading | n/a: Suggestions appear when ready; a spinner is not shown for <300ms responses. |
| Error | n/a: On failure, the list shows nothing and Enter still submits. |
| Selected | rendered |
| Empty | rendered |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Fills the header row between logo and cart/chat; 16px text. |
| Tablet (md, 768px+) | Same; header 64px. |
| Desktop (lg, 1024px+) | Max 42rem wide in the 78px header; 14px text with a mouse. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| value | string |  |  |
| suggestions | string[] | [] |  |
| recent | string | — | Heading for recent searches. |
| placeholder | string | “Search products and shops” |  |
| action | url | — | Form submits to results page. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `search` landmark; input `combobox`; list `listbox`/`option`. |
| Accessible name | Visually hidden label “Search”. |
| Keyboard | Down/Up move through suggestions; Enter picks; Escape closes then clears. |
| Focus management | Focus stays in the input (`aria-activedescendant`). |
| ARIA | `aria-expanded`, `aria-controls`, `aria-autocomplete=list`, `aria-selected` on the active option. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | “3 suggestions” / “No suggestions” via polite live region. |

## 8. Tokens used
`--border`, `--border-control`, `--danger`, `--dur`, `--ease-out`, `--elevation-popover`, `--foreground`, `--fs-body`, `--fs-input`, `--muted-foreground`, `--primary`, `--primary-soft`, `--r-field`, `--r-panel`, `--r-search`, `--ring`, `--subtle-foreground`, `--surface`, `--surface-muted`, `--touch-min`, `--z-sheet`, `currentColor (icons)`

## 9. Content rules
- Placeholder states scope: “Search products and shops”.
- Highlight matched text in bold (optional).

## 10. Do / Don't
**Do**
- Keep Enter working even when no suggestion is active.

**Don't**
- Don’t move focus into the list.
- Don’t auto-submit on arrow key.

## 11. HTML usage
```html
<form role="search" class="relative" data-ds-combobox action="#" onsubmit="return false">
  <label for="si1" class="sr-only">Search</label>
  <svg class="icon pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true"><use href="#i-search"/></svg><input id="si1" type="search" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="si1-list" autocomplete="off" enterkeyhint="search" value="" placeholder="Search products" class="field rounded-search pl-10 pr-3" data-ds-open-on-focus>
  <ul id="si1-list" role="listbox" aria-label="Suggestions" class="absolute inset-x-0 top-full z-sheet mt-1 max-h-80 overflow-auto rounded-panel border border-border bg-surface py-1 shadow-popover" hidden>
    <li id="si1-opt-0" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center gap-3 px-3 text-body aria-selected:bg-primary-soft hover:bg-surface-muted"><svg class="icon size-4 text-muted-foreground" aria-hidden="true"><use href="#i-search"/></svg><span>ajwa dates</span></li>
    <li id="si1-opt-1" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center gap-3 px-3 text-body aria-selected:bg-primary-soft hover:bg-surface-muted"><svg class="icon size-4 text-muted-foreground" aria-hidden="true"><use href="#i-search"/></svg><span>halal longganisa</span></li>
    <li id="si1-opt-2" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center gap-3 px-3 text-body aria-selected:bg-primary-soft hover:bg-surface-muted"><svg class="icon size-4 text-muted-foreground" aria-hidden="true"><use href="#i-search"/></svg><span>prayer mat</span></li>
    <li id="si1-opt-3" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center gap-3 px-3 text-body aria-selected:bg-primary-soft hover:bg-surface-muted"><svg class="icon size-4 text-muted-foreground" aria-hidden="true"><use href="#i-search"/></svg><span>hijab</span></li>
    <li id="si1-opt-4" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center gap-3 px-3 text-body aria-selected:bg-primary-soft hover:bg-surface-muted"><svg class="icon size-4 text-muted-foreground" aria-hidden="true"><use href="#i-search"/></svg><span>malong</span></li>
  </ul>
  <p data-ds-empty hidden class="absolute inset-x-0 top-full z-sheet mt-1 rounded-panel border border-border bg-surface px-3 py-3 text-body text-muted-foreground shadow-popover">No matches. Press Enter to search anyway.</p>
  <p class="sr-only" aria-live="polite" data-ds-live></p>
</form>
```

## 12. Test notes
- Arrow keys change `aria-activedescendant`.
- Listbox overlays content without clipping at 360px.
- Live region announces count.
