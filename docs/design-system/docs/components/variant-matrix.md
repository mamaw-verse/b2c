# VariantMatrix editor

Seller · Phase 4 · Live sheet: `styleguide/components/variant-matrix.html`

## 1. Purpose
Define up to two variation types, then edit price, stock and SKU for every combination.

**Use when**
- Products with variations.

**Don't use when**
- Single SKU.

## 2. Anatomy
1. Option editors (value chips with remove + Add).
2. “Apply to all” row.
3. md+: table (row header = Color); phone: one card per combination.
4. Error message above the grid.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Default | `variantMatrix()` |  |

## 4. States
| State | Status |
|---|---|
| Default | n/a: See example. |
| Hover (pointer only) | n/a: Inputs. |
| Pressed | n/a: n/a |
| Focus-visible | n/a: Inputs. |
| Disabled | n/a: n/a |
| Loading | n/a: n/a |
| Error | rendered |
| Selected | n/a: n/a |
| Empty | n/a: No options yet: show “Add variation”. |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | Cards per combination (no horizontal table scroll). |
| Tablet (md, 768px+) | Table. |
| Desktop (lg, 1024px+) | Table. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| options | {name, values[]}[] | — | Max 2. |
| rows | {combo, price, stock, sku}[] | — |  |
| onApplyAll | fn | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Table with row headers; inputs labelled “Price, Premium 500g”. |
| Accessible name | — |
| Keyboard | Tab across inputs. |
| Focus management | Follows DOM order; no focus is moved programmatically. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | None (static content). |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--danger`, `--dur`, `--ease-out`, `--foreground`, `--fs-body`, `--fs-body-sm`, `--fs-input`, `--fs-label`, `--fs-th`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-button`, `--r-card`, `--r-field`, `--r-panel`, `--ring`, `--subtle-foreground`, `--surface`, `--surface-muted`, `--surface-subtle`, `--touch-min`, `--touch-primary`, `currentColor (icons)`

## 9. Content rules
- Option names ≤ 20 chars.

## 10. Do / Don't
**Do**
- Bulk apply.

**Don't**
- Don’t allow duplicate values.

