// WCAG contrast gate for the design-system tokens in resources/css/app.css.
// Parses the :root and .dark token maps and asserts foreground/background
// pairs meet 4.5:1 (text) or 3:1 (non-text UI components).
// Run directly: node tests/Unit/contrast.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync('resources/css/app.css', 'utf8');

/** Token map from CSS text: `--name: hex | var(--other)` with --other resolved. */
function tokens(cssText, fallback = new Map()) {
    const map = new Map(fallback);
    for (const m of cssText.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
        map.set(m[1], m[2].trim());
    }
    const resolve = (name, depth = 0) => {
        if (depth > 5) return null;
        const raw = map.get(name);
        if (!raw) return null;
        const v = raw.match(/^var\(--([\w-]+)\)$/) ? resolve(raw.match(/^var\(--([\w-]+)\)$/)[1], depth + 1) : raw;
        return /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : null;
    };
    const out = {};
    for (const k of map.keys()) out[k] = resolve(k);
    return out;
}

function lum(hex) {
    const h = hex.replace('#', '');
    const full = h.length <= 4 ? [...h].map((c) => c + c).join('') : h;
    const rgb = [0, 2, 4].map((o) => parseInt(full.slice(o, o + 2), 16) / 255);
    const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

// [foreground token, background token, minimum ratio, label]
const PAIRS = [
    ['foreground', 'surface', 4.5, 'body text'],
    ['muted-foreground', 'surface', 4.5, 'muted text'],
    ['primary-text', 'surface', 4.5, 'primary text'],
    ['primary-text', 'primary-soft', 4.5, 'primary text on soft'],
    ['nav-active', 'surface', 4.5, 'nav active'],
    ['promo', 'surface', 4.5, 'promo text'],
    ['promo', 'promo-soft', 4.5, 'promo on soft'],
    /* --rating amber is decorative-only (stars); the rating numeral uses
       --rating-foreground and regular text tokens. */
    ['rating-foreground', 'surface', 4.5, 'rating text'],
    ['halal', 'halal-soft', 4.5, 'halal badge'],
    ['danger-text', 'surface', 4.5, 'danger text'],
    ['danger-text', 'danger-soft', 4.5, 'danger on soft'],
    ['success-text', 'surface', 4.5, 'success text'],
    ['success-text', 'success-soft', 4.5, 'success on soft'],
    ['warning-text', 'warning-soft', 4.5, 'warning on soft'],
    ['info-text', 'info-soft', 4.5, 'info on soft'],
    ['foreground-inverse', 'primary', 4.5, 'inverse on primary'],
    ['border-control', 'surface', 3.0, 'control border'],
    ['#ffffff', 'promo-solid-bg', 4.5, 'promo badge'],
];

// app.css declares all light tokens in :root blocks before the `.dark {`
// block that overrides them. Light = everything before `.dark {`; dark =
// its balanced-brace body layered over the light map.
const darkStart = css.indexOf('.dark {');
assert.notStrictEqual(darkStart, -1, '.dark block not found in app.css');
let darkEnd = css.indexOf('{', darkStart);
let depth = 0;
for (let i = darkEnd; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}') depth--;
    if (depth === 0) {
        darkEnd = i;
        break;
    }
}

const scopes = {
    light: tokens(css.slice(0, darkStart)),
    dark: tokens(css.slice(darkStart, darkEnd), (() => {
        const m = new Map();
        for (const mm of css.slice(0, darkStart).matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
            m.set(mm[1], mm[2].trim());
        }
        return m;
    })()),
};

let n = 0;
for (const [scope, t] of Object.entries(scopes)) {
    for (const [fg, bg, min, label] of PAIRS) {
        const f = fg.startsWith('#') ? fg : t[fg];
        const b = bg.startsWith('#') ? bg : t[bg];
        if (!f || !b) {
            n++;
            console.log(`contrast[${scope}]: missing token ${!f ? fg : bg} (${label})`);
            continue;
        }
        const r = ratio(f, b);
        if (r < min) {
            n++;
            console.log(`contrast[${scope}]: ${fg} on ${bg} = ${r.toFixed(2)} < ${min} (${label})`);
        }
    }
}
console.log(n ? `contrast: ${n} failure(s)` : 'contrast: all pairs pass');
process.exit(n ? 1 : 0);
