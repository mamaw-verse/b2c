# Foundations & Components UI Audit & Improvement Plan

**Design System Audit: Foundations & Components (Phases 1–4)**  
**Target:** `docs/design-system/docs/` and underlying implementation (`src/`, `tokens/`, `sheets/defs/`, `sheets/ui/`, `dist/`, `styleguide/`)  
**Scope:** Foundations and Components only (Reference screens excluded per instructions).  
**Status:** Audit & Recommendations Document (No implementation changes made in this session).

---

## 1. Executive Summary & Audit Scope

This audit evaluates the foundations and 58 distinct components (93 generated component sheets) in the white-label marketplace design system. The audit focused on identifying:
- **UI Quirks & Layout Anomalies:** Visual misalignments, border disconnections, clipping on overflow containers, safe-area collisions, and responsive edge-case wrapping.
- **Interaction & State Deficiencies:** Missing hover/focus/active states, accidental touch interactions, keyboard trap risks, focus-ring clipping, and mobile virtual-keyboard obscurations.
- **Accessibility & ARIA Compliance:** Screen reader announcements, contrast boundary verification, touch target compliance (WCAG 2.5.8 & 2.5.5), and live region spam.
- **Porting & Framework Readiness:** Gaps or traps for future Blade / Inertia (React/Vue) ports (e.g., color traps with inverse surfaces, un-sanitized client inputs, missing CSS fallback rules).

---

## 2. Foundations Audit

### F-01: Missing `--sticky-bar-h` Token and `pb-sticky-bar` Utility
- **Location:** `src/tokens.css`, `src/components.css`, `docs/foundations.md`
- **Issue:** The design system defines `--tabbar-h: 3.5rem` and utility `pb-tabbar: calc(var(--tabbar-h) + env(safe-area-inset-bottom, 0px))` for pages showing the bottom tab bar. However, on pages featuring a `StickyActionBar` (e.g. PDP, Checkout, Seller product form), `--tabbar-h` does not apply. There is no `--sticky-bar-h` token or `pb-sticky-bar` utility.
- **UI Quirk:** Content at the bottom of PDP and checkout screens is either partially obscured by the sticky action bar or developers must manually guess arbitrary padding (`pb-20`, `pb-24`) that fails to adapt when `safe-area-inset-bottom` changes on devices like the iPhone 15/16.
- **Proposed Fix:**
  1. Add `--sticky-bar-h: 4.25rem` to `:root` in `src/tokens.css` (accounting for 48px buttons + vertical padding).
  2. Add `@utility pb-sticky-bar { padding-bottom: calc(var(--sticky-bar-h) + env(safe-area-inset-bottom, 0px)); }`.
  3. Document its use alongside `StickyActionBar` in `docs/components/sticky-action-bar.md`.

---

### F-02: `.on-inverse` Surface Color Trap
- **Location:** `src/base.css` (lines 26–29), `src/components.css`
- **Issue:** In `src/base.css`, `.on-inverse` is only styled to override the focus ring color:
  ```css
  .on-inverse :where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
    outline-color: var(--ring-inverse);
  }
  ```
  It does **not** define `background-color: var(--surface-inverse)` or `color: var(--foreground-inverse)`.
- **UI Quirk:** Whenever developers apply `.on-inverse` to a dark banner, footer, or toast, if they omit `bg-surface-inverse text-foreground-inverse`, any plain text or un-classed paragraph renders in `--foreground` (`#202923` dark slate) on `--surface-inverse` (`#102f21` deep green or `#3c2038` deep plum). Contrast collapses to **1.05:1**, creating completely unreadable invisible text.
- **Proposed Fix:**
  Add a foundational class definition in `src/components.css` or `src/base.css`:
  ```css
  .on-inverse {
    background-color: var(--surface-inverse);
    color: var(--foreground-inverse);
  }
  ```
  Allow explicit utility overrides where necessary, but make the default safe.

---

### F-03: Focus Ring Clipping on `overflow-hidden` Containers
- **Location:** `src/base.css` (lines 20–25), `src/components.css`
- **Issue:** Global focus-visible styling specifies:
  ```css
  outline: 3px solid var(--ring);
  outline-offset: 2px;
  ```
  Multiple components wrap interactive controls inside containers with `overflow-hidden` (e.g. `QuantityStepper`, `SearchInput` dropdowns, `VariantMatrix` cells, table rows, and interactive cards).
- **UI Quirk:** When an element with `outline-offset: 2px` is focused inside an `overflow-hidden` parent, the 3px outer outline is clipped along the container edges, creating an asymmetrical or broken focus ring.
- **Proposed Fix:**
  1. Add an offset override utility (e.g. `focus-visible:outline-offset-[-2px]` or `focus-visible:outline-offset-0`) for controls embedded inside tightly clipped flex/grid shells.
  2. For controls like `QuantityStepper`, move `overflow-hidden` to inner non-interactive elements or apply the focus ring to the outer container via `has-[:focus-visible]`.

---

