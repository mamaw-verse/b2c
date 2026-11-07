import { esc, cx, attrs, icon, iconBtn, btn, media, visuallyHiddenLive } from './core.mjs';

/** FormField wrapper: label, control, help, error (help and error are linked via aria-describedby). */
export function formField({ id, label, control, help, error, required, optional, counter, hideLabel, cls, labelAction }) {
  const req = required ? `<span class="text-danger" aria-hidden="true"> *</span>` : optional ? ` <span class="font-normal text-muted-foreground">(optional)</span>` : '';
  const helpHtml = help ? `<p id="${id}-help" class="text-body-sm text-muted-foreground">${help}</p>` : '';
  const errHtml = `<p id="${id}-error" class="flex items-start gap-1 text-body-sm font-bold text-danger"${error ? '' : ' hidden'}>${icon('circle-alert', 'mt-px size-4')}<span>${error || 'Please fill in this field.'}</span></p>`;
  const count = counter ? `<p id="${id}-count" class="ml-auto shrink-0 text-body-sm text-muted-foreground tabular">${counter}</p>` : '';
  return `<div class="${cx('grid gap-1.5', cls)}">
  <div class="flex items-baseline justify-between gap-2"><label for="${id}" class="${cx('text-label text-foreground', hideLabel && 'sr-only')}">${label}${req}</label>${labelAction || ''}</div>
  ${control}
  ${helpHtml || count ? `<div class="flex gap-2">${helpHtml}${count}</div>` : ''}
  ${errHtml}
</div>`;
}
const described = (id, { help, counter }) => [help && `${id}-help`, `${id}-error`, counter && `${id}-count`].filter(Boolean).join(' ');

export function textInput({ id, ariaLabel, type = 'text', value, placeholder, error, disabled, readonly, required, inputmode, autocomplete, help, counter, maxlength, prefix, suffix, force, cls, extra = {} }) {
  const input = `<input id="${id}" type="${type}" class="${cx('field', prefix && 'pl-12', suffix && 'pr-12', cls)}"${attrs({ value, placeholder, disabled, readonly, required, inputmode, autocomplete, maxlength, 'aria-invalid': error ? 'true' : null, 'aria-describedby': described(id, { help, counter }), 'aria-label': ariaLabel, 'data-force': force, ...extra })}>`;
  if (!prefix && !suffix) return input;
  return `<div class="relative">${prefix ? `<span class="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-muted-foreground">${prefix}</span>` : ''}${input}${suffix ? `<span class="absolute inset-y-0 right-0 flex items-center">${suffix}</span>` : ''}</div>`;
}

export const textarea = ({ id, ariaLabel, value = '', placeholder, error, disabled, maxlength, rows = 4, help, counter, force }) =>
  `<textarea id="${id}" rows="${rows}" class="field"${attrs({ placeholder, disabled, maxlength, 'aria-invalid': error ? 'true' : null, 'aria-describedby': described(id, { help, counter }), 'data-ds-counter': counter ? `${id}-count` : null, 'aria-label': ariaLabel, 'data-force': force })}>${esc(value)}</textarea>`;

export const select = ({ id, ariaLabel, options, value, error, disabled, help, placeholder, force }) =>
  `<div class="relative"><select id="${id}" class="field"${attrs({ disabled, 'aria-invalid': error ? 'true' : null, 'aria-describedby': described(id, { help }), 'aria-label': ariaLabel, 'data-force': force })}>${placeholder ? `<option value="">${placeholder}</option>` : ''}${options.map(o => `<option${o === value ? ' selected' : ''}>${o}</option>`).join('')}</select>${icon('chevron-down', 'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground')}</div>`;

