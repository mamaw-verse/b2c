# AuditLogList

Moderation · Phase 4 · Live sheet: `styleguide/components/audit-log.html`

## 1. Purpose
Chronological who/what/when of decisions, auto-flags and seller edits.

**Use when**
- ModerationDetailPane history.

**Don't use when**
- Buyer-facing timelines (Timeline).

## 2. Anatomy
1. Avatar (System = shield tile).
2. “{actor} · {action}” + detail + ``.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `auditLog()` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: n/a |
| Pressed | n/a: n/a |
| Focus-visible | n/a: n/a |
| Disabled | n/a: n/a |
| Loading | rendered |
| Error | n/a: n/a |
| Selected | n/a: n/a |
| Empty | rendered |
| Skeleton | n/a: Row skeletons. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Same at all sizes. |
| Tablet (md, 768px+) |  |
| Desktop (lg, 1024px+) |  |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| entries | AuditEntry[] | — | {actor, action, detail, at} |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Ordered list; times are ``. |
| Accessible name | Actor names via avatar label. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--brand-100`, `--brand-800`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--muted-foreground`, `--r-badge`, `--success`, `--success-soft`, `--surface-muted`

## 9. Content rules
- Newest first; “System” for auto-flags.

## 10. Do / Don't
**Do**
- Quote the sent reason.

**Don't**
- Don’t expose internal moderator notes to sellers.

## 11. HTML usage
```html
<ol class="grid gap-4" aria-label="Audit log">
  <li class="flex gap-3"><span class="relative inline-grid shrink-0 place-items-center font-bold rounded-full size-8 text-caption bg-success-soft text-success" aria-hidden="true"><span aria-hidden="true">JD</span></span>
    <div class="grid min-w-0 flex-1 gap-0.5">
      <p class="text-body"><span class="font-bold">Jun Dela Cruz</span> · Requested changes</p>
      <p class="text-body-sm text-muted-foreground">Reason: Misleading photos. “Remove brand logo from photo 2.”</p>
      <p class="text-caption text-muted-foreground"><time>Oct 30, 4:12 PM</time></p>
    </div>
  </li>
  <li class="flex gap-3"><span class="relative inline-grid shrink-0 place-items-center font-bold rounded-full size-8 text-caption bg-brand-100 text-brand-800" aria-hidden="true"><span aria-hidden="true">S</span></span>
    <div class="grid min-w-0 flex-1 gap-0.5">
      <p class="text-body"><span class="font-bold">System</span> · Auto-flagged</p>
      <p class="text-body-sm text-muted-foreground">12 reports in 3h · keyword “pork fat” + “halal” without a certificate</p>
      <p class="text-caption text-muted-foreground"><time>Oct 30, 1:05 PM</time></p>
    </div>
  </li>
  <li class="flex gap-3"><span class="relative inline-grid shrink-0 place-items-center font-bold rounded-full size-8 text-caption bg-success-soft text-success" aria-hidden="true"><span aria-hidden="true">S·</span></span>
    <div class="grid min-w-0 flex-1 gap-0.5">
      <p class="text-body"><span class="font-bold">Seller · Pantry Direct PH</span> · Edited listing</p>
      <p class="text-body-sm text-muted-foreground">Title and 2 photos changed</p>
      <p class="text-caption text-muted-foreground"><time>Oct 29, 9:40 AM</time></p>
    </div>
  </li>
</ol>
```

## 12. Test notes
- Readable at 360px without horizontal scroll.
