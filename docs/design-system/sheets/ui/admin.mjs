import { cx, icon, iconBtn, btn, badge, avatar, media, peso, esc } from './core.mjs';
import { formField, textarea, check, fieldset, searchInput, select } from './forms.mjs';
import { dialog, menu } from './feedback.mjs';
import { chip, rating } from './data.mjs';
import { priceBlock } from './commerce.mjs';
import { halalBadge, halalChecklist } from './halal.mjs';

/** StatusPill: moderation state, icon + text on the mod-* tokens (never colour alone). */
const MOD = { pending: ['clock', 'Pending'], flagged: ['flag', 'Flagged'], hidden: ['eye-off', 'Hidden'], suspended: ['ban', 'Suspended'], resolved: ['circle-check', 'Resolved'] };
export const statusPill = (state, label) => `<span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-mod-${state}-bg px-2 py-0.5 text-caption font-bold text-mod-${state}">${icon(MOD[state][0], 'size-3.5')}${label || MOD[state][1]}</span>`;

export const TYPES = { listing: ['tag', 'Listing'], halal: ['file-badge', 'Halal check'], review: ['star', 'Review'], chat: ['message-square-warning', 'Chat report'], seller: ['store', 'Seller application'], user: ['user-x', 'User report'], shop: ['shield-alert', 'Shop report'], dispute: ['scale', 'Dispute'] };
const PRI = { 1: ['P1', 'badge-danger'], 2: ['P2', 'badge-warning'], 3: ['P3', 'badge-neutral'] };

/** ModerationQueueItem */
export function queueItem({ type = 'listing', title, excerpt, state = 'pending', age = '2h 14m', sla = 'SLA 4h', slaState = 'ok', reports = 12, priority = 1, id = 'MQ-10482', active, select = true }) {
  const slaCls = slaState === 'breach' ? 'text-danger font-bold' : slaState === 'warn' ? 'text-warning font-bold' : 'text-muted-foreground';
  return `<li class="relative flex gap-3 bg-surface px-gutter py-3 hover:bg-surface-subtle aria-[current=true]:bg-primary-soft has-[:checked]:bg-primary-soft md:px-3"${active ? ' aria-current="true"' : ''} data-ds-detail>
  ${select ? `<label class="relative z-10 -my-1 hidden size-11 shrink-0 place-items-center md:grid"><input type="checkbox" class="size-5 accent-primary" data-ds-bulk-item><span class="sr-only">Select ${id}</span></label>` : ''}
  <span class="grid size-10 shrink-0 place-items-center rounded-tile bg-surface-muted text-foreground">${icon(TYPES[type][0])}</span>
  <div class="grid min-w-0 flex-1 gap-1">
    <p class="flex items-center gap-2 text-caption text-muted-foreground"><span>${TYPES[type][1]}</span><span aria-hidden="true">·</span><span class="tabular">${id}</span><span class="ml-auto badge ${PRI[priority][1]}"><span class="sr-only">Priority </span>${PRI[priority][0]}</span></p>
    <p class="truncate text-label"><a href="#" class="after:absolute after:inset-0">${esc(title)}</a></p>
    ${excerpt ? `<p class="line-clamp-1 text-body-sm text-muted-foreground">${esc(excerpt)}</p>` : ''}
    <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm">${statusPill(state)}<span class="inline-flex items-center gap-1 ${slaCls}">${icon('clock', 'size-3.5')}<span><span class="sr-only">Age </span>${age} · ${sla}${slaState === 'breach' ? ' breached' : ''}</span></span>${reports ? `<span class="inline-flex items-center gap-1 text-muted-foreground">${icon('flag', 'size-3.5')}${reports} report${reports > 1 ? 's' : ''}</span>` : ''}</p>
  </div>
</li>`;
}
export const queue = [
  { type: 'listing', title: 'Longganisa “100% halal”: ingredients mention pork fat', excerpt: 'Listed by Pantry Direct PH · 3 photos · no certificate', reports: 12, priority: 1, age: '3h 52m', slaState: 'warn', state: 'flagged', id: 'MQ-10482' },
  { type: 'halal', title: 'Certificate expired · Davao Halal Meats', excerpt: '14 listings will be hidden at midnight', reports: 0, priority: 1, age: '1h 05m', sla: 'SLA 4h', id: 'MQ-10493', state: 'pending' },
  { type: 'chat', title: 'Seller asked buyer to pay via bank transfer', excerpt: '“Para mas mura, send na lang po sa account ko…”', reports: 1, priority: 1, age: '5h 10m', sla: 'SLA 4h', slaState: 'breach', id: 'MQ-10477' },
  { type: 'seller', title: 'Barakah Pantry · seller application', excerpt: 'DTI permit, valid ID, halal certificate (food)', reports: 0, priority: 2, age: '1d 2h', sla: 'SLA 2d', id: 'MQ-10466' },
  { type: 'review', title: 'Review contains phone number', excerpt: '“Text me 0917… for cheaper price”', reports: 3, priority: 2, age: '40m', id: 'MQ-10490' },
  { type: 'dispute', title: 'Item not received · ₱2,150', excerpt: 'Order #240311-0039 · buyer vs Mindanao Halal Meats', reports: 0, priority: 1, age: '20h', sla: 'SLA 48h', id: 'MQ-10451', state: 'pending' },
  { type: 'shop', title: 'Shop is using a certifier’s logo without a certificate', excerpt: '8 user reports in 24h', reports: 8, priority: 3, age: '2d', sla: 'SLA 3d', id: 'MQ-10440', state: 'hidden' },
];
export const queueList = ({ items = queue, active = 0, select = true } = {}) => `<div data-ds-bulk data-ds-master>${bulkBar({ fixed: false })}<ul class="divide-y divide-border" aria-label="Moderation queue">${items.map((q, n) => queueItem({ ...q, active: n === active, select })).join('')}</ul></div>`;

