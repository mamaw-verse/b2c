// Hermetic self-test for scripts/validate-jsonld.mjs (docs/planning/14 T5.1).
// Mirrors tests/Unit/JsonLdValidatorTest.php so the two validators cannot drift.
import assert from 'node:assert/strict';
import {
    extractBlocks,
    validateDocument,
    validateHtml,
} from '../../scripts/validate-jsonld.mjs';

const SHOP = 'https://x.test/shops/a#store';

const product = (overrides = {}) => ({
    '@type': 'Product',
    '@id': 'https://x.test/products/dates#product',
    url: 'https://x.test/products/dates',
    name: 'Dates',
    image: ['https://x.test/img/dates.jpg'],
    offers: {
        '@type': 'Offer',
        price: '450.00',
        priceCurrency: 'PHP',
        availability: 'https://schema.org/InStock',
        seller: { '@id': SHOP },
    },
    ...overrides,
});

const doc = (nodes) => ({ '@context': 'https://schema.org', '@graph': nodes });
const errorsOf = (document, external = [SHOP]) =>
    validateDocument(document, external).errors.join('\n');

// A complete product is clean.
assert.deepEqual(validateDocument(doc([product()]), [SHOP]), {
    errors: [],
    warnings: [],
});

// @context / @graph
assert.match(errorsOf({ '@graph': [product()] }), /@context must be/);
assert.match(errorsOf({ '@context': 'https://schema.org' }), /@graph must be/);

// @type and duplicate ids
assert.match(errorsOf(doc([{ name: 'x' }])), /@graph\[0\] has no @type/);
assert.match(errorsOf(doc([product(), product()])), /repeats the @id/);

// References resolve unless the id is sitewide
const missing = product({
    offers: { ...product().offers, seller: { '@id': 'https://x.test/nope' } },
});
assert.match(errorsOf(doc([missing]), []), /does not resolve/);
assert.equal(errorsOf(doc([missing]), ['https://x.test/nope']), '');

// Empty values and relative URLs
assert.match(
    errorsOf(doc([product({ description: '', additionalProperty: [] })])),
    /description is empty[\s\S]*additionalProperty is an empty array/,
);
assert.match(
    errorsOf(doc([product({ url: '/products/dates' })])),
    /must be an absolute URL/,
);

// Product needs offers/ratings/reviews, but a list stub does not
const bare = product();
delete bare.offers;
assert.match(errorsOf(doc([bare])), /needs offers, aggregateRating or review/);
assert.equal(
    errorsOf(
        doc([
            {
                '@type': 'ItemList',
                '@id': 'https://x.test/c#itemlist',
                itemListElement: [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        item: {
                            '@type': 'Product',
                            '@id': 'https://x.test/products/dates#product',
                            url: 'https://x.test/products/dates',
                            name: 'Dates',
                        },
                    },
                ],
            },
        ]),
    ),
    '',
);

// Offers
assert.match(
    errorsOf(doc([product({ offers: { '@type': 'Offer', price: 'free' } })])),
    /priceCurrency[\s\S]*availability[\s\S]*price must be numeric/,
);

// Product groups
const group = product({ '@type': 'ProductGroup' });
delete group.offers;
assert.match(errorsOf(doc([group])), /missing required property "hasVariant"/);
group.hasVariant = [{ '@type': 'Product', name: 'Dates (500g)' }];
assert.match(
    errorsOf(doc([group])),
    /hasVariant\[0\] \(Product\) needs offers/,
);

// Breadcrumbs and FAQs
const structured = errorsOf(
    doc([
        {
            '@type': 'BreadcrumbList',
            '@id': 'https://x.test/#breadcrumb',
            itemListElement: [{ '@type': 'ListItem', position: 1 }],
        },
        {
            '@type': 'FAQPage',
            '@id': 'https://x.test/#faq',
            mainEntity: [{ '@type': 'Question', name: 'Q?' }],
        },
    ]),
);
assert.match(structured, /needs position and name/);
assert.match(structured, /needs a name and an acceptedAnswer\.text/);

// Articles only warn without a published date
const article = validateDocument(
    doc([
        {
            '@type': 'Article',
            '@id': 'https://x.test/a#webpage',
            headline: 'A',
        },
    ]),
);
assert.deepEqual(article.errors, []);
assert.match(article.warnings.join('\n'), /has no datePublished/);

// Blog nodes (docs/planning/15-blog.md B3.5)
const ORG = 'https://x.test/#organization';
const PERSON = 'https://x.test/blog/author/aisha#person';
const posting = (overrides = {}) => ({
    '@type': 'BlogPosting',
    '@id': 'https://x.test/blog/dates#article',
    url: 'https://x.test/blog/dates',
    headline: 'How to choose dates',
    description: 'A short guide.',
    image: ['https://x.test/img/cover.jpg'],
    datePublished: '2026-11-25T08:00:00+08:00',
    dateModified: '2026-11-26T09:30:00+08:00',
    author: { '@id': PERSON },
    publisher: { '@id': ORG },
    mainEntityOfPage: { '@id': 'https://x.test/blog/dates#webpage' },
    ...overrides,
});
const blogDoc = (article) =>
    doc([
        article,
        {
            '@type': 'Person',
            '@id': PERSON,
            name: 'Aisha',
            url: 'https://x.test/blog/author/aisha',
        },
    ]);
