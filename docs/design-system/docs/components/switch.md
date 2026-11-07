# Switch

Forms · Phase 2 · Live sheet: `styleguide/components/switch.html`

## 1. Purpose
Immediate on/off setting (notifications, vacation mode, show sold count).

**Use when**
- The change applies instantly without Save.

**Don't use when**
- Choices submitted with a form (Checkbox).

## 2. Anatomy
1. Label + optional description.
2. Native checkbox `role=switch`, 48×28 track, 20px thumb.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `switchCtl()` |  |
| With description | `desc` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | rendered |
| Pressed | n/a: Native. |
| Focus-visible | rendered |
| Disabled | rendered |
| Loading | n/a: If saving fails, revert and show a Toast. |
| Error | n/a: Revert + Toast. |
| Selected | rendered |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Label left, switch right, full row 44px. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| checked | boolean | false |  |
| label / desc | string |  |  |
| onChange | fn | — | Persist immediately. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `role="switch"` on a native checkbox (announced on/off). |
| Accessible name | Label. |
| Keyboard | Space. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | Whole label row 44px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | State change announced natively; save confirmation via Toast. |

## 8. Tokens used
`--border-control`, `--dur`, `--ease-out`, `--elevation-popover`, `--fs-body`, `--fs-body-sm`, `--muted-foreground`, `--primary`, `--primary-hover`, `--ring`, `--surface`, `--touch-min`

## 9. Content rules
- Label the setting, not the action: “Vacation mode”.

## 10. Do / Don't
**Do**
- Apply immediately.

**Don't**
- Don’t pair with a Save button.

## 11. HTML usage
```html
<label for="sw1" class="flex min-h-touch items-center justify-between gap-4 py-2"><span class="grid gap-0.5"><span class="text-body">Vacation mode</span><span class="text-body-sm text-muted-foreground">Buyers can browse but cannot order.</span></span><input id="sw1" type="checkbox" role="switch" class="relative h-7 w-12 shrink-0 cursor-pointer appearance-none rounded-full bg-border-control transition-colors duration-token before:absolute before:left-1 before:top-1 before:size-5 before:rounded-full before:bg-surface before:shadow-popover before:transition-transform before:duration-token checked:bg-primary checked:before:translate-x-5 hover:bg-muted-foreground checked:hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60" checked></label>
```

## 12. Test notes
- Track off colour `--border-control` ≥ 3:1 against surface.
- Thumb moves under reduced motion without animation.