/** QueueFilterBar: inline on md+, "Filters" sheet on phone. */
export function filterBar({ id = 'qf' } = {}) {
  const filters = `${fieldset({ legend: 'Type', children: Object.entries(TYPES).map(([k, [ic, l]], n) => check({ id: `${id}-t${n}`, label: l, checked: n < 2 })).join('') })}
    ${fieldset({ legend: 'Status', children: ['Pending', 'Flagged', 'Hidden'].map((l, n) => check({ id: `${id}-s${n}`, label: l, checked: n < 2 })).join('') })}
    ${formField({ id: `${id}-sort`, label: 'Sort by', control: select({ id: `${id}-sort`, options: ['SLA (soonest first)', 'Priority', 'Most reported', 'Newest'] }) })}`;
  return `<div class="grid gap-2 border-b border-border bg-surface px-gutter py-2 md:px-3">
  <div class="flex gap-2">${searchInput({ id: `${id}-q`, placeholder: 'Search ID, shop, keyword', label: 'Search queue', cls: 'min-w-0 flex-1', suggestions: [] })}
    ${btn('Filters', { variant: 'neutral', icon: 'sliders-horizontal', cls: 'md:hidden', attrs: { 'data-ds-open': `${id}-sheet` } })}</div>
  <div class="-mx-gutter flex gap-2 overflow-x-auto px-gutter pb-1 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Quick filters">${chip('All types')}${chip('Listings', { pressed: true, count: 24 })}${chip('Halal checks', { pressed: true, count: 9 })}${chip('Chat reports', { count: 7 })}${chip('Reviews', { count: 11 })}${chip('Disputes', { count: 4 })}${chip('SLA breached', { ic: 'alarm-clock', count: 2 })}</div>
</div>
${dialog({ id: `${id}-sheet`, title: 'Filter queue', body: `<div class="grid gap-4">${filters}</div>`, footer: `${btn('Reset', { variant: 'neutral' })}${btn('Show 31 items', { attrs: { 'data-ds-close': true } })}` })}`;
}