const blogExternal = [ORG, 'https://x.test/blog/dates#webpage'];

assert.deepEqual(validateDocument(blogDoc(posting()), blogExternal), {
    errors: [],
    warnings: [],
});

// Required article properties
const incomplete = posting();
for (const key of ['headline', 'image', 'datePublished', 'author'])
    delete incomplete[key];
const incompleteErrors = errorsOf(blogDoc(incomplete), blogExternal);
for (const key of ['headline', 'image', 'datePublished', 'author'])
    assert.match(
        incompleteErrors,
        new RegExp(`missing required property "${key}"`),
    );

// Dates must be ISO 8601 and the headline short enough for rich results
assert.match(
    errorsOf(blogDoc(posting({ datePublished: '25 Nov 2026' })), blogExternal),
    /datePublished must be an ISO 8601 date/,
);
assert.equal(
    errorsOf(blogDoc(posting({ datePublished: '2026-11-25' })), blogExternal),
    '',
);
assert.match(
    errorsOf(blogDoc(posting({ headline: 'x'.repeat(111) })), blogExternal),
    /headline is longer than 110 characters/,
);

// The author reference must resolve inside the graph (or be sitewide)
assert.match(
    errorsOf(
        doc([
            posting({
                author: { '@id': 'https://x.test/blog/author/gone#person' },
            }),
        ]),
        blogExternal,
    ),
    /does not resolve/,
);

// Optional article properties only warn
const sparse = posting();
for (const key of [
    'dateModified',
    'publisher',
    'description',
    'mainEntityOfPage',
])
    delete sparse[key];
const sparseResult = validateDocument(blogDoc(sparse), blogExternal);
assert.deepEqual(sparseResult.errors, []);
for (const key of [
    'dateModified',
    'publisher',
    'description',
    'mainEntityOfPage',
])
    assert.match(sparseResult.warnings.join('\n'), new RegExp(`has no ${key}`));

// A BlogPosting stub in the blog index's ItemList is not held to the full-article rules
const indexDocument = doc([
    {
        '@type': 'Blog',
        '@id': 'https://x.test/blog#blog',
        url: 'https://x.test/blog',
        name: 'Blog',
        blogPost: [{ '@id': 'https://x.test/blog/dates#article' }],
    },
    {
        '@type': 'ItemList',
        '@id': 'https://x.test/blog#itemlist',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                item: {
                    '@type': 'BlogPosting',
                    '@id': 'https://x.test/blog/dates#article',
                    url: 'https://x.test/blog/dates',
                    name: 'How to choose dates',
                },
            },
        ],
    },
]);
assert.deepEqual(validateDocument(indexDocument), { errors: [], warnings: [] });

// Blog needs a name and url
assert.match(
    errorsOf(doc([{ '@type': 'Blog', '@id': 'https://x.test/blog#blog' }])),
    /missing required property "name"[\s\S]*missing required property "url"/,
);

// Person needs a name; a missing url is fine (deactivated author)
assert.match(
    errorsOf(doc([{ '@type': 'Person', '@id': PERSON }])),
    /missing required property "name"/,
);
assert.equal(
    errorsOf(doc([{ '@type': 'Person', '@id': PERSON, name: 'Aisha' }])),
    '',
);

// ProfilePage needs name, url and mainEntity
assert.match(
    errorsOf(
        doc([
            {
                '@type': 'ProfilePage',
                '@id': 'https://x.test/blog/author/aisha#webpage',
            },
        ]),
    ),
    /missing required property "name"[\s\S]*missing required property "url"[\s\S]*missing required property "mainEntity"/,
);
assert.equal(
    errorsOf(
        doc([
            {
                '@type': 'ProfilePage',
                '@id': 'https://x.test/blog/author/aisha#webpage',
                name: 'Aisha',
                url: 'https://x.test/blog/author/aisha',
                mainEntity: { '@id': PERSON },
            },
            { '@type': 'Person', '@id': PERSON, name: 'Aisha' },
        ]),
    ),
    '',
);

// HTML extraction: exactly one parseable block
const block = (json) => `<script type="application/ld+json">${json}</script>`;
assert.equal(extractBlocks(block('{}') + block('{}')).length, 2);
assert.match(validateHtml('<html></html>').errors[0], /No <script/);
assert.match(validateHtml(block('{}') + block('{}')).errors[0], /exactly one/);
assert.match(validateHtml(block('{nope')).errors[0], /not valid JSON/);
assert.deepEqual(
    validateHtml(block(JSON.stringify(doc([product()]))), [SHOP]).errors,
    [],
);

console.log('jsonld-validator: structured-data rules pass');