## 11. HTML usage
```html
<div class="grid gap-4">
  <div class="grid gap-4 md:grid-cols-2">
    <div class="grid gap-2">
      <p class="text-label">Variation 1: Grade</p>
      <ul class="flex flex-wrap gap-2">
        <li class="inline-flex items-center gap-1 rounded-button border border-border-control bg-surface pl-3 text-body">Premium
          <button type="button" class="btn btn-ghost btn-icon btn-sm text-muted-foreground" aria-label="Remove Premium"><svg class="icon size-4" aria-hidden="true"><use href="#i-x"/></svg></button>
        </li>
        <li class="inline-flex items-center gap-1 rounded-button border border-border-control bg-surface pl-3 text-body">Standard
          <button type="button" class="btn btn-ghost btn-icon btn-sm text-muted-foreground" aria-label="Remove Standard"><svg class="icon size-4" aria-hidden="true"><use href="#i-x"/></svg></button>
        </li>
        <li>
          <button type="button" class="btn btn-outline btn-sm"><svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg><span>Add</span></button>
        </li>
      </ul>
    </div>
    <div class="grid gap-2">
      <p class="text-label">Variation 2: Weight</p>
      <ul class="flex flex-wrap gap-2">
        <li class="inline-flex items-center gap-1 rounded-button border border-border-control bg-surface pl-3 text-body">250g
          <button type="button" class="btn btn-ghost btn-icon btn-sm text-muted-foreground" aria-label="Remove 250g"><svg class="icon size-4" aria-hidden="true"><use href="#i-x"/></svg></button>
        </li>
        <li class="inline-flex items-center gap-1 rounded-button border border-border-control bg-surface pl-3 text-body">500g
          <button type="button" class="btn btn-ghost btn-icon btn-sm text-muted-foreground" aria-label="Remove 500g"><svg class="icon size-4" aria-hidden="true"><use href="#i-x"/></svg></button>
        </li>
        <li>
          <button type="button" class="btn btn-outline btn-sm"><svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg><span>Add</span></button>
        </li>
      </ul>
    </div>
  </div>
  <div class="flex flex-wrap items-end gap-2 rounded-panel bg-surface-muted p-3">
    <p class="w-full text-label">Apply to all</p>
    <div class="min-w-28 flex-1">
      <label class="sr-only" for="vm-price-all">Price for all variations</label>
      <div class="relative"><span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">₱</span><input id="vm-price-all" inputmode="numeric" value="" class="field pl-7 tabular"></div>
    </div>
    <div class="min-w-28 flex-1">
      <label class="sr-only" for="vm-stock-all">Stock for all variations</label>
      <div class="relative"><input id="vm-stock-all" inputmode="numeric" value="" class="field tabular"></div>
    </div>
    <button type="button" class="btn btn-secondary"><span>Apply</span></button>
  </div>
  <div class="hidden overflow-x-auto rounded-panel border border-border md:block">
    <table class="w-full table-fixed text-body">
      <caption class="sr-only">Price and stock per variation</caption>
      <thead class="bg-surface-subtle">
        <tr>
          <th scope="col" class="px-3 py-2 text-left text-th uppercase text-muted-foreground ">Grade</th>
          <th scope="col" class="px-3 py-2 text-left text-th uppercase text-muted-foreground w-14">Weight</th>
          <th scope="col" class="px-3 py-2 text-left text-th uppercase text-muted-foreground w-36">Price</th>
          <th scope="col" class="px-3 py-2 text-left text-th uppercase text-muted-foreground w-32">Stock</th>
          <th scope="col" class="px-3 py-2 text-left text-th uppercase text-muted-foreground w-40">SKU</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        <tr>
          <th scope="row" class="px-3 py-2 text-left text-label">Premium</th>
          <td class="px-3 py-2">250g</td>
          <td class="w-36 px-3 py-2">
            <label class="sr-only" for="vm-price-0">Price, Premium 250g</label>
            <div class="relative"><span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">₱</span><input id="vm-price-0" inputmode="numeric" value="349" class="field pl-7 tabular"></div>
          </td>
          <td class="w-32 px-3 py-2">
            <label class="sr-only" for="vm-stock-0">Stock, Premium 250g</label>
            <div class="relative"><input id="vm-stock-0" inputmode="numeric" value="20" class="field tabular"></div>
          </td>
          <td class="px-3 py-2">
            <label class="sr-only" for="vm-sku-0">SKU, Premium 250g</label>
            <div class="relative"><input id="vm-sku-0" inputmode="numeric" value="DTS-PR-250g" class="field tabular"></div>
          </td>
        </tr>
        <tr>
          <th scope="row" class="px-3 py-2 text-left text-label">Premium</th>
          <td class="px-3 py-2">500g</td>
          <td class="w-36 px-3 py-2">
            <label class="sr-only" for="vm-price-1">Price, Premium 500g</label>
            <div class="relative"><span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">₱</span><input id="vm-price-1" inputmode="numeric" value="649" class="field pl-7 tabular"></div>
          </td>
          <td class="w-32 px-3 py-2">
            <label class="sr-only" for="vm-stock-1">Stock, Premium 500g</label>
            <div class="relative"><input id="vm-stock-1" inputmode="numeric" value="42" class="field tabular"></div>
          </td>
          <td class="px-3 py-2">
            <label class="sr-only" for="vm-sku-1">SKU, Premium 500g</label>
            <div class="relative"><input id="vm-sku-1" inputmode="numeric" value="DTS-PR-500g" class="field tabular"></div>
          </td>
        </tr>
        <tr>
          <th scope="row" class="px-3 py-2 text-left text-label">Standard</th>
          <td class="px-3 py-2">250g</td>
          <td class="w-36 px-3 py-2">
            <label class="sr-only" for="vm-price-2">Price, Standard 250g</label>
            <div class="relative"><span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">₱</span><input id="vm-price-2" inputmode="numeric" value="249" class="field pl-7 tabular"></div>
          </td>
          <td class="w-32 px-3 py-2">
            <label class="sr-only" for="vm-stock-2">Stock, Standard 250g</label>
            <div class="relative"><input id="vm-stock-2" inputmode="numeric" value="0" class="field tabular"></div>
          </td>
          <td class="px-3 py-2">
            <label class="sr-only" for="vm-sku-2">SKU, Standard 250g</label>
            <div class="relative"><input id="vm-sku-2" inputmode="numeric" value="DTS-ST-250g" class="field tabular"></div>
          </td>
        </tr>
        <tr>
          <th scope="row" class="px-3 py-2 text-left text-label">Standard</th>
          <td class="px-3 py-2">500g</td>
          <td class="w-36 px-3 py-2">
            <label class="sr-only" for="vm-price-3">Price, Standard 500g</label>
            <div class="relative"><span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">₱</span><input id="vm-price-3" inputmode="numeric" value="449" class="field pl-7 tabular"></div>
          </td>
          <td class="w-32 px-3 py-2">
            <label class="sr-only" for="vm-stock-3">Stock, Standard 500g</label>
            <div class="relative"><input id="vm-stock-3" inputmode="numeric" value="15" class="field tabular"></div>
          </td>
          <td class="px-3 py-2">
            <label class="sr-only" for="vm-sku-3">SKU, Standard 500g</label>
            <div class="relative"><input id="vm-sku-3" inputmode="numeric" value="DTS-ST-500g" class="field tabular"></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <ul class="grid gap-2 md:hidden" aria-label="Price and stock per variation">
    <li class="card grid gap-2 p-3">
      <p class="text-label">Premium · 250g</p>
      <div class="grid grid-cols-2 gap-2">
        <div class="grid gap-1"><span class="text-body-sm text-muted-foreground" aria-hidden="true">Price</span>
          <label class="sr-only" for="vm-price-m0">Price, Premium 250g</label>
          <div class="relative"><span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">₱</span><input id="vm-price-m0" inputmode="numeric" value="349" class="field pl-7 tabular"></div>
        </div>
        <div class="grid gap-1"><span class="text-body-sm text-muted-foreground" aria-hidden="true">Stock</span>
          <label class="sr-only" for="vm-stock-m0">Stock, Premium 250g</label>
          <div class="relative"><input id="vm-stock-m0" inputmode="numeric" value="20" class="field tabular"></div>
        </div>
      </div>
    </li>
    <li class="card grid gap-2 p-3">
      <p class="text-label">Premium · 500g</p>
      <div class="grid grid-cols-2 gap-2">
        <div class="grid gap-1"><span class="text-body-sm text-muted-foreground" aria-hidden="true">Price</span>
          <label class="sr-only" for="vm-price-m1">Price, Premium 500g</label>
          <div class="relative"><span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">₱</span><input id="vm-price-m1" inputmode="numeric" value="649" class="field pl-7 tabular"></div>
        </div>
        <div class="grid gap-1"><span class="text-body-sm text-muted-foreground" aria-hidden="true">Stock</span>
          <label class="sr-only" for="vm-stock-m1">Stock, Premium 500g</label>
          <div class="relative"><input id="vm-stock-m1" inputmode="numeric" value="42" class="field tabular"></div>
        </div>
      </div>
    </li>
    <li class="card grid gap-2 p-3">
      <p class="text-label">Standard · 250g</p>
      <div class="grid grid-cols-2 gap-2">
        <div class="grid gap-1"><span class="text-body-sm text-muted-foreground" aria-hidden="true">Price</span>
          <label class="sr-only" for="vm-price-m2">Price, Standard 250g</label>
          <div class="relative"><span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">₱</span><input id="vm-price-m2" inputmode="numeric" value="249" class="field pl-7 tabular"></div>
        </div>
        <div class="grid gap-1"><span class="text-body-sm text-muted-foreground" aria-hidden="true">Stock</span>
          <label class="sr-only" for="vm-stock-m2">Stock, Standard 250g</label>
          <div class="relative"><input id="vm-stock-m2" inputmode="numeric" value="0" class="field tabular"></div>
        </div>
      </div>
    </li>
    <li class="card grid gap-2 p-3">
      <p class="text-label">Standard · 500g</p>
      <div class="grid grid-cols-2 gap-2">
        <div class="grid gap-1"><span class="text-body-sm text-muted-foreground" aria-hidden="true">Price</span>
          <label class="sr-only" for="vm-price-m3">Price, Standard 500g</label>
          <div class="relative"><span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">₱</span><input id="vm-price-m3" inputmode="numeric" value="449" class="field pl-7 tabular"></div>
        </div>
        <div class="grid gap-1"><span class="text-body-sm text-muted-foreground" aria-hidden="true">Stock</span>
          <label class="sr-only" for="vm-stock-m3">Stock, Standard 500g</label>
          <div class="relative"><input id="vm-stock-m3" inputmode="numeric" value="15" class="field tabular"></div>
        </div>
      </div>
    </li>
  </ul>
</div>
```

## 12. Test notes
- Each input has a unique accessible name.