### F-04: Native `<dialog>` Missing Exit and Backdrop Transition
- **Location:** `src/base.css` (lines 37–41), `sheets/ui/feedback.mjs`
- **Issue:** Native `<dialog>` elements use modern discrete CSS transitions:
  `transition-[translate,opacity,scale,display,overlay] transition-discrete duration-token starting:open:translate-y-full`
  However:
  1. There are no exit transition styles for when `dialog[open]` is closed (it instantly snaps shut rather than animating out).
  2. `dialog::backdrop` has no opacity transition (`background: color-mix(in srgb, var(--brand-950) 55%, transparent)`), causing the backdrop to flash into existence abruptly.
- **UI Quirk:** Modals and bottom sheets animate in smoothly on entry, but on exit the modal snaps shut and the dark overlay vanishes instantly without animation.
- **Proposed Fix:**
  In `src/base.css`, add:
  ```css
  dialog {
    transition: opacity var(--dur) var(--ease-out),
                translate var(--dur) var(--ease-out),
                overlay var(--dur) var(--ease-out) allow-discrete,
                display var(--dur) var(--ease-out) allow-discrete;
    opacity: 0;
  }
  dialog[open] {
    opacity: 1;
  }
  dialog::backdrop {
    background: color-mix(in srgb, var(--brand-950) 55%, transparent);
    transition: opacity var(--dur) var(--ease-out), overlay var(--dur) var(--ease-out) allow-discrete, display var(--dur) var(--ease-out) allow-discrete;
    opacity: 0;
  }
  dialog[open]::backdrop {
    opacity: 1;
  }
  @starting-style {
    dialog[open]::backdrop { opacity: 0; }
  }
  ```

---

### F-05: Global `.grid` Single-Column Default Side Effect
- **Location:** `src/base.css` (lines 16–18)
- **Issue:**
  ```css
  /* A plain `grid` is a one-column stack: its column may shrink below content width... */
  .grid { grid-template-columns: minmax(0, 1fr); }
  ```
- **UI Quirk:** While this safely prevents overflow on phone viewports for single-column stacks, any standard Tailwind multi-column utility combination that relies on default grid auto-flow without an explicit `grid-cols-X` utility behaves unexpectedly because `grid-template-columns` is pre-set to 1 column.
- **Proposed Fix:**
  Scope this rule specifically to `.stack-grid` or keep it well documented in `docs/foundations.md` as an intentional deviation from standard Tailwind grid behavior.

---

### F-06: Missing Native `<select>` Dropdown Arrow in CSS
- **Location:** `src/components.css` (lines 36–37)
- **Issue:**
  ```css
  select.field { @apply appearance-none pr-10; }
  ```
  `appearance-none` removes the operating system's native dropdown indicator arrow. However, `components.css` does not provide an SVG background chevron. Instead, the UI helpers inject an absolute `<svg class="icon">` alongside `<select>`.
- **UI Quirk:** If a developer ports or uses `<select class="field">` without wrapping it in `<div class="relative">` and manually appending a Lucide chevron SVG, the select looks like a plain text box with no dropdown indicator.
- **Proposed Fix:**
  Provide an inline SVG data-URI background chevron directly in `select.field` CSS as a fallback, or document `<Select>` as a strict compound component that requires the wrapper.

---

### F-07: Seed Claim vs Measured Discrepancy in `contrast.md`
- **Location:** `docs/contrast.md` (lines 146–158)
- **Issue:** The documentation explicitly highlights:
  | Pair | Claimed | Measured | Match |
  |---|---|---|---|
  | border-control on surface | 3.3 | 3.52 | **NO** |
- **UI Quirk / Docs Inconsistency:** This was an intentional deviation (adjusting `#869089` to `#818b84` so fields on `--surface-muted` achieve 3.13:1 > 3:1), but the table in `docs/contrast.md` displays a red **NO** under "Seed claims vs measured", which looks like an unresolved failure to stakeholders reviewing reports.
- **Proposed Fix:**
  Update the script `scripts/contrast.mjs` / `contrast-pairs.mjs` to clarify that this deviation was accepted and intentional, labeling it `yes (improved: 3.52 >= 3.0)` rather than a raw mismatch.

---

## 3. Actions Components Audit

### A-01: `.btn[aria-busy="true"]` Pointer Events & Cursor Conflict
- **Component:** `Button` (`docs/components/button.md`, `src/components.css` lines 9–10)
- **Issue:**
  ```css
  .btn[aria-busy="true"] { @apply pointer-events-none cursor-progress opacity-100; }
  ```
- **UI Quirk:** When an element has `pointer-events: none`, the browser will **never** display the `cursor: progress` style when hovering over the button. The mouse cursor remains the default pointer or arrow.
- **Proposed Fix:**
  Remove `pointer-events-none` from `aria-busy` and instead prevent default action in JS (`e.preventDefault()`), OR set `cursor: progress` on the button's parent container during loading states.

---

