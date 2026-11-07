import { btn, iconBtn, link, icon, spinner } from '../ui/core.mjs';
import { tooltip } from '../ui/feedback.mjs';

const row = (...x) => `<div class="flex flex-wrap items-center gap-3">${x.join('')}</div>`;
const label = (t) => `<p class="text-eyebrow uppercase text-muted-foreground">${t}</p>`;

export const stickyBar = ({ fixed = true, inner } = {}) => `<div class="${fixed ? 'fixed inset-x-0 bottom-0 z-sticky-bar' : 'relative'} border-t border-border bg-surface shadow-sticky pb-safe lg:static lg:border-0 lg:bg-transparent lg:shadow-none lg:pb-0">
  <div class="mx-auto flex max-w-container items-stretch gap-2 px-gutter py-2 lg:px-0 lg:py-0">${inner || `
    <a href="#" class="flex min-h-touch-primary w-12 shrink-0 flex-col items-center justify-center rounded-button text-caption text-muted-foreground hover:bg-surface-muted lg:hidden">${icon('store')}<span>Shop</span></a>
    <a href="#" class="flex min-h-touch-primary w-12 shrink-0 flex-col items-center justify-center rounded-button text-caption text-muted-foreground hover:bg-surface-muted lg:hidden">${icon('message-circle')}<span>Chat</span></a>
    ${btn('Add to cart', { variant: 'secondary', size: 'lg', icon: 'shopping-cart', cls: 'min-w-0 flex-1 px-2.5 min-[400px]:px-4 max-[399px]:[&>.icon]:hidden lg:flex-none lg:px-8' })}
    ${btn('Buy now', { size: 'lg', cls: 'min-w-0 flex-1 px-2.5 min-[400px]:px-4 lg:flex-none lg:px-10' })}`}
  </div>
</div>`;

