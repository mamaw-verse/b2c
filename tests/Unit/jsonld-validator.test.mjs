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