### A-02: Small Button (`.btn-sm`) Hit Area on Short Labels
- **Component:** `Button` (`src/components.css` lines 11–12)
- **Issue:**
  ```css
  .btn-sm { @apply min-h-9 px-3; }
  .btn-sm::after { content: ""; position: absolute; inset: calc((2.25rem - var(--touch-min)) / 2 - 1px) -1px; }
  ```
  `2.25rem` = 36px; `var(--touch-min)` = 44px. Vertical expansion is ~5px top and bottom, which satisfies 44px height.
  However, the horizontal inset is fixed to `-1px`.
- **UI Quirk:** When a `.btn-sm` contains a short label (e.g., "OK", "Add", "Use", "COD"), the visual button width is often only 32–38px. Because horizontal inset is only `-1px`, the total hit area width remains under the 44px minimum required by WCAG 2.5.5 / 2.5.8.
- **Proposed Fix:**
  Update `.btn-sm` to enforce a minimum hit area width:
  ```css
  .btn-sm { @apply min-h-9 min-w-touch px-3; }
  ```
  or calculate horizontal expansion in `::after` when width is below 44px.

---

### A-03: `ShopCard` Redundant Tab Stops and Conflicting Stretched Link
- **Component:** `ShopCard` (`docs/components/shop-card.md`, `sheets/ui/commerce.mjs` lines 49–56)
- **Issue:**
  ```html
  <article class="card relative flex items-center gap-3 p-3">
    ...
    <h3><a href="#" class="after:absolute after:inset-0">${s.name}</a></h3>
    ...
    <button type="button" class="btn btn-outline btn-sm relative z-10">Visit</button>
  </article>
  ```
- **UI Quirk:** Both the shop name link and the "Visit" button navigate to the exact same destination. Tabbing through the card focuses the shop name, and the very next tab stop is "Visit". Screen readers announce both separately for the exact same target.
- **Proposed Fix:**
  Mark the "Visit" button with `tabindex="-1"` and `aria-hidden="true"` as a visual affordance only, OR style the card so that only the title is the interactive element without an unnecessary duplicate button.

---

### A-04: Tooltip Boundary Viewport Clipping
- **Component:** `Tooltip` (`docs/components/tooltip.md`, `styleguide/components/tooltip.html`)
- **Issue:** Tooltip is statically positioned with:
  ```css
  class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-56 ..."
  ```
- **UI Quirk:** If an icon button with a tooltip sits near the top of the viewport (e.g. in a sticky header or top toolbar) or against the far-left or far-right edge of a screen, the tooltip text is cut off by the viewport edge. There is no fallback placement (e.g. `bottom`, `right`, or horizontal clamping).
- **Proposed Fix:**
  Add CSS boundary clamping (`max-w-[calc(100vw-2rem)]`, left/right shift utilities) or a light JS repositioning hook when rendered near boundaries.

---

## 4. Form Controls Audit

### FM-01: `PhoneInput` Visual Separation, Error State & Focus Ring Disconnection
- **Component:** `PhoneInput` (`docs/components/phone-input.md`, `sheets/ui/forms.mjs` lines 58–63)
- **Issue:**
  ```html
  <div class="flex">
    <span class="inline-flex min-h-touch items-center gap-1 rounded-l-field border border-r-0 border-border-control bg-surface-muted px-3 text-input text-foreground" aria-hidden="true">+63</span>
    <input id="${id}" type="tel" inputmode="numeric" placeholder="9XX XXX XXXX" class="field rounded-l-none" ...>
  </div>
  ```
- **UI Quirks:**
  1. **Disconnected Focus Ring:** Focusing the input applies `outline: 3px solid var(--ring); outline-offset: 2px` to the `<input>` only. The `+63` prefix sits outside the ring, looking visually detached and unaligned.
  2. **Inconsistent Error Border:** When `aria-invalid="true"`, only the input gets `border-danger`. The `+63` box retains its neutral gray border.
  3. **No Click Delegation:** Tapping the `+63` prefix does not focus the input because it is a `<span>` rather than a `<label>` or input trigger.
- **Proposed Fix:**
  Wrap the prefix and input in a unified container that carries the `.field` classes, focusing the input on click, and applying the focus ring / error state to the outer container:
  ```html
  <div class="field flex items-stretch p-0 has-[:focus-visible]:border-primary has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ring aria-[invalid=true]:border-danger">
    <label for="${id}" class="flex items-center border-r border-border-control bg-surface-muted px-3 text-muted-foreground select-none">+63</label>
    <input id="${id}" type="tel" class="w-full bg-transparent px-3 text-input outline-none" ...>
  </div>
  ```

---

### FM-02: `QuantityStepper` Manual Typing Sanitization & Clamping
- **Component:** `QuantityStepper` (`docs/components/quantity-stepper.md`, `src/js/ds.js` lines 122–132)
- **Issue:** In `ds.js`:
  ```javascript
  on('change', '[data-ds-stepper] input', function (e, i) { syncStepper(i.closest('[data-ds-stepper]')); });
  ```
  `syncStepper()` only recalculates button disabled states based on the numeric value. If a user manually types non-numeric characters ("abc"), a negative number, or a value exceeding available stock (`999` when max is `5`), `ds.js` does not clamp or restore `input.value`.
