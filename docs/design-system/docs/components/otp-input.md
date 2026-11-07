# OTP input

Forms · Phase 2 · Live sheet: `styleguide/components/otp-input.html`

## 1. Purpose
Six-digit verification code from SMS/email, with autofill support.

**Use when**
- Login, phone verification, payout changes.

**Don't use when**
- Passwords.

## 2. Anatomy
1. `fieldset` + legend.
2. 6 inputs (44×48), first has `autocomplete=one-time-code`.
3. Resend link with countdown (consumer).

## 3. Variants and sizes
| Variant / size | Markup / prop | Use for |
|---|---|---|
| 6 digits | default |  |
| 4 digits | `length: 4` |  |

## 4. States
| State | Status |
|---|---|
| Default | rendered |
| Hover (pointer only) | n/a: Field hover. |
| Pressed | n/a: n/a |
| Focus-visible | rendered |
| Disabled | n/a: Disable all boxes while verifying. |
| Loading | n/a: Submit button shows loading. |
| Error | rendered |
| Selected | rendered |
| Empty | n/a: Default is empty. |
| Skeleton | n/a: n/a |

## 5. Responsive behaviour
| Tier | Behaviour |
|---|---|
| Phone (base, 360px+) | 6 × 44px + gaps fits 360px. |
| Tablet (md, 768px+) | Same. |
| Desktop (lg, 1024px+) | Same. |

## 6. API / props
| Prop | Type | Default | Notes |
|---|---|---|---|
| length | number | 6 |  |
| value | string |  |  |
| error | string | — |  |

## 7. Accessibility
| Aspect | Requirement |
|---|---|
| Role | Group of text inputs. |
| Accessible name | Each box “Digit n of 6”; legend names the group. |
| Keyboard | Typing advances; Backspace goes back; paste fills all. |
| Focus management | Auto-advance on input. |
| ARIA | — |
| Touch target | 44px minimum (`min-h-touch`); primary actions 48px. |
| Reduced motion | Transitions use `--dur*` tokens, which collapse to 1ms under `prefers-reduced-motion`. |
| Announcements | Error linked via fieldset describedby. |

## 8. Tokens used
`--border-control`, `--danger`, `--dur`, `--ease-out`, `--foreground`, `--fs-body-sm`, `--fs-h3`, `--fs-input`, `--fs-label`, `--muted-foreground`, `--primary`, `--r-field`, `--ring`, `--subtle-foreground`, `--surface`, `--surface-muted`, `--touch-min`, `--touch-primary`, `currentColor (icons)`

## 9. Content rules
- Say where the code was sent: “Sent to +63 917 ••• 4567”.

## 10. Do / Don't
**Do**
- Support paste and SMS autofill.

**Don't**
- Don’t auto-submit on the 6th digit without a visible button.

## 11. HTML usage
```html
<div class="grid gap-3">
  <fieldset class="grid gap-2">
    <legend class="mb-1 text-label">Verification code</legend>
    <div class="flex gap-2" data-ds-otp><input id="otp1-1" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="one-time-code" aria-label="Digit 1 of 6" value="4" class="field min-h-touch-primary w-11 px-0 text-center text-h3 tabular"><input id="otp1-2" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="off" aria-label="Digit 2 of 6" value="8" class="field min-h-touch-primary w-11 px-0 text-center text-h3 tabular"><input id="otp1-3" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="off" aria-label="Digit 3 of 6" value="2" class="field min-h-touch-primary w-11 px-0 text-center text-h3 tabular"><input id="otp1-4" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="off" aria-label="Digit 4 of 6" value="1" class="field min-h-touch-primary w-11 px-0 text-center text-h3 tabular"><input id="otp1-5" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="off" aria-label="Digit 5 of 6" value="" class="field min-h-touch-primary w-11 px-0 text-center text-h3 tabular"><input id="otp1-6" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="off" aria-label="Digit 6 of 6" value="" class="field min-h-touch-primary w-11 px-0 text-center text-h3 tabular"></div>
  </fieldset>
  <p class="text-body-sm text-muted-foreground">Didn’t get it? 
    <button type="button" class="inline-flex min-h-touch items-center font-bold text-primary underline" disabled>Resend in 0:42</button>
  </p>
</div>
```

## 12. Test notes
- Paste of 6 digits fills all boxes.
- Fits at 360px without overflow.
