# ShopSettings sections

Seller · Phase 4 · Live sheet: `styleguide/components/shop-settings.html`

## 1. Purpose
Shop profile, status switches (vacation mode, auto-reply) and shipping channels as panels.

**Use when**
- Seller settings.

**Don't use when**
- Account settings (buyer).

## 2. Anatomy
1. Profile panel (name, description).
2. Status panel (Switches apply instantly).
3. Shipping channels (checkboxes, saved with the page).

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `shopSettings()` |  |

## 4. States
| State | Status |
|---|---|
| Default | n/a: See example. |
| Hover (pointer only) | n/a: Controls. |
| Pressed | n/a: n/a |
| Focus-visible | n/a: Controls. |
| Disabled | n/a: n/a |
| Loading | n/a: n/a |
| Error | n/a: Field errors. |
| Selected | n/a: n/a |
| Empty | n/a: n/a |
| Skeleton | n/a: Panel skeletons. |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Stacked panels. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Max 48rem column. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| shop | ShopSettings | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | — |
| Accessible name | — |
| Keyboard | — |
| Focus management | Switch saves → Toast; errors revert the switch. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--border-control`, `--danger`, `--dur`, `--ease-out`, `--elevation-popover`, `--focus-ring-color`, `--focus-ring-error`, `--focus-ring-offset`, `--focus-ring-width`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-h4`, `--fs-input`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-hover`, `--r-field`, `--r-panel`, `--subtle-foreground`, `--surface`, `--surface-muted`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- Explain consequences (vacation mode).

## 10. Do / Don't
**Do**
- Separate instant switches from saved fields.

**Don't**
- Don’t mix both in one Save.

## 11. HTML usage
```html
<div class="grid gap-4">
  <section class="panel" aria-labelledby="ss-profile">
    <header class="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
      <div>
        <h2 id="ss-profile" class="text-h4">Shop profile</h2>
      </div>
    </header>
    <div class="grid gap-4 p-4">
      <div class="grid gap-1.5">
        <div class="flex items-baseline justify-between gap-2">
          <label for="ss-name" class="text-label text-foreground">Shop name<span class="text-danger" aria-hidden="true"> *</span></label>
        </div>
        <input id="ss-name" type="text" class="field" value="Barakah Pantry" aria-describedby="ss-name-help ss-name-error">
        <div class="flex gap-2">
          <p id="ss-name-help" class="text-body-sm text-muted-foreground">Change once every 30 days.</p>
        </div>
        <p id="ss-name-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
      </div>
      <div class="grid gap-1.5">
        <div class="flex items-baseline justify-between gap-2">
          <label for="ss-bio" class="text-label text-foreground">Shop description <span class="font-normal text-muted-foreground">(optional)</span></label>
        </div>
        <textarea id="ss-bio" rows="3" class="field" aria-describedby="ss-bio-error ss-bio-count" data-ds-counter="ss-bio-count">Homemade kakanin from Quezon City. Fresh every morning since 2015.</textarea>
        <div class="flex gap-2">
          <p id="ss-bio-count" class="ml-auto shrink-0 text-body-sm text-muted-foreground tabular">64 / 500</p>
        </div>
        <p id="ss-bio-error" class="flex items-start gap-1 text-body-sm font-bold text-danger" hidden><svg class="icon mt-px size-4" aria-hidden="true"><use href="#i-circle-alert"/></svg><span>Please fill in this field.</span></p>
      </div>
    </div>
  </section>
  <section class="panel" aria-labelledby="ss-status">
    <header class="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
      <div>
        <h2 id="ss-status" class="text-h4">Shop status</h2>
      </div>
    </header>
    <div class="grid gap-4 p-4">
      <label for="ss-vac" class="flex min-h-touch items-center justify-between gap-4 py-2"><span class="grid gap-0.5"><span class="text-body">Vacation mode</span><span class="text-body-sm text-muted-foreground">Buyers can browse but cannot order. Pending orders must still ship.</span></span><input id="ss-vac" type="checkbox" role="switch" class="relative h-7 w-12 shrink-0 cursor-pointer appearance-none rounded-full bg-border-control transition-colors duration-token before:absolute before:left-1 before:top-1 before:size-5 before:rounded-full before:bg-surface before:shadow-popover before:transition-transform before:duration-token checked:bg-primary checked:before:translate-x-5 hover:bg-muted-foreground checked:hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"></label>
      <label for="ss-chat" class="flex min-h-touch items-center justify-between gap-4 py-2"><span class="grid gap-0.5"><span class="text-body">Auto-reply in chat</span><span class="text-body-sm text-muted-foreground">Sends your greeting when a buyer starts a chat.</span></span><input id="ss-chat" type="checkbox" role="switch" class="relative h-7 w-12 shrink-0 cursor-pointer appearance-none rounded-full bg-border-control transition-colors duration-token before:absolute before:left-1 before:top-1 before:size-5 before:rounded-full before:bg-surface before:shadow-popover before:transition-transform before:duration-token checked:bg-primary checked:before:translate-x-5 hover:bg-muted-foreground checked:hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60" checked></label>
    </div>
  </section>
  <section class="panel" aria-labelledby="ss-ship">
    <header class="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
      <div>
        <h2 id="ss-ship" class="text-h4">Shipping channels</h2>
      </div>
    </header>
    <div class="grid gap-4 p-4">
      <label for="ss-s1" class="flex min-h-touch items-start gap-3 py-2.5"><input id="ss-s1" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary" checked aria-describedby="ss-s1-desc"><span class="grid gap-0.5"><span class="text-body">Standard Delivery</span><span id="ss-s1-desc" class="text-body-sm text-muted-foreground">Nationwide, 2–5 days.</span></span></label>
      <label for="ss-s2" class="flex min-h-touch items-start gap-3 py-2.5"><input id="ss-s2" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary" checked aria-describedby="ss-s2-desc"><span class="grid gap-0.5"><span class="text-body">Express (Metro Manila)</span><span id="ss-s2-desc" class="text-body-sm text-muted-foreground">Next-day.</span></span></label>
      <label for="ss-s3" class="flex min-h-touch items-start gap-3 py-2.5"><input id="ss-s3" type="checkbox" class="mt-0.5 size-5 shrink-0 accent-primary" aria-describedby="ss-s3-desc"><span class="grid gap-0.5"><span class="text-body">Cash on Delivery</span><span id="ss-s3-desc" class="text-body-sm text-muted-foreground">Up to ₱5,000 per order.</span></span></label>
    </div>
  </section>
</div>
```

## 12. Test notes
- Switch rows 44px.