- **UI Quirk:** The user can submit a cart item with invalid or out-of-stock quantities.
- **Proposed Fix:**
  In `syncStepper` / change listener, clamp and sanitize `input.value`:
  ```javascript
  var val = parseInt(input.value.replace(/\D/g, ''), 10);
  if (isNaN(val) || val < min) val = min;
  if (val > max) val = max;
  input.value = val;
  ```

---

### FM-03: `OTP Input` Mobile SMS Autofill Truncation
- **Component:** `OTP input` (`docs/components/otp-input.md`, `src/js/ds.js` lines 134–145)
- **Issue:** In `src/js/ds.js`:
  ```javascript
  on('input', '[data-ds-otp] input', function (e, i) {
    i.value = i.value.replace(/\D/g, '').slice(-1);
    if (i.value && i.nextElementSibling) i.nextElementSibling.focus();
  });
  ```
- **UI Quirk:** On iOS Safari and Android Chrome, SMS verification codes inserted via keyboard autofill ("From Messages: 482190") trigger an `input` event on the first input with all 6 digits. Because `i.value.slice(-1)` runs, the value is truncated to the single last digit ("0"), and the code is destroyed.
- **Proposed Fix:**
  Update the `input` event listener to check if `e.target.value.length > 1`, and if so, distribute each digit across the OTP inputs sequentially (identical to the paste handler).

---

### FM-04: `Combobox` & `SearchInput` Mobile Virtual Keyboard Collision
- **Component:** `Combobox` & `SearchInput` (`docs/components/combobox.md`, `docs/components/search-input.md`)
- **Issue:** The suggestions dropdown list is placed with:
  ```html
  <ul ... class="absolute inset-x-0 top-full z-sheet mt-1 max-h-80 overflow-auto rounded-panel border border-border bg-surface shadow-popover">
  ```
- **UI Quirk:** On mobile devices, opening the on-screen keyboard reduces the visible viewport height to ~320–380px. When a combobox is located in the middle or bottom of a form (or inside a modal sheet), the dropdown extends below the bottom edge of the screen and cannot be scrolled into view without closing the keyboard.
- **Proposed Fix:**
  1. Add collision detection: if distance to viewport bottom is `< 200px`, flip the dropdown to open upward (`bottom-full mb-1`).
  2. In modal dialogs, ensure the modal body uses `overflow-visible` for the combobox or adjust `scroll-padding-bottom`.

---

### FM-05: `FormField` Live Counter Screen Reader Announce Spam
- **Component:** `FormField` / `TextArea` (`docs/components/form-field.md`, `docs/components/text-area.md`)
- **Issue:**
  ```html
  <p id="${id}-count" class="... tabular" aria-live="polite">${counter}</p>
  ```
  In `src/js/ds.js`:
  ```javascript
  on('input', '[data-ds-counter]', function (e, el) {
    var c = document.getElementById(el.getAttribute('data-ds-counter'));
    c.textContent = el.value.length + ' / ' + el.maxLength;
  });
  ```
- **UI / A11y Quirk:** Because `aria-live="polite"` is placed directly on the counter element and updated on every single input event, screen reader users (VoiceOver, TalkBack, NVDA) may hear continuous announcements of character counts on every keystroke, drowning out the actual text being typed.
- **Proposed Fix:**
  Remove `aria-live="polite"` from the live visual counter element. Instead, announce character limits on focus, or debounce live announcements so they only announce when the user pauses typing for > 2 seconds or reaches 90% and 100% of the limit.

---

### FM-06: `ImageUploader` Missing Visual Drag-and-Drop Dropzone States
- **Component:** `ImageUploader` (`docs/components/image-uploader.md`, `sheets/ui/forms.mjs` lines 100–120)
- **Issue:** The Add tile is an accessible `<label>` for a file `<input>`. However, there are no `dragover` / `dragleave` / `drop` event listeners or CSS styles (e.g. border highlight, scale, background tint) for desktop users dragging image files from desktop file explorers.
- **Proposed Fix:**
  Add dropzone drag events to `data-ds-uploader` to highlight the container on file dragover.

---

### FM-07: `RatingInput` Star Pointer Hover Preview
- **Component:** `RatingInput` (`docs/components/rating-input.md`, `src/js/ds.js` lines 207–210)
- **Issue:** `paintRating()` only executes on `change`. When hovering over stars with a mouse pointer, the stars do not visually preview the rating until clicked.
- **Proposed Fix:**
  Add a pointerover / pointerleave handler on `[data-ds-rating]` to preview star fill on hover without changing the selected radio until clicked.

---

## 5. Feedback & Overlay Components Audit

### FB-01: `Toast` Multiple Trigger Stacking Bug
- **Component:** `Toast` (`docs/components/toast.md`, `src/js/ds.js` lines 105–119)
- **Issue:** In `src/js/ds.js`:
  ```javascript
  on('click', '[data-ds-toast]', function (e, btn) {
    var region = $('#ds-toaster') || $('[data-ds-toaster]');
    ...
    region.appendChild(toast);
    ...
  });
  ```
  In `docs/components/toast.md`: "Do: One toast at a time; replace older."