/** ReasonPicker: templates + free text; required when rejecting. */
export const reasonTemplates = ['Halal claim not supported by a valid certificate', 'Certifier is not recognised or certificate is expired', 'Ingredients conflict with the halal claim', 'Prohibited or restricted item', 'Misleading title, photos or price', 'Contact details or off-platform payment', 'Incomplete documents'];
export function reasonPicker({ id = 'rp', error, action = 'reject' } = {}) {
  return `<div class="grid gap-4">${fieldset({ legend: `Reason${action === 'reject' ? ' (required)' : ''}`, id: `${id}-r`, error, children: reasonTemplates.map((r, n) => check({ id: `${id}-${n}`, name: `${id}-reason`, type: 'radio', label: r, error: !!error, extra: { required: n === 0 } })).join('') })}
  ${formField({ id: `${id}-note`, label: 'Message to seller', help: 'Sent with the decision. Be specific about what to change.', counter: '0 / 1000', control: textarea({ id: `${id}-note`, rows: 3, maxlength: 1000, help: true, counter: true, placeholder: 'e.g. Remove the logo from photos 2 and 3.' }) })}
  ${check({ id: `${id}-int`, label: 'Add internal note only (not sent)' })}</div>`;
}

/** ModerationActionBar: phone shows Approve + Reject + More; md+ shows all. */
export function actionBar({ fixed = true, id = 'mab' } = {}) {
  const more = [{ label: 'Request changes', icon: 'square-pen' }, { label: 'Request certificate', icon: 'file-badge' }, { label: 'Hide', icon: 'eye-off' }, { label: 'Warn seller', icon: 'triangle-alert' }, '-', { label: 'Suspend shop', icon: 'ban', danger: true }, { label: 'Escalate', icon: 'arrow-up' }];
  /* Container query, not viewport: the pane is ~660px wide at 1280px, so the inline row only appears when the pane itself is >= 48rem. */
  return `<div class="@container ${fixed ? 'sticky bottom-0 z-sticky-bar' : 'relative'} border-t border-border bg-surface shadow-sticky pb-safe">
  <div class="flex items-center gap-2 px-gutter py-2 md:px-4">
    <div class="hidden flex-1 flex-wrap gap-2 @3xl:flex">${btn('Request changes', { variant: 'neutral', icon: 'square-pen' })}${btn('Request certificate', { variant: 'neutral', icon: 'file-badge' })}${btn('Hide', { variant: 'neutral', icon: 'eye-off' })}${btn('Warn', { variant: 'neutral', icon: 'triangle-alert' })}${btn('Suspend', { variant: 'neutral', icon: 'ban', cls: 'text-danger' })}</div>
    <span class="@3xl:hidden">${menu({ id: `${id}-more`, label: 'More actions', items: more, align: 'start', trigger: iconBtn('ellipsis', 'More actions', { variant: 'neutral', attrs: { popovertarget: `${id}-more`, 'aria-haspopup': 'menu' } }) })}</span>
    ${btn('Reject', { variant: 'danger', size: 'lg', icon: 'x', cls: 'flex-1 @3xl:flex-none', attrs: { 'data-ds-open': `${id}-reject` } })}${btn('Approve', { size: 'lg', icon: 'check', cls: 'flex-1 @3xl:flex-none' })}
  </div>
</div>
${dialog({ id: `${id}-reject`, title: 'Reject listing', body: reasonPicker({ id: `${id}-rp` }), footer: `${btn('Cancel', { variant: 'neutral', attrs: { 'data-ds-close': true } })}${btn('Reject listing', { variant: 'danger' })}` })}`;
}

