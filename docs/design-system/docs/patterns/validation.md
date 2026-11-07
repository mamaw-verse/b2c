# Validation rules

## Timing

- Validate a field on **blur once it has been touched**, and live (`input`) after it has an error.
- Submit runs full validation; the first invalid control receives focus — not an error summary click-through (the summary is optional, focus move is required).
- Never validate on first keystroke, never re-validate a passing field aggressively.

## Markup contract

- Required: `required` on the control + visual "Required" affordance (labels state optionality explicitly: "Optional").
- Error: `aria-invalid="true"` on the control + `aria-describedby` → an `id`-stable error `<p>` that starts with the alert icon and a **verbed, specific** message ("Enter the packed weight", not "Invalid").
- Groups (radios, address form): `fieldset` + `legend`, `aria-describedby` on the fieldset; individual radios do not each carry the error.
- Disabled submit buttons are allowed only when the form visibly cannot be submitted; otherwise keep enabled and validate on submit (preferred — a disabled button explains nothing).

## Server errors

- Map server errors back to the same `aria-invalid` fields; a non-field error ("Session expired") becomes a `banner` above the form.

## Phone specifics

- `inputmode`/`enterkeyhint` on every field (`numeric`, `decimal`, `tel`, `email`, `search`).
- Inputs stay ≥ 16px on phone/tablet (prevents iOS zoom); the desktop 14px size is `pointer:fine`-gated.

Components: `formField`, `textInput`, `check`/`fieldset`, `addressForm`, `data-ds-validate` in `ds.js`.