- **UI Quirk:** Rapidly clicking "Add to cart" or multiple actions appends multiple toasts in `#ds-toaster`. On mobile screens, multiple toasts stack up and consume the entire lower half of the screen, obscuring the primary UI.
- **Proposed Fix:**
  Before appending a new toast in `ds.js`, remove any existing toasts:
  ```javascript
  $$('[data-ds-toast-item]', region).forEach(function (t) { t.remove(); });
  ```

---

### FB-02: Accidental Dialog Dismissal on Backdrop Text Drag
- **Component:** `Modal`, `BottomSheet`, `ConfirmDialog` (`src/js/ds.js` lines 51)
- **Issue:**
  ```javascript
  document.addEventListener('click', function (e) {
    if (e.target.tagName === 'DIALOG' && e.target.open) e.target.close('backdrop');
  });
  ```
- **UI Quirk:** In native HTML `<dialog>`, clicks on the backdrop report `e.target === dialog`. However, if a user starts selecting text inside an input or paragraph within the dialog and releases the mouse cursor outside the dialog boundary, the browser registers a `click` event with `e.target === dialog`. The dialog instantly closes, wiping out user input.
- **Proposed Fix:**
  Track `pointerdown` and `pointerup` targets; only close if **both** the mouse-down and mouse-up occurred on the backdrop.

---

### FB-03: Mobile Drag Handle Renders on Desktop `BottomSheet`
- **Component:** `BottomSheet` (`docs/components/bottom-sheet.md`, `sheets/ui/feedback.mjs` line 74)
- **Issue:**
  ```javascript
  ${kind === 'sheet' ? handle.replace(' md:hidden', '') : kind === 'responsive' ? handle : ''}
  ```
  `handle` is:
  ```html
  <div class="flex justify-center pt-2 md:hidden" data-ds-sheet-handle><span class="h-1.5 w-10 rounded-full bg-border-control" aria-hidden="true"></span></div>
  ```
- **UI Quirk:** For `kind === 'sheet'`, `md:hidden` is stripped out. On tablet (768px) and desktop (1280px), the mobile swipe handle is still rendered at the top of the sheet, and dragging it with a mouse moves the dialog. Desktop modal sheets should rely on explicit Close buttons and backdrop clicks.
- **Proposed Fix:**
  Do not strip `md:hidden` on desktop, or disable pointer dragging when `pointer: fine` is active.

---

### FB-04: `Popover` Positioning Drift on Viewport Scroll/Resize
- **Component:** `Popover / Dropdown` (`docs/components/popover.md`, `src/js/ds.js` lines 80–90)
- **Issue:** Popovers calculate their inline `style.left` and `style.top` only on the initial `toggle` event.
- **UI Quirk:** If the user opens a popover kebab menu and then scrolls the page or resizes the window, the popover remains at its original static pixel coordinates, detaching from its trigger button.
- **Proposed Fix:**
  Add a passive window scroll/resize listener when a popover opens that closes it or updates its position.

---

### FB-05: `ProgressSteps` Text Label Collision at Mid-Breakpoints
- **Component:** `ProgressSteps` (`docs/components/progress-steps.md`, `sheets/ui/feedback.mjs` lines 38–50)
- **Issue:** The component switches from the mobile progress bar to the full multi-step numbered circles at container query `@xl` (36rem / 576px).
- **UI Quirk:** In flows with 4 or 5 steps with longer titles (e.g. "Business details", "Bank account", "Verification"), between 576px and 768px the labels between the horizontal lines collide or wrap into 3 awkward lines.
- **Proposed Fix:**
  Increase the breakpoint for the horizontal stepper to `@2xl` (42rem) or truncate/clamp step labels with tooltips on narrower widths.

---

## 6. Navigation Components Audit

### NV-01: Header Duplicate Logo Links in Markup
- **Component:** `Header` (`docs/components/header.md`, `sheets/ui/nav.mjs` lines 20–25)
- **Issue:**
  ```html
  <span class="lg:hidden">
    <a href="#" class="..." aria-label="{{BRAND_NAME}} home">...</a>
  </span>
  <span class="hidden lg:inline">
    <a href="#" class="..." aria-label="{{BRAND_NAME}} home">...</a>
  </span>
  ```
- **UI / A11y Quirk:** Two duplicate home links exist in the DOM right next to each other with the same accessible name. In assistive technology rotor menus, users see two identical links.
- **Proposed Fix:**
  Consolidate into a single `<a href="#">` link with responsive text classes:
  ```html
  <a href="#" class="flex min-h-touch items-center gap-2 text-h4 text-primary" aria-label="{{BRAND_NAME}} home">
    <span class="grid size-8 place-items-center rounded-tile bg-primary text-primary-foreground" aria-hidden="true">${icon('store', 'size-5')}</span>
    <span class="hidden lg:inline">{{BRAND_NAME}}</span>
  </a>
  ```

---

