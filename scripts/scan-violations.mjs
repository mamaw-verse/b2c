// Quality gate (ported from docs/design-system/scripts/scan-violations.mjs):
// no hardcoded hex, px font sizes, rgb()/hsl() literals or marketplace brand
// strings in component/page markup. Semantic tokens only.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'resources/js';

// compat: remove entries as files are restyled to the DS (M1 exit: this list is empty)
const IGNORED = new Set([
    'resources/js/pages/welcome.tsx', // starter marketing page, replaced in M2
    'resources/js/components/ui/sidebar.tsx', // shadcn file, restyled in M1
]);

/** @type {[string, RegExp, ((match: string, line: string) => boolean) | undefined][]} */
const rules = [
    [
        'hardcoded hex colour',
        /#[0-9a-fA-F]{3,8}\b(?![\w-])/g,
        (m, line) =>
            !/href="#|href='#|url\(#|id="#|import |from ['"]#/.test(line) &&
            !/^\s*\/\//.test(line),
    ],
    ['px font size', /(fontSize\s*:\s*['"]?[\d.]+px|text-\[[\d.]+px\])/g],
    ['rgb()/hsl() colour literal', /\b(rgba?|hsla?)\(/g],
    ['hardcoded brand name', /\b(Shopee|Lazada|Acme)\b/g],
    /* Focus indicators live only in resources/css/app.css (.focus-ring /
       .focus-inset). Components never restyle them. */
    [
        'component-level focus override (use the foundation classes)',
        /(?:has-\[:focus[a-z-]*\]|has-focus[a-z-]*|focus-visible|focus-within|focus|\[[^\]"'\s]*focus[^\]"'\s]*\]):(?:ring|outline|border|shadow)\S*/g,
    ],
    ['hardcoded outline width (use --focus-ring-width)', /\boutline-\d+\b/g],
    [
        'outline removed without a focus replacement',
        /\boutline-(?:none|0)\b/g,
        (m, line) =>
            !/focus(-visible|-within)?:|has-\[?:?[^\s"']*focus|\bfocus-ring\b/.test(
                line,
            ),
    ],
    [
        'removed sale colour token',
        /\b(?:bg-sale|text-sale|badge-sale|--sale)\b/g,
    ],
    ['placeholder link href="#"', /href\s*[:=]\s*["']#["']/g],
    [
        'aria-pressed on a link (navigation uses aria-current)',
        /aria-pressed/g,
        (m, line) => /<Link|<a\s/.test(line),
    ],
];

/** @type {[string, RegExp, ((match: string, line: string) => boolean) | undefined][]} */
const PAGES_RULES = [
    /* Pages share one .page gutter; horizontal scrollers use .bleed-x. */
    [
        'page-level gutter padding (use .page / .bleed-x)',
        /\b(?:px-gutter|md:px-0|lg:px-0)\b/g,
    ],
];

/* CSS pass: no focus indicators outside the foundation file
   (resources/css/app.css is the only allowed place). */
const CSS_RULES = [
    [
        'focus style outside the foundation file',
        /:focus(?:-visible|-within)?|(?:^|[;{])\s*outline(-\w+)?\s*:|\bfocus-ring|\bfocus-inset\b/g,
    ],
];

function* walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) yield* walk(p);
        else if (/\.(tsx?|jsx?)$/.test(entry.name)) yield p;
    }
}

let n = 0;
for (const f of walk(ROOT)) {
    if (IGNORED.has(f)) continue;
    const s = fs.readFileSync(f, 'utf8');
    s.split('\n').forEach((line, i) => {
        const scoped = f.startsWith('resources/js/pages')
            ? rules.concat(PAGES_RULES)
            : rules;
        for (const [label, re, ok] of scoped)
            for (const m of line.matchAll(re)) {
                if (ok && !ok(m[0], line)) continue;
                n++;
                console.log(`${f}:${i + 1}: ${label}: ${m[0]}`);
            }
    });
}
for (const f of fs.existsSync('resources/css')
    ? fs
          .readdirSync('resources/css')
          .filter((x) => x.endsWith('.css') && x !== 'app.css')
          .map((x) => 'resources/css/' + x)
    : []) {
    const s = fs.readFileSync(f, 'utf8');
    s.split('\n').forEach((line, i) => {
        for (const [label, re, ok] of CSS_RULES)
            for (const m of line.matchAll(re)) {
                if (ok && !ok(m[0], line, f)) continue;
                n++;
                console.log(`${f}:${i + 1}: ${label}: ${m[0]}`);
            }
    });
}
/* Config pass: storefront chrome must not ship placeholder values. */
if (fs.existsSync('config/marketplace.php')) {
    const s = fs.readFileSync('config/marketplace.php', 'utf8');
    s.split('\n').forEach((line, i) => {
        for (const m of line.matchAll(/example\.com|["']#["']/g)) {
            n++;
            console.log(
                `config/marketplace.php:${i + 1}: placeholder value: ${m[0]}`,
            );
        }
    });
}

console.log(n ? `scan: ${n} violation(s)` : 'scan: clean');
process.exit(n ? 1 : 0);
