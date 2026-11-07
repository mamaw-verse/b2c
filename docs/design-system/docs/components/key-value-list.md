# KeyValueList

Data display · Phase 2 · Live sheet: `styleguide/components/key-value-list.html`

## 1. Purpose
Label/value pairs for order details, product specs, applicant info.

**Use when**
- Read-only structured data.

**Don't use when**
- Editable forms.

## 2. Anatomy
1. `dl` with `dt` muted label and `dd` value.
2. Two-column grid on wide screens.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Single column | default |  |
| Two columns | `cols: 2` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: n/a |
| Pressed | n/a: n/a |
| Focus-visible | n/a: n/a |
| Disabled | n/a: n/a |
| Loading | n/a: Skeleton. |
| Error | n/a: n/a |
| Selected | n/a: n/a |
| Empty | rendered |
| Skeleton | rendered |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Label 40% / value. |
| Tablet (md, 768px+) | Two columns optional. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| items | [label, value][] | — |  |
| cols | 1 \| 2 | 1 |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Description list. |
| Accessible name | — |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--foreground`, `--fs-body`, `--fs-body-sm`, `--muted-foreground`, `--r-badge`, `--surface-muted`

## 9. Content rules
- Empty values say “Not provided”.

## 10. Do / Don't
**Do**
- Allow values to wrap.

**Don't**
- Don’t truncate IDs.

## 11. HTML usage
```html
<dl class="grid gap-x-6 gap-y-3 sm:grid-cols-2">
  <div class="grid grid-cols-[minmax(7rem,40%)_1fr] gap-3">
    <dt class="text-body-sm text-muted-foreground">Order ID</dt>
    <dd class="text-body text-foreground"><span class="tabular">#240311-0042</span></dd>
  </div>
  <div class="grid grid-cols-[minmax(7rem,40%)_1fr] gap-3">
    <dt class="text-body-sm text-muted-foreground">Placed</dt>
    <dd class="text-body text-foreground">Oct 28, 2026 · 9:14 AM</dd>
  </div>
  <div class="grid grid-cols-[minmax(7rem,40%)_1fr] gap-3">
    <dt class="text-body-sm text-muted-foreground">Payment</dt>
    <dd class="text-body text-foreground">GCash</dd>
  </div>
  <div class="grid grid-cols-[minmax(7rem,40%)_1fr] gap-3">
    <dt class="text-body-sm text-muted-foreground">Shipping</dt>
    <dd class="text-body text-foreground">Standard · SPX0042910</dd>
  </div>
</dl>
```

## 12. Test notes
- Long values wrap at 360px.