### NV-02: `BottomTabBar` Zero-Count Unread Badge Visibility
- **Component:** `BottomTabBar` (`docs/components/bottom-tab-bar.md`, `sheets/ui/nav.mjs` lines 8–15)
- **Issue:** In `bottom-tab-bar.md`:
  "Empty: Badges hide at 0."
  In `sheets/ui/nav.mjs`:
  ```html
  ${badge ? `<span class="absolute -right-2.5 -top-1.5 grid min-w-4.5 place-items-center rounded-full bg-sale px-1 text-caption leading-[1.125rem] text-primary-foreground" aria-hidden="true">${badge}</span>` : ''}
  ```
- **UI Quirk:** If a consumer passes `badges: { chat: 0 }`, JavaScript truthiness checks `0` as falsy in some contexts, but if passed as string `'0'` or rendered without filtering, a red `0` pill appears over the tab icon.
- **Proposed Fix:**
  Explicitly check `badge > 0`: `${badge && Number(badge) > 0 ? ... : ''}`.

---

### NV-03: `Tabs` Initial Selected Tab Mobile Horizontal Scroll Alignment
- **Component:** `Tabs` (`docs/components/tabs.md`, `src/js/ds.js` lines 65–78)
- **Issue:** In `ds.js`:
  `tab.scrollIntoView({ block: 'nearest', inline: 'nearest' })` only fires on `click` or `keydown`.
- **UI Quirk:** When navigating directly to a deep-linked tab on mobile (e.g. `My Purchases -> Completed` or `Return/Refund` which is the 6th tab), the selected tab is off-screen to the right, and the tablist appears scrolled to the start ("To Pay").
- **Proposed Fix:**
  On initialization (`init()`), find any `[role=tab][aria-selected="true"]` and call `scrollIntoView({ inline: 'nearest' })`.

---

## 7. Commerce & Data Display Components Audit

### CM-01: `ProductCard` Price and Discount Badge Wrapping on 360px Width
- **Component:** `ProductCard` (`docs/components/product-card.md`, `sheets/ui/commerce.mjs` lines 20–46)
- **Issue:** At 360px viewport width in a 2-column grid (`grid-cols-2 gap-2`), each product card is ~170px wide.
  Inside the price block:
  `<span class="text-price text-sale">₱12,499</span>` (17px bold) and `<s class="text-body-sm text-muted-foreground">₱24,999</s>`.
- **UI Quirk:** In `product-card.md`, `PriceBlock` is called with `pctBadge: false` because the corner image badge already shows discount (`-42%`). This prevents horizontal overflow. However, in `list` view or cart item, if both the long price, struck-through price, and discount badge are shown, prices wrap into three vertical lines, breaking grid baseline alignment.
- **Proposed Fix:**
  Ensure the price block container in cards uses `gap-x-1.5 gap-y-0.5` and sets minimum line-height or truncates original prices on ultra-narrow columns.

---

### CM-02: `ReviewCard` Long Text Expansion ("See more")
- **Component:** `ReviewCard` (`docs/components/review-card.md`, `sheets/ui/commerce.mjs` lines 184–193)
- **Issue:** Review text is rendered as plain `<p class="text-body">${esc(text)}</p>`.
  In `review-card.md`: "Don’t truncate review text without 'See more'."
- **UI Quirk:** When buyers write very lengthy reviews (200–500 words), the review card expands to excessive height on mobile screens, making it difficult to scroll through other reviews.
- **Proposed Fix:**
  Introduce a line-clamp pattern (`line-clamp-4`) with a lightweight `<button type="button" class="text-label text-primary">See more</button>` disclosure for text over 240 characters.

---

### CM-03: `VariationPicker` Disabled Chip Screen Reader Announcement
- **Component:** `VariationPicker` (`docs/components/variation-picker.md`, `sheets/ui/commerce.mjs` lines 75–76)
- **Issue:**
  ```html
  <label class="... has-[:disabled]:cursor-not-allowed ...">
    <input type="radio" name="${name}" class="sr-only" disabled>
    Black<span class="text-caption">(sold out)</span>
  </label>
  ```
- **UI / A11y Quirk:** Because the native radio is `disabled`, keyboard navigation (Arrow Up / Down / Left / Right) skips the disabled radio entirely in standard browser radio group traversal. This is compliant with ARIA radiogroup behavior, but screen reader users arrowing through choices may never hear that the "Black" variation exists and is simply out of stock.
- **Proposed Fix:**
  Include total available vs sold-out options in the `<legend>` summary or allow focusable disabled options with `aria-disabled="true"` rather than native `disabled` if the marketplace wants buyers to sign up for "Notify me when available".

---

### CM-04: PHP Currency Centavos Rule vs Exact Output
- **Component:** `PriceBlock`, `OrderSummary` (`docs/content-guide.md` line 30)
- **Rule in Content Guide:** "Currency: `₱1,250` — no decimals unless the amount has centavos (`₱1,348.50`); tabular numerals everywhere numbers compare."
- **Audit Result:**
  In `src/js/ds.js`:
  ```javascript
  maximumFractionDigits: n % 1 ? 2 : 0
  ```
  This is implemented correctly in `ds.js` and `peso()` helper.
  However, in `DataTable` and `order-summary`, some static templates hardcode `₱2,150.50` while others write `₱499`.
  Ensure that all ported Blade/Inertia formatters use the exact same helper function (`formatMoney(amount)`).