/** BulkActionBar: appears when queue items are selected (tablet/desktop). */
export const bulkBar = ({ fixed = true, count, shown } = {}) => `<div class="${fixed ? 'sticky top-0' : ''} z-sticky-bar hidden border-b border-border bg-surface-inverse md:block" data-ds-bulk-bar${count || shown ? '' : ' hidden'}>
  <div class="on-inverse flex flex-wrap items-center gap-2 px-3 py-2 text-foreground-inverse"><p class="flex-1 text-label" aria-live="polite" data-ds-bulk-count>${count ? `${count} selected` : ''}</p>${btn('Approve', { variant: 'inverse', size: 'sm', icon: 'check' })}${btn('Reject', { variant: 'inverse', size: 'sm', icon: 'x' })}${btn('Hide', { variant: 'inverse', size: 'sm', icon: 'eye-off' })}${btn('Assign to me', { variant: 'inverse', size: 'sm' })}</div>
</div>`;

/** AuditLogList */
export const auditLog = (items = [
  ['Jun Dela Cruz', 'Requested changes', 'Reason: Misleading photos. “Remove brand logo from photo 2.”', 'Oct 30, 4:12 PM'],
  ['System', 'Auto-flagged', '12 reports in 3h · keyword “pork fat” + “halal” without a certificate', 'Oct 30, 1:05 PM'],
  ['Seller · Pantry Direct PH', 'Edited listing', 'Title and 2 photos changed', 'Oct 29, 9:40 AM'],
]) => `<ol class="grid gap-4" aria-label="Audit log">${items.map(([who, what, detail, when]) => `<li class="flex gap-3">${avatar(who, { size: 'sm', label: false })}<div class="grid min-w-0 flex-1 gap-0.5"><p class="text-body"><span class="font-bold">${who}</span> · ${what}</p>${detail ? `<p class="text-body-sm text-muted-foreground">${detail}</p>` : ''}<p class="text-caption text-muted-foreground"><time>${when}</time></p></div></li>`).join('')}</ol>`;

/** ContentPreview slots: product, review, chat excerpt (context only, PII masked). */
export const previewProduct = () => `<div class="grid gap-3">
  <ul class="flex gap-2" aria-label="Listing photos">${[0, 1, 2].map(i => `<li class="w-16 shrink-0 overflow-hidden rounded-tile">${media(`Listing photo ${i + 1}`, { i, ic: 'beef' })}</li>`).join('')}</ul>
  <div class="grid content-start gap-2"><p class="text-h4">Longganisa 500g “100% halal”, no certificate attached</p>${priceBlock({ price: 189 })}<p class="text-body-sm text-muted-foreground">Seller: <a href="#" class="font-bold text-primary underline">Pantry Direct PH</a> · joined 12 days ago · 3 prior warnings</p>
  <p class="rounded-tile bg-mod-flagged-bg p-2 text-body-sm text-mod-flagged"><mark class="bg-transparent font-bold text-mod-flagged">“100% halal”</mark> claimed in the title. <mark class="bg-transparent font-bold text-mod-flagged">“pork fat”</mark> found in the ingredient list.</p>
  <dl class="grid gap-1 text-body-sm"><div class="grid grid-cols-[7rem_1fr] gap-3"><dt class="text-muted-foreground">Halal status</dt><dd>${halalBadge({ status: 'missing' })}</dd></div><div class="grid grid-cols-[7rem_1fr] gap-3"><dt class="text-muted-foreground">Ingredients</dt><dd class="text-foreground">Chicken, <mark class="rounded-badge bg-mod-flagged-bg px-1 font-bold text-mod-flagged">pork fat</mark>, salt, garlic, vinegar</dd></div></dl></div></div>`;
