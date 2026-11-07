# ChatBubble

Chat & notifications · Phase 3 · Live sheet: `styleguide/components/chat-bubble.html`

## 1. Purpose
A single text message: incoming (surface) or outgoing (primary), with time and delivery status.

**Use when**
- ChatThread.

**Don't use when**
- System notices (centered caption).

## 2. Anatomy
1. Bubble max 80% width; tail corner squared.
2. Meta: time + status icon + text (Sent / Read / Not sent + Retry).

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Incoming | default |  |
| Outgoing | `out` | White on primary. |
| Failed | `failed` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: n/a |
| Pressed | n/a: Long-press menu (copy, report) in ports. |
| Focus-visible | n/a: Retry button. |
| Disabled | n/a: n/a |
| Loading | rendered |
| Error | rendered |
| Selected | rendered |
| Empty | n/a: n/a |
| Skeleton | n/a: Rounded block. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | 80% max width. |
| Tablet (md, 768px+) | 70%. |
| Desktop (lg, 1024px+) | 60% in wide threads. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| text | string | — | Escaped; links auto-detected in ports. |
| out | boolean | false |  |
| status | sent\|read\|failed | sent |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | List item. |
| Accessible name | sr-only sender prefix. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | Status as text, not only icon. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--danger`, `--foreground`, `--fs-body`, `--fs-caption`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--r-badge`, `--r-panel`, `--ring`, `--surface`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Preserve line breaks; Taglish is common.

## 10. Do / Don't
**Do**
- Show time on every bubble or group.

**Don't**
- Don’t rely on colour for direction (alignment + prefix).

## 11. HTML usage
```html
<ol class="grid gap-3">
  <li class="flex justify-end">
    <div class="grid max-w-[80%] gap-1 justify-items-end">
      <p class="rounded-panel px-3 py-2 text-body rounded-br-badge bg-primary text-primary-foreground" data-ds-bubble-text>Hi! Available pa po ba ang Ajwa 500g?</p>
      <p class="flex items-center gap-1 text-caption text-muted-foreground"><span class="sr-only">You, </span><time>9:41 AM</time><svg class="icon size-3.5 text-primary" aria-hidden="true"><use href="#i-check-check"/></svg><span>Read</span></p>
    </div>
  </li>
  <li class="flex justify-start">
    <div class="grid max-w-[80%] gap-1 ">
      <p class="rounded-panel px-3 py-2 text-body rounded-bl-badge border border-border bg-surface text-foreground" data-ds-bubble-text>Yes po, ship today!</p>
      <p class="flex items-center gap-1 text-caption text-muted-foreground"><span class="sr-only">Seller, </span><time>9:41 AM</time></p>
    </div>
  </li>
</ol>
```

## 12. Test notes
- White on primary ≥ 4.5:1 in both brands.