---

## 8. Chat, Seller & Moderation Components Audit

### CH-01: `ChatComposer` Keyboard Safe Area Handling
- **Component:** `ChatComposer` (`docs/components/chat-composer.md`, `sheets/ui/commerce.mjs` lines 245–251)
- **Issue:**
  ```html
  <form class="... pb-[calc(.5rem+env(safe-area-inset-bottom,0px))]" ...>
  ```
- **UI Quirk:** On iOS Safari, when the virtual keyboard opens, `env(safe-area-inset-bottom)` becomes `0px` because the keyboard pushes the input above the home indicator. However, if the page uses `position: fixed; bottom: 0`, iOS Safari sometimes retains residual bottom padding or leaves a white bar below the keyboard.
- **Proposed Fix:**
  Use the modern CSS `interactive-widget=resizes-content` viewport meta tag in the HTML head and adjust bottom padding to `pb-2` when keyboard is visible:
  `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">`.

---

### MD-01: Moderation Queue Item SLA Warning Contrast
- **Component:** `ModerationQueueItem` (`docs/components/moderation-queue-item.md`, `sheets/ui/admin.mjs` lines 25–40)
- **Issue:** When an SLA warning is triggered, text switches to `--warning` (`#b54708`).
  On `--surface` (`#ffffff`), contrast is 5.43:1 (passes).
  However, when the row is selected / active (`aria-current="true"`), the row background becomes `--primary-soft` (`#eaf4ed` in default brand, `#f5f0f5` in demo brand).
- **Audit Verification:**
  `#b54708` on `#eaf4ed` yields **4.91:1** in default brand (passes 4.5:1).
  In demo brand: `#b54708` on `#f5f0f5` yields **4.98:1** (passes 4.5:1).
  However, if the SLA breaches, `--danger` (`#b42318`) on `#eaf4ed` yields **5.95:1** (passes).
  Ensure rows do not combine `--sale` or other alert colors that could dip below 4.5:1 on soft brand rows.

---

### MD-02: `BulkActionBar` Stacking Context & Mobile Hiding
- **Component:** `BulkActionBar` (`docs/components/bulk-action-bar.md`, `sheets/ui/admin.mjs` lines 104–117)
- **Issue:**
  `BulkActionBar` is hidden on mobile using `.md:hidden` / `hidden md:flex`.
- **UI Quirk:** If an admin opens the moderation console on a tablet in portrait mode (768px), `BulkActionBar` appears fixed at the top of the queue list. But if `z-index` is not explicitly set above table sticky headers, the table header can paint over the bulk bar during scrolling.
- **Proposed Fix:**
  Assign explicit `z-sticky-bar` or `z-header` (`z-40` / `z-45`) to the floating `BulkActionBar`.

---

## 9. Comprehensive Issue & Fix Matrix

