# ImageUploader

Forms · Phase 2 · Live sheet: `styleguide/components/image-uploader.html`

## 1. Purpose
Multi-image upload for listings, reviews and reports: cover, reorder, remove, progress, per-file errors.

**Use when**
- Product photos (max 9), review photos (max 5), report evidence.

**Don't use when**
- Single avatar (simpler control).

## 2. Anatomy
1. Label + counter “n / max”.
2. Tile grid (3 cols phone).
3. Tile: preview, Cover badge on first, progress bar while uploading, error tile.
4. Reorder (←/→) and remove buttons per tile (keyboard operable; no drag-only).
5. Add tile (label for hidden file input).
6. Live region for add/move/remove.

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| Listing | `max: 9` | First = cover. |
| Review | `max: 5` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Add tile tints on hover. |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: Hide the Add tile at max. |
| Loading | rendered |
| Error | rendered |
| Selected | n/a: n/a |
| Empty | rendered |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | 3 columns; reorder buttons under each tile. |
| Tablet (md, 768px+) | 4 columns. |
| Desktop (lg, 1024px+) | 5 columns. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| max | number | 9 |  |
| accept | string | `image/*` |  |
| files | array | [] | {name, url, progress, error} |
| onReorder / onRemove | fn | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | List of tiles; file input labelled by the Add tile. |
| Accessible name | Buttons: “Move Front.jpg earlier”, “Remove Front.jpg”. |
| Keyboard | All actions are buttons; no drag-only reorder. |
| Focus management | After remove, focus moves to the next tile’s button. |
| ARIA | Progress bars `role=progressbar` with value. |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | “1 photo added”, “Front.jpg moved to position 2”, “Front.jpg removed”. |

## 8. Tokens used
`--border`, `--border-control`, `--brand-100`, `--danger`, `--danger-soft`, `--dur`, `--ease-out`, `--elevation-popover`, `--focus-ring-color`, `--focus-ring-offset`, `--focus-ring-on-brand`, `--focus-ring-width`, `--foreground`, `--fs-body-sm`, `--fs-caption`, `--fs-label`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--primary-hover`, `--primary-pressed`, `--primary-soft`, `--primary-soft-foreground`, `--r-badge`, `--r-button`, `--r-tile`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `currentColor (icons)`

## 9. Content rules
- State limits up front (count, size, type).
- Errors per tile, short: “Over 5 MB”.

## 10. Do / Don't
**Do**
- Show progress per file.

**Don't**
- Don’t block the form while other files upload.

## 11. HTML usage
```html
<div class="grid gap-2" data-ds-uploader>
  <div class="flex items-baseline justify-between">
    <p id="up1-label" class="text-label">Product photos</p>
    <p class="text-body-sm text-muted-foreground tabular">3 / 9</p>
  </div>
  <p class="text-body-sm text-muted-foreground">JPG or PNG, up to 5 MB each. The first photo is the cover.</p>
  <ul class="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-2" data-ds-tiles aria-labelledby="up1-label">
    <li class="relative" data-name="Front view.jpg">
      <div class="relative aspect-square overflow-hidden rounded-tile border border-border bg-surface-muted"><img alt="" class="size-full object-cover"><span class="badge badge-solid absolute left-1 top-1">Cover</span></div>
      <button type="button" class="btn btn-icon btn-neutral btn-sm absolute right-0 top-0 rounded-full border-transparent text-danger shadow-popover" data-ds-remove aria-label="Remove Front view.jpg"><svg class="icon size-4" aria-hidden="true"><use href="#i-x"/></svg></button>
      <div class="mt-1 flex justify-between">
        <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="-1" aria-label="Move Front view.jpg earlier"><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-left"/></svg></button>
        <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="1" aria-label="Move Front view.jpg later"><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-right"/></svg></button>
      </div>
    </li>
    <li class="relative" data-name="Side view.jpg">
      <div class="relative aspect-square overflow-hidden rounded-tile border border-border bg-surface-muted"><img alt="" class="size-full object-cover">
        <div class="absolute inset-x-2 bottom-2 h-1.5 overflow-hidden rounded-full bg-surface" role="progressbar" aria-label="Uploading Side view.jpg" aria-valuenow="64" aria-valuemin="0" aria-valuemax="100">
          <div class="h-full bg-primary" style="width:64%"></div>
        </div>
      </div>
      <button type="button" class="btn btn-icon btn-neutral btn-sm absolute right-0 top-0 rounded-full border-transparent text-danger shadow-popover" data-ds-remove aria-label="Remove Side view.jpg"><svg class="icon size-4" aria-hidden="true"><use href="#i-x"/></svg></button>
      <div class="mt-1 flex justify-between">
        <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="-1" aria-label="Move Side view.jpg earlier"><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-left"/></svg></button>
        <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="1" aria-label="Move Side view.jpg later"><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-right"/></svg></button>
      </div>
    </li>
    <li class="relative" data-name="Label.png">
      <div class="relative aspect-square overflow-hidden rounded-tile border border-danger bg-danger-soft">
        <div class="grid h-full place-items-center p-2 text-center text-caption font-bold text-danger"><svg class="icon mx-auto size-5" aria-hidden="true"><use href="#i-triangle-alert"/></svg>Over 5 MB</div>
      </div>
      <button type="button" class="btn btn-icon btn-neutral btn-sm absolute right-0 top-0 rounded-full border-transparent text-danger shadow-popover" data-ds-remove aria-label="Remove Label.png"><svg class="icon size-4" aria-hidden="true"><use href="#i-x"/></svg></button>
      <div class="mt-1 flex justify-between">
        <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="-1" aria-label="Move Label.png earlier"><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-left"/></svg></button>
        <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="1" aria-label="Move Label.png later"><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-right"/></svg></button>
      </div>
    </li>
    <li data-ds-add>
      <label for="up1" class="grid aspect-square cursor-pointer place-items-center rounded-tile border-2 border-dashed border-border-control bg-surface text-center text-body-sm font-bold text-primary hover:bg-primary-soft focus-ring"><span><svg class="icon mx-auto size-6" aria-hidden="true"><use href="#i-image-plus"/></svg>Add photo</span></label>
      <input id="up1" type="file" accept="image/*" multiple class="sr-only">
    </li>
  </ul>
  <template>
    <li class="relative" data-name="">
      <div class="relative aspect-square overflow-hidden rounded-tile border border-border bg-surface-muted"><img alt="" class="size-full object-cover"></div>
      <button type="button" class="btn btn-icon btn-neutral btn-sm absolute right-0 top-0 rounded-full border-transparent text-danger shadow-popover" data-ds-remove aria-label="Remove "><svg class="icon size-4" aria-hidden="true"><use href="#i-x"/></svg></button>
      <div class="mt-1 flex justify-between">
        <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="-1" aria-label="Move earlier"><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-left"/></svg></button>
        <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="1" aria-label="Move later"><svg class="icon size-4" aria-hidden="true"><use href="#i-chevron-right"/></svg></button>
      </div>
    </li>
  </template>
  <p class="sr-only" aria-live="polite" data-ds-live></p>
</div>
```

## 12. Test notes
- Reorder with keyboard only.
- Live region announces changes.
- Grid fits 360px.
