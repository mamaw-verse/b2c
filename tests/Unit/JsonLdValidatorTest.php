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

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function validBlogPosting(array $overrides = []): array
{
    return [
        '@type' => 'BlogPosting',
        '@id' => 'https://x.test/blog/dates#article',
        'url' => 'https://x.test/blog/dates',
        'headline' => 'How to choose dates',
        'description' => 'A short guide.',
        'image' => ['https://x.test/img/cover.jpg'],
        'datePublished' => '2026-11-25T08:00:00+08:00',
        'dateModified' => '2026-11-26T09:30:00+08:00',
        'author' => ['@id' => 'https://x.test/blog/author/aisha#person'],
        'publisher' => ['@id' => 'https://x.test/#organization'],
        'mainEntityOfPage' => ['@id' => 'https://x.test/blog/dates#webpage'],
        ...$overrides,
    ];
}

/**
 * @param  array<string, mixed>  $article
 * @return array<string, mixed>
 */
function blogPostingDocument(array $article): array
{
    return jsonLdDocument([
        $article,
        ['@type' => 'Person', '@id' => 'https://x.test/blog/author/aisha#person', 'name' => 'Aisha', 'url' => 'https://x.test/blog/author/aisha'],
    ]);
}

/** @var list<string> $blogExternal */
$blogExternal = ['https://x.test/#organization', 'https://x.test/blog/dates#webpage'];

test('a complete blog posting document has no errors or warnings', function () use ($blogExternal) {
    $result = (new JsonLdValidator)->validateDocument(blogPostingDocument(validBlogPosting()), $blogExternal);

    expect($result['errors'])->toBe([])
        ->and($result['warnings'])->toBe([]);
});

test('a blog posting needs a headline, image, publish date and author', function () use ($blogExternal) {
    $article = validBlogPosting();
    unset($article['headline'], $article['image'], $article['datePublished'], $article['author']);

    $errors = implode("\n", (new JsonLdValidator)->validateDocument(blogPostingDocument($article), $blogExternal)['errors']);

    expect($errors)
        ->toContain('missing required property "headline"')
        ->toContain('missing required property "image"')
        ->toContain('missing required property "datePublished"')
        ->toContain('missing required property "author"');
});

test('blog posting dates must be ISO 8601 and the headline at most 110 characters', function () use ($blogExternal) {
    $validator = new JsonLdValidator;

    expect($validator->validateDocument(blogPostingDocument(validBlogPosting(['datePublished' => '25 Nov 2026'])), $blogExternal)['errors'])
        ->toContain('@graph[0].datePublished must be an ISO 8601 date.')
        ->and($validator->validateDocument(blogPostingDocument(validBlogPosting(['datePublished' => '2026-11-25'])), $blogExternal)['errors'])->toBe([])
        ->and($validator->validateDocument(blogPostingDocument(validBlogPosting(['headline' => str_repeat('x', 111)])), $blogExternal)['errors'])
        ->toContain('@graph[0].headline is longer than 110 characters.');
});

test('a blog posting author that is not in the graph is an unresolved reference', function () use ($blogExternal) {
    $document = jsonLdDocument([validBlogPosting(['author' => ['@id' => 'https://x.test/blog/author/gone#person']])]);

    expect((new JsonLdValidator)->validateDocument($document, $blogExternal)['errors'])
        ->toContain('Reference to https://x.test/blog/author/gone#person does not resolve inside the graph.');
});

test('optional blog posting properties only warn', function () use ($blogExternal) {
    $article = validBlogPosting();
    unset($article['dateModified'], $article['publisher'], $article['description'], $article['mainEntityOfPage']);

    $result = (new JsonLdValidator)->validateDocument(blogPostingDocument($article), $blogExternal);

    expect($result['errors'])->toBe([])
        ->and($result['warnings'])->toContain('@graph[0] (BlogPosting) has no dateModified.')
        ->toContain('@graph[0] (BlogPosting) has no publisher.')
        ->toContain('@graph[0] (BlogPosting) has no description.')
        ->toContain('@graph[0] (BlogPosting) has no mainEntityOfPage.');
});

test('blog posting stubs in the blog index list are not held to the full article rules', function () {
    $document = jsonLdDocument([
        ['@type' => 'Blog', '@id' => 'https://x.test/blog#blog', 'url' => 'https://x.test/blog', 'name' => 'Blog', 'blogPost' => [['@id' => 'https://x.test/blog/dates#article']]],
        [
            '@type' => 'ItemList',
            '@id' => 'https://x.test/blog#itemlist',
            'itemListElement' => [[
                '@type' => 'ListItem',
                'position' => 1,
                'item' => ['@type' => 'BlogPosting', '@id' => 'https://x.test/blog/dates#article', 'url' => 'https://x.test/blog/dates', 'name' => 'How to choose dates'],
            ]],
        ],
    ]);

    expect((new JsonLdValidator)->validateDocument($document))->toBe(['errors' => [], 'warnings' => []]);
});

test('a blog needs a name and url, a person needs a name', function () {
    $validator = new JsonLdValidator;

    $errors = implode("\n", $validator->validateDocument(jsonLdDocument([['@type' => 'Blog', '@id' => 'https://x.test/blog#blog']]))['errors']);

    expect($errors)
        ->toContain('missing required property "name"')
        ->toContain('missing required property "url"')
        ->and($validator->validateDocument(jsonLdDocument([['@type' => 'Person', '@id' => 'https://x.test/blog/author/a#person']]))['errors'])
        ->toContain('@graph[0] is missing required property "name".')
        // A deactivated author is still credited but has no page, so no url is fine.
        ->and($validator->validateDocument(jsonLdDocument([['@type' => 'Person', '@id' => 'https://x.test/blog/author/a#person', 'name' => 'Aisha']]))['errors'])->toBe([]);
});

test('a profile page needs a name, url and main entity', function () {
    $validator = new JsonLdValidator;
    $person = ['@type' => 'Person', '@id' => 'https://x.test/blog/author/aisha#person', 'name' => 'Aisha'];

    $errors = implode("\n", $validator->validateDocument(jsonLdDocument([
        ['@type' => 'ProfilePage', '@id' => 'https://x.test/blog/author/aisha#webpage'],
    ]))['errors']);

    expect($errors)
        ->toContain('missing required property "name"')
        ->toContain('missing required property "url"')
        ->toContain('missing required property "mainEntity"')
        ->and($validator->validateDocument(jsonLdDocument([
            ['@type' => 'ProfilePage', '@id' => 'https://x.test/blog/author/aisha#webpage', 'name' => 'Aisha', 'url' => 'https://x.test/blog/author/aisha', 'mainEntity' => ['@id' => $person['@id']]],
            $person,
        ]))['errors'])->toBe([]);
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