export default [
  {
    slug: 'button', name: 'Button', group: 'Actions', phase: 2,
    purpose: 'Triggers an action in place: submit, add to cart, confirm, delete. One recipe (`.btn`) with variant and size modifiers.',
    use: ['The control changes data or state (Add to cart, Place order, Approve).', 'Submitting a form.', 'Opening a dialog or sheet (`data-ds-open`).'],
    avoid: ['Navigating to another page: use **Link** (or `.btn` on an `<a>` when it must look like a button, e.g. “Shop now”).', 'Toggling a filter: use **Chip** (`aria-pressed`).', 'More than one primary per view section.'],
    anatomy: ['Container: `.btn`, `--r-button`, min-height from the size.', 'Optional leading icon (20px, `aria-hidden`).', 'Label: `text-label` (13px/700), sentence case.', 'Optional trailing icon.', 'Loading: spinner replaces the leading icon; label changes to the in-progress verb.'],
    variants: [
      ['Primary', '`.btn`', 'The single most important action in a section (Buy now, Place order).'],
      ['Secondary', '`.btn .btn-secondary`', 'Paired with primary (Add to cart next to Buy now).'],
      ['Outline', '`.btn .btn-outline`', 'Lower emphasis brand action (Follow shop, Chat).'],
      ['Ghost', '`.btn .btn-ghost`', 'Tertiary or toolbar actions; inside dense lists.'],
      ['Neutral', '`.btn .btn-neutral`', 'Cancel / dismiss, filters toolbar; not brand-coloured.'],
      ['Danger', '`.btn .btn-danger`', 'Destructive and irreversible (Delete listing, Suspend shop).'],
      ['Inverse', '`.btn .btn-inverse` inside `.on-inverse`', 'On `--surface-inverse` (promo strips, toasts).'],
      ['sm', '`.btn-sm`', '36px visual height, 44px hit area via `::after`. Dense tables, cards.'],
      ['md (default)', '—', '44px. Most buttons.'],
      ['lg', '`.btn-lg`', '48px, 14px label. Primary actions on phone (sticky bars, checkout).'],
      ['Full width', '`.btn-block`', 'Phone CTAs and dialog footers; drop it at `md:` with `md:w-auto`.'],
    ],
    gallery: `<div class="grid gap-4">${label('Variants')}${row(btn('Buy now'), btn('Add to cart', { variant: 'secondary' }), btn('Follow', { variant: 'outline', icon: 'plus' }), btn('Edit', { variant: 'ghost', icon: 'pencil' }), btn('Cancel', { variant: 'neutral' }), btn('Delete', { variant: 'danger', icon: 'trash-2' }))}
${label('Sizes')}${row(btn('Small', { size: 'sm' }), btn('Medium'), btn('Large', { size: 'lg' }))}
${label('Full width on phone')}${btn('Place order', { size: 'lg', block: true, cls: 'md:w-auto' })}
${label('On inverse surface')}<div class="on-inverse flex flex-wrap gap-3 rounded-panel bg-surface-inverse p-4">${btn('View shop', { variant: 'inverse' })}${btn('Shop now', { cls: 'bg-surface text-primary hover:bg-brand-50 active:bg-brand-100' })}</div></div>`,
    example: btn('Add to cart', { size: 'lg', icon: 'shopping-cart' }),
    states: {
      default: row(btn('Buy now'), btn('Add to cart', { variant: 'secondary' }), btn('Follow', { variant: 'outline' })),
      hover: `<div class="flex flex-wrap gap-3">${btn('Buy now', { attrs: { 'data-force': 'hover' } })}${btn('Add to cart', { variant: 'secondary', attrs: { 'data-force': 'hover' } })}${btn('Follow', { variant: 'outline', attrs: { 'data-force': 'hover' } })}</div>`,
      pressed: `<div class="flex flex-wrap gap-3">${btn('Buy now', { attrs: { 'data-force': 'pressed' } })}${btn('Add to cart', { variant: 'secondary', attrs: { 'data-force': 'pressed' } })}${btn('Delete', { variant: 'danger', attrs: { 'data-force': 'pressed' } })}</div>`,
      focus: `<div class="flex flex-wrap gap-3">${btn('Buy now', { attrs: { 'data-force': 'focus' } })}<div class="on-inverse rounded-panel bg-surface-inverse p-3">${btn('View shop', { variant: 'inverse', attrs: { 'data-force': 'focus' } })}</div></div>`,
      disabled: row(btn('Buy now', { disabled: true }), btn('Add to cart', { variant: 'secondary', disabled: true })),
      loading: row(btn('Placing order…', { loading: true, size: 'lg' })),
    },
    na: { error: 'Buttons have no error state; show the error next to the form or as a Banner.', selected: 'Use Chip or SegmentedControl for selectable options.', empty: 'A button always has a label.', skeleton: 'Use a Skeleton block with the button size while the surrounding card loads.' },
    responsive: ['Primary actions are `btn-lg` and often `btn-block` inside a StickyActionBar or dialog footer.', 'Buttons size to content (`md:w-auto`); dialog footers become a right-aligned row.', 'Same as tablet. Hover styles apply only on pointer devices (`@media (hover:hover)`).'],
    props: [['variant', '`primary` | `secondary` | `outline` | `ghost` | `neutral` | `danger` | `inverse`', '`primary`', 'Maps to `.btn-{variant}`.'], ['size', '`sm` | `md` | `lg`', '`md`', 'sm keeps a 44px hit area.'], ['block', 'boolean', 'false', 'Full width; combine with responsive `md:w-auto`.'], ['icon / iconEnd', 'icon name', '—', 'Lucide sprite id.'], ['loading', 'boolean', 'false', 'Sets `aria-busy` + `aria-disabled`, shows spinner; keep the button focusable.'], ['disabled', 'boolean', 'false', 'Native `disabled`. Prefer explaining why instead of disabling.'], ['type', '`button` | `submit`', '`button`', 'Always explicit.'], ['href', 'string', '—', 'Renders `<a class="btn">` for navigation that must look like a button.']],
    a11y: { role: 'Native `<button>` (or `<a>` when it navigates).', name: 'Visible label. If the label changes while loading, the new label is the name.', keyboard: 'Enter and Space activate (native).', focus: '2px `--focus-ring-color` outline with 2px offset; white inset ring on filled `.btn`; `--ring-inverse` inside `.on-inverse`.', aria: '`aria-busy="true"` + `aria-disabled="true"` while loading (stays focusable so focus is not lost).', touch: 'md 44px, lg 48px, sm 36px visual with a 44px `::after` hit area.', motion: 'Spinner rotation and colour transitions collapse under reduced motion.', announce: 'Result of the action is announced by a Toast (polite) or inline error, not by the button.' },
    content: ['Verb first, sentence case: “Add to cart”, “Place order”, “Request changes”.', 'Max ~20 characters on phone; Filipino copy runs ~30% longer, so never fix widths.', 'Loading label uses the progressive verb: “Placing order…”.', 'Destructive labels name the object: “Delete listing”, not “OK”.'],
    do: ['One primary per section; pair with secondary.', 'Use `btn-lg` + `btn-block` for the phone CTA.', 'Keep a loading button focusable with `aria-disabled`.'],
    dont: ['Don’t use `<div onclick>` or a link for an action.', 'Don’t disable “Place order” without saying what is missing.', 'Don’t put two danger buttons side by side.'],
    tests: ['Computed height ≥ 44px (md), ≥ 48px (lg); sm hit area ≥ 44px.', 'Focus ring visible on every variant in both brands, including inverse.', 'Loading button keeps focus and is announced as busy.', 'Label wraps or truncates without overflowing at 360px with Filipino copy.'],
  },
  {
    slug: 'icon-button', name: 'IconButton', group: 'Actions', phase: 2,
    purpose: 'A square button that shows only an icon: cart, chat, close, more. Optional count badge.',
    use: ['The icon is universally understood (close, back, search, cart, more).', 'Space is tight: headers, cards, toolbars.'],
    avoid: ['The action is ambiguous without words; use a Button with label.', 'Primary page actions.'],
    anatomy: ['Square `.btn.btn-icon` container (44px; 36px with `btn-sm`).', 'Icon (20px).', 'Optional count badge (`--sale` background), hidden from AT; count is appended to the accessible name.', 'Optional Tooltip on pointer devices.'],
    variants: [['Ghost (default)', '`.btn-icon.btn-ghost`', 'Headers, cards.'], ['Neutral', '`.btn-icon.btn-neutral`', 'Floating over media (gallery arrows).'], ['Primary / secondary', '`.btn-icon` / `.btn-icon.btn-secondary`', 'Compose send button, FAB-like actions.'], ['With count', '`count` prop', 'Cart, chat, notifications.'], ['sm / lg', '`.btn-sm` / `.btn-lg`', '36px (44px hit area) / 48px.']],
    gallery: row(iconBtn('shopping-cart', 'Cart', { count: 2 }), iconBtn('message-circle', 'Chat', { count: 120 }), iconBtn('heart', 'Add to likes', { variant: 'neutral' }), iconBtn('send', 'Send', { variant: 'primary' }), iconBtn('ellipsis-vertical', 'More actions', { size: 'sm' }), iconBtn('x', 'Close', { size: 'lg' }), tooltip({ id: 'tip-share', tip: 'Share', trigger: iconBtn('share-2', 'Share') })),
    example: iconBtn('shopping-cart', 'Cart', { count: 2 }),
    states: { default: row(iconBtn('heart', 'Add to likes'), iconBtn('shopping-cart', 'Cart', { count: 2 })), hover: 'auto', pressed: 'auto', focus: 'auto', disabled: iconBtn('trash-2', 'Delete', { attrs: { disabled: true } }), selected: `<button type="button" class="btn btn-icon btn-ghost text-sale" aria-pressed="true" aria-label="Add to likes">${icon('heart', 'fill-current')}</button>`, loading: `<button type="button" class="btn btn-icon btn-ghost text-foreground" aria-busy="true" aria-disabled="true" aria-label="Sending">${spinner()}</button>` },
    na: { error: 'Show errors next to the related content.', empty: 'Badge hides at 0.', skeleton: 'Use a 44px circle Skeleton.' },
    responsive: ['44px everywhere. Header shows cart + chat.', 'Same.', 'Header adds notifications; Tooltip shows on hover.'],
    props: [['icon', 'icon name', '—', 'Required.'], ['label', 'string', '—', 'Required accessible name.'], ['count', 'number', '—', 'Shows badge; “99+” above 99; appended to name (“Cart, 2”).'], ['variant', 'as Button', '`ghost`', ''], ['size', '`sm` | `md` | `lg`', '`md`', ''], ['pressed', 'boolean', '—', 'Toggle buttons (like) use `aria-pressed`.']],
    a11y: { role: '`<button>` or `<a>`.', name: '`aria-label` is mandatory; count appended (“Chat, 3”).', keyboard: 'Enter / Space.', aria: '`aria-pressed` for toggles; badge `aria-hidden`.', announce: 'Toggle state change is conveyed by `aria-pressed`.' },
    content: ['Label describes the action, not the icon: “Add to likes”, not “Heart”.', 'Counts above 99 show “99+” visually; the name keeps the real number.'],
    do: ['Pair rare icons with a Tooltip on desktop.', 'Keep 44px even when the icon is 16px.'],
    dont: ['Don’t rely on the tooltip as the only name.', 'Don’t use for destructive actions without confirmation.'],
    tests: ['axe: `button-name` passes.', 'Badge does not change the button size.', 'Touch target ≥ 44px.'],
  },
  {
    slug: 'link', name: 'Link', group: 'Actions', phase: 2,
    purpose: 'Navigates to another page or section. Underlined inline; brand coloured.',
    use: ['Navigation in text, “See all”, policy links.'],
    avoid: ['Actions that change data: use Button.'],
    anatomy: ['`<a>` with `text-primary`, underline 1px, offset 2px.', 'Optional external icon + sr-only “(opens in a new tab)”.'],
    variants: [['Inline', '`link()`', 'Inside sentences.'], ['Standalone', '`link()` + `min-h-touch inline-flex`', '“See all”, “View shop”: needs 44px target.'], ['External', '`external: true`', 'Opens a new tab; says so.'], ['Inverse', '`text-inverse-link` inside `.on-inverse`', 'On inverse surfaces.']],
    gallery: `<div class="grid gap-3"><p class="text-body">By placing your order you agree to the ${link('Terms of Service')} and ${link('Privacy Policy')}.</p><p>${link(`See all ${icon('chevron-right', 'inline size-4 align-[-0.15em]')}`, '#', { cls: 'inline-flex min-h-touch items-center no-underline hover:underline' })}</p><p class="text-body">${link('Courier tracking', '#', { external: true })}</p><p class="on-inverse rounded-panel bg-surface-inverse p-3 text-body text-foreground-inverse">Need help? <a href="#" class="font-bold text-inverse-link underline">Contact support</a></p></div>`,
    example: `<p class="text-body">By placing your order you agree to the ${link('Terms of Service')}.</p>`,
    states: { default: `<p class="text-body">${link('Return policy')}</p>`, hover: `<p class="text-body">${link('Return policy').replace('<a ', '<a data-force="hover" ')}</p>`, focus: `<p class="text-body">${link('Return policy').replace('<a ', '<a data-force="focus" ')}</p>`, pressed: { na: 'No separate pressed style; navigation is immediate.' }, selected: `<p class="text-body"><a href="#" aria-current="page" class="font-bold text-foreground no-underline">Current page</a></p>` },
    na: { disabled: 'Links are never disabled; remove the link or render plain text.', loading: 'n/a', error: 'n/a', empty: 'n/a', skeleton: 'Inline text skeleton.' },
    responsive: ['Standalone links get a 44px target; inline links are exempt (WCAG 2.5.8 inline exception).', 'Same.', 'Same; hover thickens underline.'],
    props: [['href', 'string', '—', 'Required.'], ['external', 'boolean', 'false', 'Adds icon, `target=_blank rel=noopener` and sr-only hint.'], ['current', 'boolean', 'false', '`aria-current="page"`.']],
    a11y: { role: 'Native `<a href>`.', name: 'Link text; must make sense out of context (“View order #1042”, not “here”).', keyboard: 'Enter.', touch: 'Standalone ≥ 44px; inline exempt.' },
    content: ['Describe the destination.', 'Never “click here”.'],
    do: ['Underline links in body text (colour alone is not enough).'], dont: ['Don’t style links as plain text.', 'Don’t open new tabs without saying so.'],
    tests: ['Underline present (`link-in-text-block` axe rule).', 'External links announce “opens in a new tab”.'],
  },
  {
    slug: 'sticky-action-bar', name: 'StickyActionBar', group: 'Actions', phase: 2,
    purpose: 'Keeps the main actions within thumb reach on phone: product detail (Shop | Chat | Add to cart | Buy now), checkout (total + Place order), seller forms (Save).',
    use: ['A page has one decisive action the user must reach without scrolling.'],
    avoid: ['Pages that already show the bottom tab bar (never stack both).', 'More than two buttons plus two shortcuts.'],
    anatomy: ['Fixed bottom container `z-sticky-bar`, `--shadow-sticky`, `pb-safe` for the home indicator.', 'Optional shortcut links (Shop, Chat): icon over caption.', 'Secondary button (flex-1).', 'Primary `btn-lg` (flex-1).', 'Page content gets bottom padding equal to the bar height.'],
    variants: [['Product detail', 'shortcuts + secondary + primary', 'Shopee-familiar Chat | Add to cart | Buy now.'], ['Checkout', 'total + primary', '“Total ₱1,438 · Place order”.'], ['Form', 'neutral + primary', 'Seller product form: Save draft / Publish.']],
    gallery: `<div class="grid gap-4">${stickyBar({ fixed: false })}${stickyBar({ fixed: false, inner: `<div class="flex flex-1 flex-col justify-center"><p class="text-body-sm text-muted-foreground">Total (3 items)</p><p class="text-price text-sale tabular">₱1,438</p></div>${btn('Place order', { size: 'lg', cls: 'min-w-36' })}` })}${stickyBar({ fixed: false, inner: `${btn('Save draft', { variant: 'neutral', size: 'lg', cls: 'flex-1' })}${btn('Publish', { size: 'lg', cls: 'flex-1' })}` })}</div>`,
    galleryCls: 'bg-background',
    example: stickyBar(),
    states: { default: stickyBar({ fixed: false }), disabled: stickyBar({ fixed: false, inner: `<div class="flex flex-1 flex-col justify-center"><p class="text-body-sm text-muted-foreground">Select an address first</p><p class="text-price text-sale tabular">₱1,438</p></div>${btn('Place order', { size: 'lg', disabled: true })}` }), loading: stickyBar({ fixed: false, inner: `<div class="flex flex-1 flex-col justify-center"><p class="text-body-sm text-muted-foreground">Total</p><p class="text-price text-sale tabular">₱1,438</p></div>${btn('Placing order…', { size: 'lg', loading: true })}` }), focus: stickyBar({ fixed: false, inner: `${btn('Add to cart', { variant: 'secondary', size: 'lg', cls: 'flex-1' })}${btn('Buy now', { size: 'lg', cls: 'flex-1', attrs: { 'data-force': 'focus' } })}` }), error: stickyBar({ fixed: false, inner: `<p class="flex flex-1 items-center gap-1 text-body-sm font-bold text-danger">${icon('circle-alert', 'size-4')}Out of stock</p>${btn('Notify me', { variant: 'outline', size: 'lg' })}` }) },
    na: { hover: 'Child buttons carry hover.', pressed: 'Child buttons carry pressed.', selected: 'n/a', empty: 'n/a', skeleton: 'Render the bar immediately with disabled buttons.' },
    cellCls: 'bg-background p-0 overflow-hidden',
    responsive: ['Fixed to the bottom, full width, safe-area padding; the tab bar is hidden on this page.', 'Still fixed; buttons max out at content width via the container.', 'Becomes static (`lg:static`) and sits inline in the buy box; shortcuts hide (header has chat).'],
    preview: { height: { 360: 420, 768: 420, 1280: 300 }, fixed: true, html: `<div class="mx-auto max-w-container p-gutter pb-28 lg:pb-gutter"><p class="text-h3">Product detail page</p><p class="mt-2 text-body text-muted-foreground">Content scrolls behind the bar. At desktop the bar becomes part of the buy box.</p><div class="mt-4 lg:max-w-md">${stickyBar()}</div></div>` },
    props: [['variant', '`product` | `checkout` | `form`', '`product`', ''], ['total', 'money', '—', 'Checkout variant.'], ['primary / secondary', 'Button props', '—', ''], ['static', 'breakpoint', '`lg`', 'Breakpoint at which it becomes inline.']],
    a11y: { role: 'Plain container (no landmark; it is part of the page content order).', name: 'n/a; buttons carry names.', keyboard: 'Buttons in DOM order after the content they act on.', focus: 'Page sets `scroll-padding-bottom` so focused fields are not hidden behind the bar.', touch: 'Buttons 48px; shortcuts 48px × 48px.', announce: 'Totals that change use `aria-live="polite"` on the total.' },
    content: ['Primary label is the outcome: “Buy now”, “Place order”.', 'Show the total with ₱ and tabular numerals.'],
    do: ['Add bottom padding to the page so the last content is reachable.', 'Hide the BottomTabBar on pages with this bar.'],
    dont: ['Don’t put more than two buttons.', 'Don’t cover form errors; scroll them into view above the bar.'],
    tests: ['No overlap with the tab bar; safe-area inset respected (iOS).', 'Last content row visible above the bar at 360px.', 'Becomes static at 1024px.'],
  },
];
