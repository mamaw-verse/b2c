// Structured-data validator (docs/planning/14 T5.1).
//
// Mirrors app/Support/Schema/JsonLdValidator.php so a deployed site can be checked
// without PHP:
//
//   node scripts/validate-jsonld.mjs --base-url https://staging.example.com
//   node scripts/validate-jsonld.mjs --base-url https://staging.example.com /products/some-slug /sellers
//   node scripts/validate-jsonld.mjs --file saved-page.html
//
// `npm run check` only runs the hermetic self-test (tests/Unit/jsonld-validator.test.mjs);
// crawling a live origin is a pre-release step (T5.2), never part of CI.
//
// The PHP validator is authoritative. Keep the two rule sets in step.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const CONTEXT = 'https://schema.org';
const URL_KEYS = new Set([
    'url',
    'image',
    'logo',
    'contentUrl',
    'item',
    'sameAs',
    'primaryImageOfPage',
]);
const PAGE_TYPES = new Set([
    'WebPage',
    'CollectionPage',
    'AboutPage',
    'ProfilePage',
    'ContactPage',
    'ItemPage',
]);
const DEFAULT_PATHS = ['/', '/sellers', '/why-choose-us', '/seller/terms'];

const isObject = (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value);
const typesOf = (node) => {
    const type = node['@type'];
    if (typeof type === 'string' && type !== '') return [type];
    return Array.isArray(type)
        ? type.filter((t) => typeof t === 'string' && t !== '')
        : [];
};

/** @returns {string[]} raw contents of every JSON-LD script block */
export function extractBlocks(html) {
    const blocks = [];
    const pattern =
        /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    for (const match of html.matchAll(pattern)) blocks.push(match[1].trim());
    return blocks;
}

/** @returns {{errors: string[], warnings: string[]}} */
export function validateHtml(html, externalIds = []) {
    const blocks = extractBlocks(html);
    if (blocks.length === 0)
        return {
            errors: ['No <script type="application/ld+json"> block found.'],
            warnings: [],
        };
    if (blocks.length > 1) {
        return {
            errors: [
                `Expected exactly one JSON-LD block, found ${blocks.length}.`,
            ],
            warnings: [],
        };
    }
    let document;
    try {
        document = JSON.parse(blocks[0]);
    } catch (error) {
        return {
            errors: [`JSON-LD block is not valid JSON (${error.message}).`],
            warnings: [],
        };
    }
    return validateDocument(document, externalIds);
}

/** @returns {{errors: string[], warnings: string[]}} */
export function validateDocument(document, externalIds = []) {
    const errors = [];
    const warnings = [];

    if (!isObject(document) || document['@context'] !== CONTEXT)
        errors.push(`@context must be ${CONTEXT}.`);

    const graph = isObject(document) ? document['@graph'] : undefined;
    if (!Array.isArray(graph) || graph.length === 0) {
        errors.push('@graph must be a non-empty list of nodes.');
        return { errors, warnings };
    }

    const topLevelIds = [];
    graph.forEach((node, index) => {
        if (!isObject(node) || typesOf(node).length === 0) {
            errors.push(`@graph[${index}] has no @type.`);
            return;
        }
        if (typeof node['@id'] === 'string') {
            if (topLevelIds.includes(node['@id']))
                errors.push(`@graph[${index}] repeats the @id ${node['@id']}.`);
            topLevelIds.push(node['@id']);
        }
    });

    const refs = [];
    const ids = [];
    walk(graph, '@graph', null, { errors, warnings, refs, ids });

    const known = new Set([...topLevelIds, ...ids, ...externalIds]);
    for (const ref of new Set(refs)) {
        if (!known.has(ref))
            errors.push(
                `Reference to ${ref} does not resolve inside the graph.`,
            );
    }

    return { errors, warnings };
}

function walk(value, path, parentKey, ctx) {
    const entries = Array.isArray(value)
        ? value.map((item, index) => [index, item])
        : Object.entries(value);

    for (const [key, item] of entries) {
        const isIndex = typeof key === 'number';
        const itemPath = isIndex ? `${path}[${key}]` : `${path}.${key}`;
        const effectiveKey = isIndex ? parentKey : key;

        if (item === null || item === undefined || item === '') {
            ctx.errors.push(`${itemPath} is empty.`);
            continue;
        }

        if (typeof item !== 'object') {
            if (
                typeof item === 'string' &&
                URL_KEYS.has(effectiveKey) &&
                !/^https?:\/\//i.test(item)
            ) {
                ctx.errors.push(
                    `${itemPath} must be an absolute URL, got "${item}".`,
                );
            }
            continue;
        }

        if (
            Array.isArray(item)
                ? item.length === 0
                : Object.keys(item).length === 0
        ) {
            ctx.errors.push(`${itemPath} is an empty array.`);
            continue;
        }

        if (isObject(item)) {
            if (typeof item['@id'] === 'string') {
                (Object.keys(item).length === 1 ? ctx.refs : ctx.ids).push(
                    item['@id'],
                );
            }
            if (typesOf(item).length > 0) checkNode(item, itemPath, ctx);
        }

        walk(item, itemPath, effectiveKey, ctx);
    }
}

function needs(node, keys, path, errors) {
    for (const key of keys) {
        if (node[key] === undefined || node[key] === null)
            errors.push(`${path} is missing required property "${key}".`);
    }
}

