# Sidebar

Navigation · Phase 2 · Live sheet: `styleguide/components/sidebar.html`

## 1. Purpose
Section navigation for account, seller and admin shells: drawer on phone, collapsed icon rail on tablet, full sidebar on desktop.

**Use when**
- Account, Seller Centre, Admin.

**Don't use when**
- Storefront.

## 2. Anatomy
1. `nav` with heading (desktop).
2. Items: icon + label + optional count badge, 44px.
3. Active: `--primary-soft` bg, `aria-current`.
4. Rail: labels become sr-only; `title` hint.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Responsive | `mode: responsive` | Rail at md, full at lg. |
| Full | `mode: full` | Inside Drawer. |
| Rail | `mode: rail` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: Navigates. |
| Focus-visible | rendered |
| Disabled | n/a: n/a |
| Loading | n/a: n/a |
| Error | n/a: n/a |
| Selected | rendered |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Hidden; opened as a Drawer from the shell header. |
| Tablet (md, 768px+) | Collapsed 64px icon rail (labels sr-only, `title` tooltip). |
| Desktop (lg, 1024px+) | Full `--sidebar-w` (220px) with labels and heading. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| items | [icon, label, count?][] | — |  |
| active | string | — |  |
| mode | `responsive` \| `full` \| `rail` | `responsive` |  |
| heading | string | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `nav` with label. |
| Accessible name | Visible labels (sr-only in rail). |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | `aria-current="page"`. |
| Touch target | 44px rows. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-width`, `--foreground`, `--fs-caption`, `--fs-eyebrow`, `--fs-label`, `--muted-foreground`, `--primary-foreground`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--sale`, `--surface-muted`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Same order across tiers.

## 10. Do / Don't
**Do**
- Keep ≤ 9 items; group with headings.

**Don't**
- Don’t hide labels on desktop.

## 11. HTML usage
```html
<div class="max-w-[var(--sidebar-w)]">
  <nav aria-label="Account" class="flex flex-col gap-1">
    <p class="px-3 pb-1 pt-2 text-eyebrow uppercase text-muted-foreground ">My account</p>
    <ul class="grid gap-0.5">
      <li><a href="#" class="relative flex min-h-touch items-center gap-3 rounded-button px-3 text-label text-muted-foreground hover:bg-surface-muted hover:text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-user"/></svg><span class="flex-1">My account</span></a></li>
      <li><a href="#" class="relative flex min-h-touch items-center gap-3 rounded-button px-3 text-label bg-primary-soft text-primary-soft-foreground" aria-current="page"><svg class="icon" aria-hidden="true"><use href="#i-package"/></svg><span class="flex-1">My purchases</span><span class="badge badge-sale-solid">3</span></a></li>
      <li><a href="#" class="relative flex min-h-touch items-center gap-3 rounded-button px-3 text-label text-muted-foreground hover:bg-surface-muted hover:text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-heart"/></svg><span class="flex-1">Likes</span></a></li>
      <li><a href="#" class="relative flex min-h-touch items-center gap-3 rounded-button px-3 text-label text-muted-foreground hover:bg-surface-muted hover:text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-ticket"/></svg><span class="flex-1">Vouchers</span></a></li>
      <li><a href="#" class="relative flex min-h-touch items-center gap-3 rounded-button px-3 text-label text-muted-foreground hover:bg-surface-muted hover:text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-map-pin"/></svg><span class="flex-1">Addresses</span></a></li>
      <li><a href="#" class="relative flex min-h-touch items-center gap-3 rounded-button px-3 text-label text-muted-foreground hover:bg-surface-muted hover:text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-bell"/></svg><span class="flex-1">Notifications</span></a></li>
      <li><a href="#" class="relative flex min-h-touch items-center gap-3 rounded-button px-3 text-label text-muted-foreground hover:bg-surface-muted hover:text-foreground"><svg class="icon" aria-hidden="true"><use href="#i-settings"/></svg><span class="flex-1">Settings</span></a></li>
    </ul>
  </nav>
</div>
```

## 12. Test notes
- Rail items have accessible names.
- Badges visible in rail.
