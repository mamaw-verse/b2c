# Combobox

Forms · Phase 2 · Live sheet: `styleguide/components/combobox.html`

## 1. Purpose
Type-to-filter single choice for long lists: city/municipality, barangay, category, courier.

**Use when**
- Long lists where typing is faster than scrolling.

**Don't use when**
- Short lists (Select).
- Free text search (SearchInput).

## 2. Anatomy
1. Input `role=combobox` with chevron.
2. Popup listbox with options; selected option bold + tinted.
3. “No matches” row.
4. Live region with match count.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Single select | `combobox()` | Address parts. |
| Inside FormField | default | Label, help, error. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: Disabled until the parent (province) is chosen; use the field disabled style. |
| Loading | n/a: Show “Loading…” row while remote options load. |
| Error | rendered |
| Selected | rendered |
| Empty | rendered |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Popup is full field width, max 16rem tall, scrolls. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| options | array | — |  |
| value | string |  |  |
| onSearch | fn | — | Remote filtering in ports. |
| required / error / help |  |  | FormField props. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | ARIA 1.2 combobox + listbox. |
| Accessible name | Label. |
| Keyboard | Type to filter; Down/Up; Enter select; Escape close. |
| Focus management | Stays in input; `aria-activedescendant`. |
| ARIA | `aria-expanded`, `aria-controls`, `aria-selected`. |
| Touch target | Options 44px tall. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Match count via polite live region. |

## 8. Tokens used
`--border`, `--border-control`, `--danger`, `--dur`, `--ease-out`, `--elevation-popover`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-input`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-soft`, `--r-badge`, `--r-field`, `--r-panel`, `--ring`, `--subtle-foreground`, `--surface`, `--surface-muted`, `--touch-min`, `--z-sheet`, `currentColor (icons)`

## 9. Content rules
- Options in title case as officially spelled (Las Piñas, Parañaque).

## 10. Do / Don't
**Do**
- Accept accented and unaccented input (Las Pinas).

**Don't**
- Don’t allow values outside the list for address fields.

## 11. HTML usage
```html
<div class="grid gap-1.5">
  <div class="flex items-baseline justify-between gap-2">
    <label for="cb1" class="text-label text-foreground">City / Municipality<span class="text-danger" aria-hidden="true"> *</span></label>
  </div>
  <div class="relative" data-ds-combobox><input id="cb1" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="cb1-list" autocomplete="off" value="Quezon City" class="field pr-10" required aria-describedby="cb1-error" data-ds-open-on-focus><svg class="icon pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true"><use href="#i-chevron-down"/></svg>
    <ul id="cb1-list" role="listbox" aria-label="City / Municipality" class="absolute inset-x-0 top-full z-sheet mt-1 max-h-64 overflow-auto rounded-panel border border-border bg-surface py-1 shadow-popover" hidden>
      <li id="cb1-opt-0" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Caloocan</li>
      <li id="cb1-opt-1" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Las Piñas</li>
      <li id="cb1-opt-2" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Makati</li>
      <li id="cb1-opt-3" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Manila</li>
      <li id="cb1-opt-4" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Marikina</li>
      <li id="cb1-opt-5" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Pasig</li>
      <li id="cb1-opt-6" role="option" aria-selected="true" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Quezon City</li>
      <li id="cb1-opt-7" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">Taguig</li>
    </ul>
    <p data-ds-empty hidden class="absolute inset-x-0 top-full z-sheet mt-1 rounded-panel border border-border bg-surface px-3 py-3 text-body text-muted-foreground shadow-popover">No matches</p>
    <p class="sr-only" aria-live="polite" data-ds-live></p>
  </div>
  <p id="cb1-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
</div>
```

## 12. Test notes
- Diacritics match (port: normalise NFD).
- Popup above sticky bars (`z-sheet`).