/** Checkbox / radio: native input, 20px box inside a 44px row. */
export function check({ id, name, label, desc, type = 'checkbox', checked, disabled, error, indeterminate, force, value, cls, extra = {} }) {
  return `<label for="${id}" class="${cx('flex min-h-touch items-start gap-3 py-2.5', disabled && 'cursor-not-allowed text-muted-foreground', cls)}">
  <input id="${id}" type="${type}" class="mt-0.5 size-5 shrink-0 accent-primary"${attrs({ name, value, checked, disabled, 'aria-invalid': error ? 'true' : null, 'data-ds-indeterminate': indeterminate, 'data-force': force, 'aria-describedby': desc ? `${id}-desc` : null, ...extra })}>
  <span class="grid gap-0.5"><span class="text-body">${label}</span>${desc ? `<span id="${id}-desc" class="text-body-sm text-muted-foreground">${desc}</span>` : ''}</span>
</label>`;
}
export const fieldset = ({ legend, children, error, id, hint, cls }) =>
  `<fieldset class="${cx('grid', cls)}"${error ? ` aria-describedby="${id}-error"` : ''}><legend class="mb-1 text-label">${legend}</legend>${hint ? `<p class="mb-1 text-body-sm text-muted-foreground">${hint}</p>` : ''}${children}${error ? `<p id="${id}-error" class="mt-1 flex items-start gap-1 text-body-sm font-bold text-danger">${icon('circle-alert', 'mt-px size-4')}${error}</p>` : ''}</fieldset>`;

/** Switch: native checkbox with role="switch" (state is announced as on/off). */
export const switchCtl = ({ id, label, desc, checked, disabled, force }) =>
  `<label for="${id}" class="${cx('flex min-h-touch items-center justify-between gap-4 py-2', disabled && 'cursor-not-allowed text-muted-foreground')}">
  <span class="grid gap-0.5"><span class="text-body">${label}</span>${desc ? `<span class="text-body-sm text-muted-foreground">${desc}</span>` : ''}</span>
  <input id="${id}" type="checkbox" role="switch" class="relative h-7 w-12 shrink-0 cursor-pointer appearance-none rounded-full bg-border-control transition-colors duration-token before:absolute before:left-1 before:top-1 before:size-5 before:rounded-full before:bg-surface before:shadow-popover before:transition-transform before:duration-token checked:bg-primary checked:before:translate-x-5 hover:bg-muted-foreground checked:hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"${attrs({ checked, disabled, 'data-force': force })}>
</label>`;

/** Quantity stepper: −/+ buttons around a numeric input. */
export const stepper = ({ id, value = 1, min = 1, max = 99, label = 'Quantity', size = 'md', disabled }) =>
  `<div class="focus-ring inline-flex items-stretch overflow-hidden rounded-field border border-border-control bg-surface" data-ds-stepper role="group" aria-label="${label}">
  <button type="button" class="${cx('btn btn-ghost btn-icon rounded-none border-0 text-foreground hover:bg-surface-muted active:bg-border disabled:text-muted-foreground')}" data-ds-step="-1" aria-label="Decrease ${label.toLowerCase()}"${disabled || value <= min ? ' disabled' : ''}>${icon('minus', 'size-4')}</button>
  <label for="${id}" class="sr-only">${label}</label>
  <input id="${id}" type="text" inputmode="numeric" pattern="[0-9]*" value="${value}" min="${min}" max="${max}" class="w-12 border-x border-border-control bg-transparent text-center text-input font-bold tabular"${disabled ? ' disabled' : ''}>
  <button type="button" class="${cx('btn btn-ghost btn-icon rounded-none border-0 text-foreground hover:bg-surface-muted active:bg-border disabled:text-muted-foreground')}" data-ds-step="1" aria-label="Increase ${label.toLowerCase()}"${disabled || value >= max ? ' disabled' : ''}>${icon('plus', 'size-4')}</button>
  ${visuallyHiddenLive()}
</div>`;

/** PH mobile number: fixed +63 prefix, 10 digits formatted 9XX XXX XXXX. */
export const phoneInput = ({ id, ariaLabel, value = '', error, disabled, force }) =>
  `<label for="${id}" class="${cx('field focus-ring flex items-stretch p-0 cursor-text overflow-hidden', error && 'border-danger hover:border-danger')}">
  <span class="inline-flex items-center gap-1 border-r border-border-control bg-surface-muted px-3 text-input text-foreground select-none" aria-hidden="true">+63</span>
  <input id="${id}" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="9XX XXX XXXX" maxlength="12" class="min-w-0 flex-1 bg-transparent px-3 text-input text-foreground placeholder:text-subtle-foreground disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground" data-ds-phone${attrs({ value, disabled, 'aria-invalid': error ? 'true' : null, 'aria-describedby': ariaLabel ? null : `${id}-help ${id}-error`, 'aria-label': ariaLabel, 'data-force': force })}>
</label>`;

