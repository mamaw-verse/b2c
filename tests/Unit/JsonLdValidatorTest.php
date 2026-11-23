<?php

declare(strict_types=1);

use App\Support\Schema\JsonLdValidator;
use App\Support\Schema\SchemaGraph;

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function validProduct(array $overrides = []): array
{
    return [
        '@type' => 'Product',
        '@id' => 'https://x.test/products/dates#product',
        'url' => 'https://x.test/products/dates',
        'name' => 'Dates',
        'image' => ['https://x.test/img/dates.jpg'],
        'offers' => [
            '@type' => 'Offer',
            'price' => '450.00',
            'priceCurrency' => 'PHP',
            'availability' => 'https://schema.org/InStock',
            'seller' => ['@id' => 'https://x.test/shops/a#store'],
        ],
        ...$overrides,
    ];
}

/**
 * @param  array<int, array<string, mixed>>  $nodes
 * @return array<string, mixed>
 */
function jsonLdDocument(array $nodes): array
{
    return ['@context' => SchemaGraph::CONTEXT, '@graph' => $nodes];
}

/** @var list<string> $shopRef */
$shopRef = ['https://x.test/shops/a#store'];

test('a complete product document has no errors', function () use ($shopRef) {
    $result = (new JsonLdValidator)->validateDocument(jsonLdDocument([validProduct()]), $shopRef);

    expect($result['errors'])->toBe([])
        ->and($result['warnings'])->toBe([]);
});

test('a missing @context or @graph is an error', function () {
    $validator = new JsonLdValidator;

    expect($validator->validateDocument(['@graph' => [validProduct()]])['errors'])->toContain('@context must be https://schema.org.')
        ->and($validator->validateDocument(['@context' => SchemaGraph::CONTEXT])['errors'])->toContain('@graph must be a non-empty list of nodes.');
});

test('nodes without @type and duplicate @ids are errors', function () use ($shopRef) {
    $result = (new JsonLdValidator)->validateDocument(jsonLdDocument([
        ['name' => 'No type'],
        validProduct(),
        validProduct(),
    ]), $shopRef);

    expect($result['errors'])->toContain('@graph[0] has no @type.')
        ->and(implode("\n", $result['errors']))->toContain('repeats the @id');
});

test('unresolved references are errors unless the id is sitewide', function () {
    $node = validProduct(['offers' => [
        '@type' => 'Offer',
        'price' => '1.00',
        'priceCurrency' => 'PHP',
        'availability' => 'https://schema.org/InStock',
        'seller' => ['@id' => 'https://x.test/shops/missing#store'],
    ]]);

    $validator = new JsonLdValidator;

    expect($validator->validateDocument(jsonLdDocument([$node]))['errors'])
        ->toContain('Reference to https://x.test/shops/missing#store does not resolve inside the graph.')
        ->and($validator->validateDocument(jsonLdDocument([$node]), ['https://x.test/shops/missing#store'])['errors'])->toBe([]);
});

test('empty strings, empty arrays and nulls are errors', function () use ($shopRef) {
    $result = (new JsonLdValidator)->validateDocument(jsonLdDocument([
        validProduct(['description' => '', 'additionalProperty' => [], 'sku' => null]),
    ]), $shopRef);

    expect($result['errors'])->toContain('@graph[0].description is empty.')
        ->and($result['errors'])->toContain('@graph[0].additionalProperty is an empty array.')
        ->and($result['errors'])->toContain('@graph[0].sku is empty.');
});

test('relative URLs in url and image properties are errors', function () use ($shopRef) {
    $result = (new JsonLdValidator)->validateDocument(jsonLdDocument([
        validProduct(['url' => '/products/dates', 'image' => ['/img/dates.jpg']]),
    ]), $shopRef);

    expect(implode("\n", $result['errors']))
        ->toContain('@graph[0].url must be an absolute URL')
        ->toContain('@graph[0].image[0] must be an absolute URL');
});

