# SiteFooter

Navigation · Phase 3 · Live sheet: `styleguide/components/footer.html`

## 1. Purpose
Storefront footer: trust strip (halal verification promise, accepted payments, couriers), five link groups + brand block with tagline/socials/contact, and a legal bar. All copy comes from config — the brand name is never hard-coded.

**Use when**
- Every public storefront page.

**Don't use when**
- Seller/admin shells (workspace chrome).

## 2. Anatomy
1. Trust strip: “Every halal claim is verified by {{BRAND_NAME}}” + payment chips (COD, GCash, Maya, cards, bank transfer) + courier chips.
2. Brand column: name, one-line tagline, socials, support email + hours.
3. Link groups (flex column, `--space-3` between links): Shop, Support, Halal & trust, Sell, Company.
4. Legal bar: © year + brand, DTI/SEC registration; language/currency only when multi-currency exists.
5. Surface: `bg-surface-subtle` (one tone below the page), `border-t`, container-aligned.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `foot` (public shell) |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Links only (`hover:text-primary`). |
| Pressed | n/a: n/a |
| Focus-visible | n/a: Shared 2px ring. |
| Disabled | n/a: n/a |
| Loading | n/a: n/a |
| Error | n/a: n/a |
| Selected | n/a: n/a |
| Empty | n/a: n/a |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Groups become disclosures (details/summary; the port uses `button` + `aria-expanded`). Payments/couriers wrap; legal bar stacks; bottom padding clears the tab bar. |
| Tablet (md, 768px+) | Two columns of groups. |
| Desktop (lg, 1024px+) | Brand block + five columns in one row. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| marketplace | config(`marketplace`) | — | Tagline, support email/hours, registration, payments, couriers, socials, link groups. `{brand}` resolves to the app name. |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | `contentinfo` landmark; each group is a labelled `nav`. |
| Accessible name | Headings label the navs; payment/courier names are sr-only labels on plain text chips. |
| Keyboard | — |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | `aria-expanded` on the mobile group buttons. |
| Touch target | Group toggles 44px; links 36px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--container-max`, `--dur`, `--ease-out`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-width`, `--foreground`, `--fs-body-sm`, `--fs-caption`, `--fs-label`, `--gutter`, `--halal`, `--muted-foreground`, `--primary`, `--r-badge`, `--surface`, `--surface-subtle`, `--touch-min`, `currentColor (icons)`

## 9. Content rules
- One-line tagline from config.
- Legal bar: © {year} {brand} + business registration.

## 10. Do / Don't
**Do**
- Keep every link reachable by keyboard.

**Don't**
- Don’t hardcode the brand name, contact details or registration number.