export const previewReview = () => `<div class="grid gap-2">${rating(1, { size: 'size-4' })}<p class="text-body">Fake seller!! <mark class="rounded-badge bg-mod-flagged-bg px-1 text-mod-flagged">[phone number removed]</mark> text me for cheaper price.</p><p class="text-body-sm text-muted-foreground">by a*****n · Order #240311-0021 · Oct 30</p></div>`;
export const previewChat = () => `<div class="grid gap-2 rounded-panel bg-background p-3">
  <p class="text-center text-caption text-muted-foreground">2 earlier messages hidden · context only</p>
  <ol class="grid gap-2" aria-label="Chat excerpt">
    <li class="max-w-[85%] rounded-panel border border-border bg-surface px-3 py-2 text-body"><span class="sr-only">Buyer: </span>Magkano po shipping to Davao?</li>
    <li class="ml-auto max-w-[85%] rounded-panel border-2 border-mod-flagged bg-mod-flagged-bg px-3 py-2 text-body text-foreground"><span class="mb-1 flex items-center gap-1 text-caption font-bold text-mod-flagged">${icon('flag', 'size-3.5')}Reported message</span><span class="sr-only">Seller: </span>Para mas mura, send na lang po sa account ko <mark class="rounded-badge bg-surface px-1 text-foreground">[account no. masked]</mark>, then cancel the order.</li>
    <li class="max-w-[85%] rounded-panel border border-border bg-surface px-3 py-2 text-body"><span class="sr-only">Buyer: </span>Safe po ba yun?</li>
  </ol>
  <p class="text-center text-caption text-muted-foreground">Later messages hidden</p>
</div>`;

/** ModerationDetailPane */
export function detailPane({ id = 'mdp', back = true, preview = previewProduct(), fixedBar = true } = {}) {
  return `<article class="flex h-full min-h-0 flex-col bg-background" aria-labelledby="${id}-h">
  <header class="flex items-center gap-2 border-b border-border bg-surface px-2 py-1 md:px-4">
    ${back ? iconBtn('arrow-left', 'Back to queue', { cls: 'md:hidden' }) : ''}
    <div class="min-w-0 flex-1 overflow-hidden py-1"><p class="text-caption text-muted-foreground">Listing · <span class="tabular">MQ-10482</span> · P1</p><h2 id="${id}-h" class="truncate text-h4">Longganisa “100% halal”: ingredients mention pork fat</h2></div>
    ${statusPill('flagged')}
  </header>
  <div class="grid flex-1 content-start gap-4 overflow-y-auto p-gutter md:p-4">
    <div class="flex flex-wrap gap-x-4 gap-y-1 text-body-sm"><span class="inline-flex items-center gap-1 font-bold text-warning">${icon('clock', 'size-4')}3h 52m · SLA 4h (8 min left)</span><span class="inline-flex items-center gap-1 text-muted-foreground">${icon('flag', 'size-4')}12 reports</span><span class="text-muted-foreground">Assigned to you</span></div>
    <section class="panel p-4" aria-labelledby="${id}-c"><h3 id="${id}-c" class="mb-3 text-label">Reported content</h3>${preview}</section>
    <section class="panel p-4" aria-labelledby="${id}-hv"><div class="mb-3 flex items-center justify-between gap-2"><h3 id="${id}-hv" class="text-label">Halal verification</h3>${halalBadge({ status: 'missing', short: true })}</div>${halalChecklist({ id: `${id}-hl`, items: [['Halal certificate attached', 'fail', 'No file uploaded for this listing.'], ['Certifier is on the current accredited list', 'unknown', 'Nothing to check without a certificate.'], ['Ingredients contain no pork, alcohol or their derivatives', 'fail', '“Pork fat” found in the ingredient list.'], ['Seller has a valid certificate on file for other listings', 'pass', 'Certificate valid to Mar 2028 (covers beef products only).']] })}</section>
    <section class="panel p-4" aria-labelledby="${id}-r"><h3 id="${id}-r" class="mb-3 text-label">Report reasons</h3><ul class="grid gap-2 text-body">${[['Halal claim conflicts with ingredients', 7], ['No certificate shown', 4], ['Other', 1]].map(([r, n]) => `<li class="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1"><span>${r}</span><span class="tabular text-muted-foreground">${n}</span><span class="col-span-2 h-1.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true"><span class="block h-full rounded-full bg-mod-flagged" style="width:${(n / 12) * 100}%"></span></span></li>`).join('')}</ul></section>
    <section class="panel p-4" aria-labelledby="${id}-a"><h3 id="${id}-a" class="mb-3 text-label">History</h3>${auditLog()}</section>
  </div>
  ${actionBar({ fixed: fixedBar, id: `${id}-ab` })}
</article>`;
}