test('a product needs offers, ratings or reviews, but a list stub does not', function () {
    $validator = new JsonLdValidator;

    $bare = validProduct();
    unset($bare['offers']);

    expect($validator->validateDocument(jsonLdDocument([$bare]))['errors'])
        ->toContain('@graph[0] (Product) needs offers, aggregateRating or review.');

    $list = [
        '@type' => 'ItemList',
        '@id' => 'https://x.test/categories/a#itemlist',
        'itemListElement' => [[
            '@type' => 'ListItem',
            'position' => 1,
            'item' => ['@type' => 'Product', '@id' => 'https://x.test/products/dates#product', 'url' => 'https://x.test/products/dates', 'name' => 'Dates'],
        ]],
    ];

    expect($validator->validateDocument(jsonLdDocument([$list]))['errors'])->toBe([]);
});

test('offers need price, currency and availability', function () {
    $node = validProduct(['offers' => ['@type' => 'Offer', 'price' => 'free']]);

    $errors = implode("\n", (new JsonLdValidator)->validateDocument(jsonLdDocument([$node]))['errors']);

    expect($errors)
        ->toContain('missing required property "priceCurrency"')
        ->toContain('missing required property "availability"')
        ->toContain('.price must be numeric');
});

test('a product group needs variants and each variant needs an offer', function () {
    $group = validProduct(['@type' => 'ProductGroup']);
    unset($group['offers']);

    $validator = new JsonLdValidator;

    expect($validator->validateDocument(jsonLdDocument([$group]))['errors'])
        ->toContain('@graph[0] is missing required property "hasVariant".');

    $group['hasVariant'] = [['@type' => 'Product', 'name' => 'Dates (500g)']];

    expect($validator->validateDocument(jsonLdDocument([$group]))['errors'])
        ->toContain('@graph[0].hasVariant[0] (Product) needs offers, aggregateRating or review.');
});

test('breadcrumbs and faqs are checked for their required fields', function () {
    $validator = new JsonLdValidator;

    $errors = implode("\n", $validator->validateDocument(jsonLdDocument([
        ['@type' => 'BreadcrumbList', '@id' => 'https://x.test/#breadcrumb', 'itemListElement' => [['@type' => 'ListItem', 'position' => 1]]],
        ['@type' => 'FAQPage', '@id' => 'https://x.test/#faq', 'mainEntity' => [['@type' => 'Question', 'name' => 'Q?']]],
    ]))['errors']);

    expect($errors)
        ->toContain('itemListElement[0] needs position and name.')
        ->toContain('mainEntity[0] needs a name and an acceptedAnswer.text.');
});

test('an article without datePublished only warns', function () {
    $result = (new JsonLdValidator)->validateDocument(jsonLdDocument([
        ['@type' => 'Article', '@id' => 'https://x.test/pages/a#webpage', 'headline' => 'A'],
    ]));

    expect($result['errors'])->toBe([])
        ->and($result['warnings'])->toContain('@graph[0] (Article) has no datePublished.');
});

test('html extraction requires exactly one parseable block', function () {
    $validator = new JsonLdValidator;
    $block = fn (string $json): string => '<script type="application/ld+json">'.$json.'</script>';

    expect($validator->validateHtml('<html></html>')['errors'])->toContain('No <script type="application/ld+json"> block found.')
        ->and($validator->validateHtml($block('{}').$block('{}'))['errors'][0])->toStartWith('Expected exactly one JSON-LD block')
        ->and($validator->validateHtml($block('{nope'))['errors'][0])->toStartWith('JSON-LD block is not valid JSON');

    $valid = json_encode(jsonLdDocument([validProduct()]), JSON_UNESCAPED_SLASHES);

    expect($validator->validateHtml($block((string) $valid), ['https://x.test/shops/a#store'])['errors'])->toBe([]);
});

test('imageUrls collects absolute image and logo URLs once', function () {
    $document = jsonLdDocument([
        validProduct(['image' => ['https://x.test/a.jpg', 'https://x.test/b.jpg']]),
        ['@type' => 'Organization', 'name' => 'X', 'url' => 'https://x.test/', 'logo' => ['@type' => 'ImageObject', 'url' => 'https://x.test/a.jpg']],
    ]);

    expect((new JsonLdValidator)->imageUrls($document))->toBe(['https://x.test/a.jpg', 'https://x.test/b.jpg']);
});