function checkNode(node, path, { errors, warnings }) {
    const isTopLevel = /^@graph\[\d+\]$/.test(path);
    const isFullNode = isTopLevel || /\.hasVariant\[\d+\]$/.test(path);
    const has = (key) => node[key] !== undefined && node[key] !== null;

    for (const type of typesOf(node)) {
        if (type === 'Product' || type === 'ProductGroup') {
            needs(node, ['name'], path, errors);
            if (!isFullNode) continue;
            if (type === 'ProductGroup')
                needs(node, ['hasVariant'], path, errors);
            else if (
                !has('offers') &&
                !has('aggregateRating') &&
                !has('review')
            ) {
                errors.push(
                    `${path} (Product) needs offers, aggregateRating or review.`,
                );
            }
            if (!has('image')) warnings.push(`${path} (Product) has no image.`);
        } else if (type === 'Offer') {
            needs(
                node,
                ['price', 'priceCurrency', 'availability'],
                path,
                errors,
            );
            if (has('price') && Number.isNaN(Number(node.price)))
                errors.push(`${path}.price must be numeric.`);
        } else if (type === 'AggregateRating') {
            needs(node, ['ratingValue'], path, errors);
            if (!has('reviewCount') && !has('ratingCount'))
                errors.push(
                    `${path} (AggregateRating) needs reviewCount or ratingCount.`,
                );
        } else if (type === 'Review') {
            needs(node, ['author', 'reviewRating'], path, errors);
        } else if (type === 'BreadcrumbList') {
            needs(node, ['itemListElement'], path, errors);
            [].concat(node.itemListElement ?? []).forEach((crumb, position) => {
                if (
                    !isObject(crumb) ||
                    crumb.position === undefined ||
                    crumb.name === undefined
                ) {
                    errors.push(
                        `${path}.itemListElement[${position}] needs position and name.`,
                    );
                }
            });
        } else if (type === 'ItemList') {
            needs(node, ['itemListElement'], path, errors);
        } else if (type === 'ListItem') {
            needs(node, ['position'], path, errors);
        } else if (type === 'Organization') {
            needs(node, isTopLevel ? ['name', 'url'] : ['name'], path, errors);
        } else if (type === 'WebSite') {
            needs(node, ['name', 'url'], path, errors);
        } else if (type === 'Store') {
            needs(node, ['name'], path, errors);
        } else if (type === 'FAQPage') {
            needs(node, ['mainEntity'], path, errors);
            [].concat(node.mainEntity ?? []).forEach((question, position) => {
                if (
                    !isObject(question) ||
                    question.name === undefined ||
                    question.acceptedAnswer?.text === undefined
                ) {
                    errors.push(
                        `${path}.mainEntity[${position}] needs a name and an acceptedAnswer.text.`,
                    );
                }
            });
        } else if (type === 'Article') {
            needs(node, ['headline'], path, errors);
            if (!has('datePublished'))
                warnings.push(`${path} (Article) has no datePublished.`);
        } else if (PAGE_TYPES.has(type) && isTopLevel) {
            needs(node, ['name', 'url'], path, errors);
        }
    }
}

function parseArgs(argv) {
    const options = { baseUrl: null, file: null, paths: [] };
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--base-url') options.baseUrl = argv[++i];
        else if (argv[i] === '--file') options.file = argv[++i];
        else options.paths.push(argv[i]);
    }
    return options;
}

async function main() {
    const options = parseArgs(process.argv.slice(2));

    if (!options.baseUrl && !options.file) {
        console.error(
            'Usage: node scripts/validate-jsonld.mjs (--base-url <origin> [paths...] | --file <page.html>)',
        );
        process.exit(2);
    }

    const targets = [];
    if (options.file)
        targets.push({
            label: options.file,
            html: fs.readFileSync(options.file, 'utf8'),
        });

    if (options.baseUrl) {
        const origin = options.baseUrl.replace(/\/+$/, '');
        for (const path of options.paths.length > 0
            ? options.paths
            : DEFAULT_PATHS) {
            const response = await fetch(origin + path, {
                headers: { 'User-Agent': 'HalalBentaJsonLdValidator/1.0' },
            });
            targets.push({
                label: origin + path,
                html: response.ok ? await response.text() : null,
                status: response.status,
            });
        }
    }

    // The sitewide Organization / WebSite ids are defined on the home page and referenced elsewhere.
    const externalIds = options.baseUrl
        ? [
              `${options.baseUrl.replace(/\/+$/, '')}/#organization`,
              `${options.baseUrl.replace(/\/+$/, '')}/#website`,
          ]
        : [];

    let failed = false;
    for (const target of targets) {
        if (target.html === null) {
            console.error(`FAIL ${target.label}: HTTP ${target.status}`);
            failed = true;
            continue;
        }
        const { errors, warnings } = validateHtml(target.html, externalIds);
        for (const warning of warnings)
            console.warn(`WARN ${target.label}: ${warning}`);
        for (const error of errors)
            console.error(`FAIL ${target.label}: ${error}`);
        if (errors.length > 0) failed = true;
        else console.log(`ok   ${target.label}`);
    }

    process.exit(failed ? 1 : 0);
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    await main();
}