## 11. HTML usage
```html
<footer class="border-t border-border bg-surface-subtle pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom,0px))] md:pb-0">
  <div class="mx-auto max-w-container px-gutter">
    <div class="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border py-4">
      <p class="flex items-center gap-2 text-body-sm font-medium text-foreground"><svg class="icon size-4 shrink-0 text-halal" aria-hidden="true"><use href="#i-shield-check"/></svg>Every halal claim is verified by {{BRAND_NAME}}</p>
      <p class="flex flex-wrap items-center gap-1.5 text-caption text-muted-foreground"><svg class="icon size-4" aria-hidden="true"><use href="#i-wallet"/></svg><span class="sr-only">Accepted payments:</span><span class="rounded-badge border border-border bg-surface px-1.5 py-0.5">COD</span><span class="rounded-badge border border-border bg-surface px-1.5 py-0.5">GCash</span><span class="rounded-badge border border-border bg-surface px-1.5 py-0.5">Maya</span><span class="rounded-badge border border-border bg-surface px-1.5 py-0.5">Cards</span><span class="rounded-badge border border-border bg-surface px-1.5 py-0.5">Bank transfer</span></p>
      <p class="flex flex-wrap items-center gap-1.5 text-caption text-muted-foreground"><svg class="icon size-4" aria-hidden="true"><use href="#i-truck"/></svg><span class="sr-only">Delivery partners:</span><span class="rounded-badge border border-border bg-surface px-1.5 py-0.5">J&T Express</span><span class="rounded-badge border border-border bg-surface px-1.5 py-0.5">Lalamove</span><span class="rounded-badge border border-border bg-surface px-1.5 py-0.5">Ninja Van</span></p>
    </div>
    <div class="grid gap-y-1 py-4 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-8 sm:py-8 lg:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))]">
      <div class="flex flex-col gap-3">
        <p class="text-label text-foreground">{{BRAND_NAME}}</p>
        <p class="max-w-xs text-body-sm text-muted-foreground">Every halal claim verified, delivered across the Philippines.</p>
        <p class="flex items-start gap-2 text-body-sm text-muted-foreground"><svg class="icon mt-0.5 size-4 shrink-0" aria-hidden="true"><use href="#i-mail"/></svg><span><a href="mailto:support@example.com" class="underline underline-offset-2 hover:text-primary">support@example.com</a><br>Mon–Sat, 9:00–18:00 (PHT)</span></p>
      </div>
      <nav aria-label="Shop" class="sm:flex sm:flex-col sm:gap-3">
        <details class="group sm:hidden">
          <summary class="flex min-h-touch w-full cursor-pointer list-none items-center justify-between gap-2 text-left text-label text-foreground [&::-webkit-details-marker]:hidden">Shop<svg class="icon shrink-0 text-muted-foreground transition-transform duration-token group-open:rotate-180" aria-hidden="true"><use href="#i-chevron-down"/></svg></summary>
          <ul class="flex flex-col gap-3 pb-3">
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Categories</a></li>
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Halal Food</a></li>
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Meat & Seafood</a></li>
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Dates & Sweets</a></li>
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Modest Fashion</a></li>
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Prayer Essentials</a></li>
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Books & Quran</a></li>
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Vouchers</a></li>
          </ul>
        </details>
        <p class="hidden text-label text-foreground sm:block">Shop</p>
        <ul class="hidden flex-col gap-3 sm:flex">
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Categories</a></li>
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Halal Food</a></li>
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Meat & Seafood</a></li>
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Dates & Sweets</a></li>
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Modest Fashion</a></li>
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Prayer Essentials</a></li>
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Books & Quran</a></li>
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Vouchers</a></li>
        </ul>
      </nav>
      <nav aria-label="Support" class="sm:flex sm:flex-col sm:gap-3">
        <details class="group sm:hidden">
          <summary class="flex min-h-touch w-full cursor-pointer list-none items-center justify-between gap-2 text-left text-label text-foreground [&::-webkit-details-marker]:hidden">Support<svg class="icon shrink-0 text-muted-foreground transition-transform duration-token group-open:rotate-180" aria-hidden="true"><use href="#i-chevron-down"/></svg></summary>
          <ul class="flex flex-col gap-3 pb-3">
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Help centre</a></li>
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Track order</a></li>
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Returns & refunds</a></li>
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Contact us</a></li>
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Report a listing</a></li>
          </ul>
        </details>
        <p class="hidden text-label text-foreground sm:block">Support</p>
        <ul class="hidden flex-col gap-3 sm:flex">
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Help centre</a></li>
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Track order</a></li>
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Returns & refunds</a></li>
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Contact us</a></li>
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Report a listing</a></li>
        </ul>
      </nav>
      <nav aria-label="Halal & trust" class="sm:flex sm:flex-col sm:gap-3">
        <details class="group sm:hidden">
          <summary class="flex min-h-touch w-full cursor-pointer list-none items-center justify-between gap-2 text-left text-label text-foreground [&::-webkit-details-marker]:hidden">Halal & trust<svg class="icon shrink-0 text-muted-foreground transition-transform duration-token group-open:rotate-180" aria-hidden="true"><use href="#i-chevron-down"/></svg></summary>
          <ul class="flex flex-col gap-3 pb-3">
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Halal verification policy</a></li>
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">How we verify sellers</a></li>
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Certifier list</a></li>
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Community review of religious items</a></li>
          </ul>
        </details>
        <p class="hidden text-label text-foreground sm:block">Halal & trust</p>
        <ul class="hidden flex-col gap-3 sm:flex">
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Halal verification policy</a></li>
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">How we verify sellers</a></li>
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Certifier list</a></li>
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Community review of religious items</a></li>
        </ul>
      </nav>
      <nav aria-label="Sell" class="sm:flex sm:flex-col sm:gap-3">
        <details class="group sm:hidden">
          <summary class="flex min-h-touch w-full cursor-pointer list-none items-center justify-between gap-2 text-left text-label text-foreground [&::-webkit-details-marker]:hidden">Sell<svg class="icon shrink-0 text-muted-foreground transition-transform duration-token group-open:rotate-180" aria-hidden="true"><use href="#i-chevron-down"/></svg></summary>
          <ul class="flex flex-col gap-3 pb-3">
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Sell on {{BRAND_NAME}}</a></li>
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Seller centre</a></li>
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Onboarding guide</a></li>
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Halal certification guide</a></li>
          </ul>
        </details>
        <p class="hidden text-label text-foreground sm:block">Sell</p>
        <ul class="hidden flex-col gap-3 sm:flex">
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Sell on {{BRAND_NAME}}</a></li>
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Seller centre</a></li>
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Onboarding guide</a></li>
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Halal certification guide</a></li>
        </ul>
      </nav>
      <nav aria-label="Company" class="sm:flex sm:flex-col sm:gap-3">
        <details class="group sm:hidden">
          <summary class="flex min-h-touch w-full cursor-pointer list-none items-center justify-between gap-2 text-left text-label text-foreground [&::-webkit-details-marker]:hidden">Company<svg class="icon shrink-0 text-muted-foreground transition-transform duration-token group-open:rotate-180" aria-hidden="true"><use href="#i-chevron-down"/></svg></summary>
          <ul class="flex flex-col gap-3 pb-3">
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">About</a></li>
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Terms</a></li>
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Privacy (Data Privacy Act notice)</a></li>
            <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Cookies</a></li>
          </ul>
        </details>
        <p class="hidden text-label text-foreground sm:block">Company</p>
        <ul class="hidden flex-col gap-3 sm:flex">
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">About</a></li>
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Terms</a></li>
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Privacy (Data Privacy Act notice)</a></li>
          <li><a href="#" class="inline-flex min-h-9 items-center text-muted-foreground hover:text-primary">Cookies</a></li>
        </ul>
      </nav>
    </div>
    <div class="flex flex-col gap-1 border-t border-border py-4 text-caption text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>© 2026 {{BRAND_NAME}}</p>
      <p>DTI Business Name Reg. No. 0000-0000</p>
    </div>
  </div>
</footer>
```

## 12. Test notes
- Accordion toggles below 640px; columns at ≥640px.
- Trust strip and legal bar render in both themes.
