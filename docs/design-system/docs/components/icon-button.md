# IconButton

Actions · Phase 2 · Live sheet: `styleguide/components/icon-button.html`

## 1. Purpose
A square button that shows only an icon: cart, chat, close, more. Optional count badge.

**Use when**
- The icon is universally understood (close, back, search, cart, more).
- Space is tight: headers, cards, toolbars.

**Don't use when**
- The action is ambiguous without words; use a Button with label.
- Primary page actions.

## 2. Anatomy
1. Square `.btn.btn-icon` container (44px; 36px with `btn-sm`).
2. Icon (20px).
3. Optional count badge (`--sale` background), hidden from AT; count is appended to the accessible name.
4. Optional Tooltip on pointer devices.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Ghost (default) | `.btn-icon.btn-ghost` | Headers, cards. |
| Neutral | `.btn-icon.btn-neutral` | Floating over media (gallery arrows). |
| Primary / secondary | `.btn-icon` / `.btn-icon.btn-secondary` | Compose send button, FAB-like actions. |
| With count | `count` prop | Cart, chat, notifications. |
| sm / lg | `.btn-sm` / `.btn-lg` | 36px (44px hit area) / 48px. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | rendered |
| Focus-visible | rendered |
| Disabled | rendered |
| Loading | rendered |
| Error | n/a: Show errors next to the related content. |
| Selected | rendered |
| Empty | n/a: Badge hides at 0. |
| Skeleton | n/a: Use a 44px circle Skeleton. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | 44px everywhere. Header shows cart + chat. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Header adds notifications; Tooltip shows on hover. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| icon | icon name | — | Required. |
| label | string | — | Required accessible name. |
| count | number | — | Shows badge; “99+” above 99; appended to name (“Cart, 2”). |
| variant | as Button | `ghost` |  |
| size | `sm` \| `md` \| `lg` | `md` |  |
| pressed | boolean | — | Toggle buttons (like) use `aria-pressed`. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `` or ``. |
| Accessible name | `aria-label` is mandatory; count appended (“Chat, 3”). |
| Keyboard | Enter / Space. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | `aria-pressed` for toggles; badge `aria-hidden`. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Toggle state change is conveyed by `aria-pressed`. |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--dur`, `--ease-out`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--foreground-inverse`, `--fs-body`, `--fs-caption`, `--fs-label`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--r-badge`, `--r-button`, `--sale`, `--surface`, `--surface-inverse`, `--surface-muted`, `--touch-min`, `--touch-primary`, `--z-toast`, `currentColor (icons)`

## 9. Content rules
- Label describes the action, not the icon: “Add to likes”, not “Heart”.
- Counts above 99 show “99+” visually; the name keeps the real number.

## 10. Do / Don't
**Do**
- Pair rare icons with a Tooltip on desktop.
- Keep 44px even when the icon is 16px.

**Don't**
- Don’t rely on the tooltip as the only name.
- Don’t use for destructive actions without confirmation.

## 11. HTML usage
```html
<button type="button" class="btn btn-icon btn-ghost text-foreground" aria-label="Cart, 2"><svg class="icon" aria-hidden="true"><use href="#i-shopping-cart"/></svg><span class="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-sale px-1 text-caption leading-5 text-primary-foreground" aria-hidden="true">2</span></button>
```

## 12. Test notes
- axe: `button-name` passes.
- Badge does not change the button size.
- Touch target ≥ 44px.
