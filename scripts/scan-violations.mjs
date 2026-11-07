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
        for (const [label, re, ok] of rules)
            for (const m of line.matchAll(re)) {
                if (ok && !ok(m[0], line)) continue;
                n++;
                console.log(`${f}:${i + 1}: ${label}: ${m[0]}`);
            }
    });
}
console.log(n ? `scan: ${n} violation(s)` : 'scan: clean');
process.exit(n ? 1 : 0);
