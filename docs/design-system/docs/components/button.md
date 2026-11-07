# Button

Actions · Phase 2 · Live sheet: `styleguide/components/button.html`

## 1. Purpose
Triggers an action in place: submit, add to cart, confirm, delete. One recipe (`.btn`) with variant and size modifiers.

**Use when**
- The control changes data or state (Add to cart, Place order, Approve).
- Submitting a form.
- Opening a dialog or sheet (`data-ds-open`).

**Don't use when**
- Navigating to another page: use **Link** (or `.btn` on an `` when it must look like a button, e.g. “Shop now”).
- Toggling a filter: use **Chip** (`aria-pressed`).
- More than one primary per view section.

## 2. Anatomy
1. Container: `.btn`, `--r-button`, min-height from the size.
2. Optional leading icon (20px, `aria-hidden`).
3. Label: `text-label` (13px/700), sentence case.
4. Optional trailing icon.
5. Loading: spinner replaces the leading icon; label changes to the in-progress verb.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Primary | `.btn` | The single most important action in a section (Buy now, Place order). |
| Secondary | `.btn .btn-secondary` | Paired with primary (Add to cart next to Buy now). |
| Outline | `.btn .btn-outline` | Lower emphasis brand action (Follow shop, Chat). |
| Ghost | `.btn .btn-ghost` | Tertiary or toolbar actions; inside dense lists. |
| Neutral | `.btn .btn-neutral` | Cancel / dismiss, filters toolbar; not brand-coloured. |
| Danger | `.btn .btn-danger` | Destructive and irreversible (Delete listing, Suspend shop). |
| Inverse | `.btn .btn-inverse` inside `.on-inverse` | On `--surface-inverse` (promo strips, toasts). |
| sm | `.btn-sm` | 36px visual height, 44px hit area via `::after`. Dense tables, cards. |
| md (default) | — | 44px. Most buttons. |
| lg | `.btn-lg` | 48px, 14px label. Primary actions on phone (sticky bars, checkout). |
| Full width | `.btn-block` | Phone CTAs and dialog footers; drop it at `md:` with `md:w-auto`. |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | rendered |
| Focus-visible | rendered |
| Disabled | rendered |
| Loading | rendered |
| Error | n/a: Buttons have no error state; show the error next to the form or as a Banner. |
| Selected | n/a: Use Chip or SegmentedControl for selectable options. |
| Empty | n/a: A button always has a label. |
| Skeleton | n/a: Use a Skeleton block with the button size while the surrounding card loads. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Primary actions are `btn-lg` and often `btn-block` inside a StickyActionBar or dialog footer. |
| Tablet (md, 768px+) | Buttons size to content (`md:w-auto`); dialog footers become a right-aligned row. |
| Desktop (lg, 1024px+) | Same as tablet. Hover styles apply only on pointer devices (`@media (hover:hover)`). |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| variant | `primary` \| `secondary` \| `outline` \| `ghost` \| `neutral` \| `danger` \| `inverse` | `primary` | Maps to `.btn-{variant}`. |
| size | `sm` \| `md` \| `lg` | `md` | sm keeps a 44px hit area. |
| block | boolean | false | Full width; combine with responsive `md:w-auto`. |
| icon / iconEnd | icon name | — | Lucide sprite id. |
| loading | boolean | false | Sets `aria-busy` + `aria-disabled`, shows spinner; keep the button focusable. |
| disabled | boolean | false | Native `disabled`. Prefer explaining why instead of disabling. |
| type | `button` \| `submit` | `button` | Always explicit. |
| href | string | — | Renders `` for navigation that must look like a button. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Native `` (or `` when it navigates). |
| Accessible name | Visible label. If the label changes while loading, the new label is the name. |
| Keyboard | Enter and Space activate (native). |
| Focus management | 3px `--ring` outline with 2px offset; `--ring-inverse` inside `.on-inverse`. |
| ARIA | `aria-busy="true"` + `aria-disabled="true"` while loading (stays focusable so focus is not lost). |
| Touch target | md 44px, lg 48px, sm 36px visual with a 44px `::after` hit area. |
| Reduced motion | Spinner rotation and colour transitions collapse under reduced motion. |
| Announcements | Result of the action is announced by a Toast (polite) or inline error, not by the button. |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--brand-50`, `--brand-800`, `--brand-950`, `--danger`, `--danger-hover`, `--danger-pressed`, `--dur`, `--ease-out`, `--foreground`, `--foreground-inverse`, `--fs-body`, `--fs-eyebrow`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-button`, `--r-panel`, `--ring`, `--surface`, `--surface-inverse`, `--surface-muted`, `--touch-min`, `--touch-primary`, `currentColor (icons)`

## 9. Content rules
- Verb first, sentence case: “Add to cart”, “Place order”, “Request changes”.
- Max ~20 characters on phone; Filipino copy runs ~30% longer, so never fix widths.
- Loading label uses the progressive verb: “Placing order…”.
- Destructive labels name the object: “Delete listing”, not “OK”.

## 10. Do / Don't
**Do**
- One primary per section; pair with secondary.
- Use `btn-lg` + `btn-block` for the phone CTA.
- Keep a loading button focusable with `aria-disabled`.

**Don't**
- Don’t use `` or a link for an action.
- Don’t disable “Place order” without saying what is missing.
- Don’t put two danger buttons side by side.

## 11. HTML usage
```html
<button type="button" class="btn btn-lg"><svg class="icon" aria-hidden="true"><use href="#i-shopping-cart"/></svg><span>Add to cart</span></button>
```

## 12. Test notes
- Computed height ≥ 44px (md), ≥ 48px (lg); sm hit area ≥ 44px.
- Focus ring visible on every variant in both brands, including inverse.
- Loading button keeps focus and is announced as busy.
- Label wraps or truncates without overflowing at 360px with Filipino copy.