| ID | Area | Component / Foundation | Issue Description | Severity | Proposed Fix |
|---|---|---|---|---|---|
| **F-01** | Foundations | Layout Tokens | Missing `--sticky-bar-h` & `pb-sticky-bar` utility | Medium | Define `--sticky-bar-h: 4.25rem` and `pb-sticky-bar` in `tokens.css` |
| **F-02** | Foundations | Surface Tokens | `.on-inverse` does not set background and text colors | **High** | Add `background-color: var(--surface-inverse); color: var(--foreground-inverse);` to `.on-inverse` |
| **F-03** | Foundations | Focus Ring | Focus rings get clipped by `overflow-hidden` containers | Medium | Add `outline-offset: 0` or move `overflow-hidden` off interactive wrappers |
| **F-04** | Foundations | Overlay Transitions | Native `<dialog>` snaps shut without exit or backdrop fade | Low | Add discrete transition and backdrop opacity keyframes in `base.css` |
| **F-05** | Foundations | Global CSS | `.grid` single-column override side-effects | Low | Document grid single-column default or scope to `.stack-grid` |
| **F-06** | Foundations | Forms CSS | `select.field` lacks CSS fallback dropdown chevron | Medium | Provide inline SVG background icon in `components.css` |
| **F-07** | Foundations | Contrast Docs | `docs/contrast.md` marks intentional deviation as "NO" | Low | Clarify intentional `#818b84` upgrade in report script |
| **A-01** | Actions | Button | `.btn[aria-busy]` has `pointer-events-none` blocking `cursor-progress` | Low | Remove `pointer-events-none` or delegate cursor to parent |
| **A-02** | Actions | Button | `.btn-sm` horizontal hit area < 44px on short labels | Medium | Enforce `min-w-touch` or expand horizontal `::after` |
| **A-03** | Actions | ShopCard | Duplicate focus stops ("Visit" button + Stretched Link) | Low | Make "Visit" button visual-only (`tabindex="-1" aria-hidden`) |
| **A-04** | Actions | Tooltip | Viewport edge clipping on top/side edges | Low | Implement boundary flipping or clamping |
| **FM-01** | Forms | PhoneInput | `+63` prefix visually disconnected from input focus ring | Medium | Wrap prefix and input in unified `.field` container |
| **FM-02** | Forms | QuantityStepper | Missing value sanitization/clamping on manual typing | Medium | Clamp and sanitize input value in `syncStepper` |
| **FM-03** | Forms | OTP Input | Mobile SMS autofill truncates code to 1 digit | **High** | Distribute all autofilled characters across boxes in input handler |
| **FM-04** | Forms | Combobox / Search | Dropdown clipped by mobile virtual keyboard | Medium | Add upward flip when space below input is < 200px |
| **FM-05** | Forms | FormField / TextArea | Live counter spams screen reader on every keystroke | Medium | Remove `aria-live="polite"` from continuous keystroke counter |
| **FM-06** | Forms | ImageUploader | Missing dragover/drop visual states for desktop | Low | Add dropzone event listeners and hover styles |
| **FM-07** | Forms | RatingInput | Stars do not preview on pointer hover | Low | Add hover preview in pointer event listener |
| **FB-01** | Feedback | Toast | Rapid clicks stack multiple toasts covering the screen | Medium | Remove older toast before appending new toast in `ds.js` |
| **FB-02** | Overlays | Modal / Dialog | Text selection drag across backdrop accidentally closes dialog | Medium | Track mouse-down and mouse-up targets before triggering backdrop close |
| **FB-03** | Overlays | BottomSheet | Mobile swipe handle renders on desktop modal sheets | Low | Hide handle on `pointer: fine` and `md:` breakpoints |
| **FB-04** | Overlays | Popover | Popover floats away during page scroll or resize | Low | Reposition or dismiss popover on scroll/resize |
| **FB-05** | Feedback | ProgressSteps | Stepper titles collide at intermediate widths (576–768px) | Low | Increase breakpoint or clamp title length |
| **NV-01** | Navigation | Header | Duplicate logo link elements in DOM for mobile and desktop | Low | Consolidate into single link with responsive display classes |
| **NV-02** | Navigation | BottomTabBar | Red badge displays `0` when unread count is zero | Low | Suppress badge rendering when count is `<= 0` |
| **NV-03** | Navigation | Tabs | Deep-linked tab on mobile does not scroll into view on load | Low | Call `scrollIntoView()` on initial selected tab |
| **CM-01** | Commerce | ProductCard | Price and discount badge wrap in 360px 2-column view | Medium | Enforce compact spacing and line-height constraints |
| **CM-02** | Commerce | ReviewCard | Long reviews expand cards excessively | Low | Add line-clamp with "See more" toggle |
| **CM-03** | Commerce | VariationPicker | Disabled radio chips are skipped by screen readers | Low | Expose sold-out count in fieldset legend |
| **CH-01** | Chat | ChatComposer | Mobile keyboard leaves white space or shifts composer | Low | Add `interactive-widget=resizes-content` viewport meta |
| **MD-01** | Moderation | ModerationQueueItem | Selected row tint combined with SLA warning contrast risk | Low | Enforce contrast verification on tinted backgrounds |
| **MD-02** | Moderation | BulkActionBar | Table sticky headers can overlap floating bulk bar | Low | Assign explicit `z-sticky-bar` z-index to bulk toolbar |

---

## 10. Recommended Implementation Roadmap

Execution of the fixes listed above can be performed in distinct, non-breaking stages:

1. **Phase 1: Foundations & Core Utilities**
   - Implement `F-01` (`pb-sticky-bar` and `--sticky-bar-h`).
   - Implement `F-02` (safe `.on-inverse` defaults in `components.css`).
   - Implement `F-04` (smooth `<dialog>` exit and backdrop transitions in `base.css`).
   - Run `npm run scan` and `npm run contrast` to verify zero regressions.

2. **Phase 2: Form Controls & Accessibility Hardening**
   - Implement `FM-01` (unified `PhoneInput` container).
   - Implement `FM-02` and `FM-03` (`QuantityStepper` clamping and `OTP Input` autofill fix in `ds.js`).
   - Implement `FM-05` (silence live counter spam on `FormField`).
   - Implement `A-01` and `A-02` (`Button` progress cursor and small button hit width).

3. **Phase 3: Feedback, Overlays & Navigation Polish**
   - Implement `FB-01` (single active toast replacement in `ds.js`).
   - Implement `FB-02` (mouse-down backdrop drag guard for dialogs).
   - Implement `NV-01` (deduplicate header logo links).
   - Implement `NV-02` and `NV-03` (tab bar zero badge suppression and tabs scroll-into-view).

4. **Phase 4: Commerce & Moderation Polish**
   - Implement `CM-01` and `CM-02` (`ProductCard` price wrapping and `ReviewCard` read-more clamp).
   - Implement `MD-02` (floating `BulkActionBar` z-index stacking).
   - Regenerate all sheets via `node scripts/build-styleguide.mjs` and run Playwright verification (`npm run verify`).