/** OTP: 6 single-digit inputs inside a fieldset; autocomplete=one-time-code on the first box. */
export const otp = ({ id, length = 6, values = '', error, legend = 'Verification code' }) =>
  `<fieldset class="grid gap-2"${error ? ` aria-describedby="${id}-error"` : ''}><legend class="mb-1 text-label">${legend}</legend>
  <div class="flex gap-2" data-ds-otp>${Array.from({ length }, (_, i) => `<input id="${id}-${i + 1}" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" ${i === 0 ? 'autocomplete="one-time-code"' : 'autocomplete="off"'} aria-label="Digit ${i + 1} of ${length}" value="${values[i] || ''}" class="field min-h-touch-primary w-11 px-0 text-center text-h3 tabular"${error ? ' aria-invalid="true"' : ''}>`).join('')}</div>
  ${error ? `<p id="${id}-error" class="flex items-start gap-1 text-body-sm font-bold text-danger">${icon('circle-alert', 'mt-px size-4')}${error}</p>` : ''}
</fieldset>`;

/** SearchInput with suggestions (combobox). */
export function searchInput({ id, value = '', placeholder = 'Search products', suggestions = [], open, label = 'Search', recent, cls, size = 'md' }) {
  return `<form role="search" class="${cx('relative', cls)}" data-ds-combobox action="#" onsubmit="return false">
  <label for="${id}" class="sr-only">${label}</label>
  ${icon('search', 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground')}
  <input id="${id}" type="search" role="combobox" aria-autocomplete="list" aria-expanded="${open && suggestions.length ? 'true' : 'false'}" aria-controls="${id}-list" autocomplete="off" enterkeyhint="search" value="${esc(value)}" placeholder="${placeholder}" class="${cx('field rounded-search pl-10 pr-3', size === 'lg' && 'min-h-touch-primary')}" data-ds-open-on-focus>
  <ul id="${id}-list" role="listbox" aria-label="Suggestions" class="absolute inset-x-0 top-full z-sheet mt-1 max-h-80 overflow-auto rounded-panel border border-border bg-surface py-1 shadow-popover"${open && suggestions.length ? '' : ' hidden'}>
    ${recent ? `<li role="presentation" class="px-3 pb-1 pt-2 text-eyebrow uppercase text-muted-foreground">${recent}</li>` : ''}
    ${suggestions.map((s, i) => `<li id="${id}-opt-${i}" role="option" aria-selected="false" class="flex min-h-touch cursor-pointer items-center gap-3 px-3 text-body aria-selected:bg-primary-soft hover:bg-surface-muted">${icon('search', 'size-4 text-muted-foreground')}<span>${s}</span></li>`).join('')}
  </ul>
  <p data-ds-empty hidden class="absolute inset-x-0 top-full z-sheet mt-1 rounded-panel border border-border bg-surface px-3 py-3 text-body text-muted-foreground shadow-popover">No matches. Press Enter to search anyway.</p>
  ${visuallyHiddenLive()}
</form>`;
}

/** Combobox: filterable single-select (e.g. city / barangay). */
export function combobox({ id, label, options, value = '', open, required, help, error }) {
  const control = `<div class="relative" data-ds-combobox>
  <input id="${id}" type="text" role="combobox" aria-autocomplete="list" aria-expanded="${open && options.length ? 'true' : 'false'}" aria-controls="${id}-list" autocomplete="off" value="${esc(value)}" class="field pr-10"${attrs({ required, 'aria-invalid': error ? 'true' : null, 'aria-describedby': `${help ? id + '-help ' : ''}${id}-error` })} data-ds-open-on-focus>
  ${icon('chevron-down', 'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground')}
  <ul id="${id}-list" role="listbox" aria-label="${label}" class="absolute inset-x-0 top-full z-sheet mt-1 max-h-64 overflow-auto rounded-panel border border-border bg-surface py-1 shadow-popover"${open && options.length ? '' : ' hidden'}>
    ${options.map((o, i) => `<li id="${id}-opt-${i}" role="option" aria-selected="${o === value}" class="flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body aria-selected:bg-primary-soft aria-selected:font-bold hover:bg-surface-muted">${o}</li>`).join('')}
  </ul>
  <p data-ds-empty hidden class="absolute inset-x-0 top-full z-sheet mt-1 rounded-panel border border-border bg-surface px-3 py-3 text-body text-muted-foreground shadow-popover">No matches</p>
  ${visuallyHiddenLive()}
</div>`;
  return formField({ id, label, control, help, error, required });
}

/** ImageUploader: multi-image grid with cover, reorder, remove, progress and error tiles. */
export function uploader({ id, tiles = [], max = 9, label = 'Product photos', help }) {
  const tile = (t, i, tpl) => `<li class="relative" data-name="${esc(t.name)}">
    <div class="relative aspect-square overflow-hidden rounded-tile border ${t.error ? 'border-danger bg-danger-soft' : 'border-border bg-surface-muted'}">
      ${t.error ? `<div class="grid h-full place-items-center p-2 text-center text-caption font-bold text-danger">${icon('triangle-alert', 'mx-auto size-5')}${t.error}</div>` : `${tpl ? '<img alt="" class="size-full object-cover">' : media(t.name, { i, ic: 'image', ratio: 'size-full' })}${t.progress != null ? `<div class="absolute inset-x-2 bottom-2 h-1.5 overflow-hidden rounded-full bg-surface" role="progressbar" aria-label="Uploading ${esc(t.name)}" aria-valuenow="${t.progress}" aria-valuemin="0" aria-valuemax="100"><div class="h-full bg-primary" style="width:${t.progress}%"></div></div>` : ''}`}
      ${i === 0 && !t.error ? `<span class="badge badge-solid absolute left-1 top-1">Cover</span>` : ''}
    </div>
    <button type="button" class="btn btn-icon btn-neutral btn-sm absolute right-0 top-0 rounded-full border-transparent text-danger shadow-popover" data-ds-remove aria-label="Remove ${esc(t.name)}">${icon('x', 'size-4')}</button>
    <div class="mt-1 flex justify-between">
      <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="-1" aria-label="Move ${esc(t.name)} earlier">${icon('chevron-left', 'size-4')}</button>
      <button type="button" class="btn btn-ghost btn-icon text-foreground" data-ds-move="1" aria-label="Move ${esc(t.name)} later">${icon('chevron-right', 'size-4')}</button>
    </div>
  </li>`;
  return `<div class="grid gap-2" data-ds-uploader>
  <div class="flex items-baseline justify-between"><p id="${id}-label" class="text-label">${label}</p><p class="text-body-sm text-muted-foreground tabular">${tiles.length} / ${max}</p></div>
  ${help ? `<p class="text-body-sm text-muted-foreground">${help}</p>` : ''}
  <ul class="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-2" data-ds-tiles aria-labelledby="${id}-label">
    ${tiles.map(tile).join('')}
    <li data-ds-add><label for="${id}" class="grid aspect-square cursor-pointer place-items-center rounded-tile border-2 border-dashed border-border-control bg-surface text-center text-body-sm font-bold text-primary hover:bg-primary-soft focus-ring"><span>${icon('image-plus', 'mx-auto size-6')}Add photo</span></label><input id="${id}" type="file" accept="image/*" multiple class="sr-only"></li>
  </ul>
  <template>${tile({ name: '' }, 1, true)}</template>
  ${visuallyHiddenLive()}
</div>`;
}

/** RatingInput: 5 native radios; labels are star buttons. */
export function ratingInput({ id, legend = 'Rate this product', value = 0, error, size = 'size-9' }) {
  return `<fieldset class="grid gap-1"${error ? ` aria-describedby="${id}-error"` : ''}><legend class="text-label">${legend}</legend>
  <div class="flex" data-ds-rating>${[1, 2, 3, 4, 5].map(n => `<input type="radio" id="${id}-${n}" name="${id}" value="${n}" class="sr-only"${n === value ? ' checked' : ''}><label for="${id}-${n}" class="grid min-h-touch min-w-touch place-items-center text-border-control data-[on]:text-rating rounded-button focus-ring"${n <= value ? ' data-on' : ''}><svg class="icon ${size} fill-current" aria-hidden="true"><use href="#i-star"/></svg><span class="sr-only">${n} star${n > 1 ? 's' : ''}</span></label>`).join('')}</div>
  ${error ? `<p id="${id}-error" class="flex items-start gap-1 text-body-sm font-bold text-danger">${icon('circle-alert', 'mt-px size-4')}${error}</p>` : ''}
</fieldset>`;
}

/** PH address form group: region → province → city/municipality → barangay, street, postal, label. */
export function addressForm({ id = 'addr', errors = {} } = {}) {
  return `<form class="grid gap-4 md:grid-cols-2" data-ds-validate novalidate>
  ${formField({ id: `${id}-name`, label: 'Full name', required: true, control: textInput({ id: `${id}-name`, autocomplete: 'name', required: true, value: 'Maria Santos' }) })}
  ${formField({ id: `${id}-phone`, label: 'Mobile number', required: true, help: 'For delivery updates only.', error: errors.phone, control: phoneInput({ id: `${id}-phone`, value: errors.phone ? '917 12' : '917 123 4567', error: errors.phone }) })}
  ${formField({ id: `${id}-region`, label: 'Region', required: true, control: select({ id: `${id}-region`, value: 'NCR (National Capital Region)', options: ['NCR (National Capital Region)', 'Region III (Central Luzon)', 'Region IV-A (CALABARZON)', 'Region VII (Central Visayas)', 'Region XI (Davao Region)'] }) })}
  ${formField({ id: `${id}-province`, label: 'Province', required: true, control: select({ id: `${id}-province`, value: 'Metro Manila', options: ['Metro Manila'] }) })}
  ${combobox({ id: `${id}-city`, label: 'City / Municipality', required: true, value: 'Quezon City', options: ['Caloocan', 'Makati', 'Manila', 'Marikina', 'Pasig', 'Quezon City', 'Taguig'] })}
  ${combobox({ id: `${id}-brgy`, label: 'Barangay', required: true, value: '', error: errors.barangay, options: ['Bagumbayan', 'Commonwealth', 'Diliman', 'Loyola Heights', 'Teachers Village East'] })}
  ${formField({ id: `${id}-street`, label: 'Street, building, house no.', required: true, cls: 'md:col-span-2', control: textInput({ id: `${id}-street`, autocomplete: 'address-line1', required: true, value: 'Unit 4B, 12 Maginhawa St.' }) })}
  ${formField({ id: `${id}-postal`, label: 'Postal code', required: true, control: textInput({ id: `${id}-postal`, inputmode: 'numeric', autocomplete: 'postal-code', maxlength: 4, required: true, value: '1101' }) })}
  ${formField({ id: `${id}-landmark`, label: 'Landmark', optional: true, control: textInput({ id: `${id}-landmark`, placeholder: 'e.g. beside the sari-sari store' }) })}
  <fieldset class="md:col-span-2"><legend class="mb-1 text-label">Label as</legend><div class="flex gap-2">
    ${['Home', 'Work'].map((l, i) => `<label class="flex min-h-touch cursor-pointer items-center gap-2 rounded-button border border-border-control px-4 text-label has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary-soft-foreground focus-ring"><input type="radio" name="${id}-label" class="sr-only"${i === 0 ? ' checked' : ''}>${icon(i ? 'building-2' : 'house', 'size-4')}${l}</label>`).join('')}
  </div></fieldset>
  ${check({ id: `${id}-default`, label: 'Set as default address', checked: true, cls: 'md:col-span-2' })}
  <div class="md:col-span-2">${btn('Save address', { size: 'lg', block: true, type: 'submit', cls: 'md:w-auto' })}</div>
</form>`;
}

export { iconBtn };
