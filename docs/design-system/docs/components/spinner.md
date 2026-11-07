# Spinner

Feedback · Phase 2 · Live sheet: `styleguide/components/spinner.html`

## 1. Purpose
Indeterminate progress for short waits where layout is unknown (payment redirect, infinite scroll).

**Use when**
- Waits of unknown layout.

**Don't use when**
- Page loads with known layout (Skeleton).

## 2. Anatomy
1. `role=status` wrapper.
2. 3px ring in `currentColor` with one transparent side.
3. Visible label.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Block | `spinnerBlock()` |  |
| Inline | `spinner()` inside buttons |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: n/a |
| Pressed | n/a: n/a |
| Focus-visible | n/a: n/a |
| Disabled | n/a: n/a |
| Loading | rendered |
| Error | n/a: Replace with ErrorState. |
| Selected | n/a: n/a |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Centered. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| label | string | “Loading” | Always visible or sr-only. |
| size | class | `size-8` |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `status`. |
| Accessible name | Label text. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Rotation stops under reduced motion; label still conveys progress. |
| Announcements | Label announced once. |

## 8. Tokens used
`--fs-body-sm`, `--muted-foreground`, `--primary`

## 9. Content rules
- Say what is happening: “Redirecting to GCash…”.

## 10. Do / Don't
**Do**
- Show after 300ms delay.

**Don't**
- Don’t spin forever; time out into ErrorState.

## 11. HTML usage
```html
<div role="status" class="flex flex-col items-center gap-2 text-primary"><span class="inline-block animate-spin rounded-full border-[3px] border-current border-r-transparent size-8" aria-hidden="true"></span><span class="text-body-sm text-muted-foreground">Redirecting to GCash…</span></div>
```

## 12. Test notes
- Announced once.
- Static under reduced motion.
