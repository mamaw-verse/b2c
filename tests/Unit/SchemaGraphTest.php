<?php

declare(strict_types=1);

use App\Support\Schema\SchemaGraph;

test('emits @context once and wraps nodes in @graph', function () {
    $doc = SchemaGraph::make()
        ->add(['@type' => 'Organization', '@id' => 'https://x.test/#organization', 'name' => 'X'])
        ->add(['@type' => 'WebSite', '@id' => 'https://x.test/#website', 'name' => 'X'])
        ->toArray();

    expect($doc['@context'])->toBe('https://schema.org')
        ->and($doc['@graph'])->toHaveCount(2);
});

test('de-dupes nodes by @id and fills gaps without overwriting', function () {
    $doc = SchemaGraph::make()
        ->add(['@type' => 'Organization', '@id' => 'a', 'name' => 'First'])
        ->add(['@type' => 'Organization', '@id' => 'a', 'name' => 'Second', 'url' => 'https://x.test'])
        ->toArray();

    expect($doc['@graph'])->toHaveCount(1)
        ->and($doc['@graph'][0]['name'])->toBe('First')
        ->and($doc['@graph'][0]['url'])->toBe('https://x.test');
});

test('strips null, empty strings and empty arrays recursively but keeps zero and false', function () {
    $doc = SchemaGraph::make()
        ->add([
            '@type' => 'Offer',
            'price' => '0',
            'shippingRate' => 0,
            'inStock' => false,
            'description' => '   ',
            'sameAs' => [],
            'seller' => ['@type' => 'Organization', 'name' => null, 'url' => ''],
            'image' => ['', null, 'https://x.test/a.jpg'],
        ])
        ->toArray();

    $node = $doc['@graph'][0];

    expect($node)->toHaveKeys(['price', 'shippingRate', 'inStock', 'seller', 'image'])
        ->and($node)->not->toHaveKeys(['description', 'sameAs'])
        ->and($node['shippingRate'])->toBe(0)
        ->and($node['inStock'])->toBeFalse()
        ->and($node['seller'])->toBe(['@type' => 'Organization'])
        ->and($node['image'])->toBe(['https://x.test/a.jpg']);
});

test('returns an empty document when there are no nodes', function () {
    expect(SchemaGraph::make()->toArray())->toBe([])
        ->and(SchemaGraph::make()->toJson())->toBe('');
});

test('ref builds an @id-only reference', function () {
    expect(SchemaGraph::ref('https://x.test/#organization'))->toBe(['@id' => 'https://x.test/#organization']);
});

test('encode adds @context to a bare list of nodes', function () {
    $json = SchemaGraph::encode([['@type' => 'Organization', 'name' => 'X']]);
    $decoded = json_decode($json, true);

    expect($decoded['@context'])->toBe('https://schema.org')
        ->and($decoded['@graph'][0]['@type'])->toBe('Organization');
});

test('encode keeps an existing @context untouched', function () {
    $json = SchemaGraph::encode(['@context' => 'https://schema.org', '@graph' => [['@type' => 'WebSite']]]);

    expect(json_decode($json, true)['@graph'])->toHaveCount(1);
});

test('encode hex-escapes tags and ampersands so text cannot break out of the script element', function () {
    $json = SchemaGraph::encode(SchemaGraph::make()
        ->add(['@type' => 'Product', 'name' => '</script><script>alert(1)</script> & co'])
        ->toArray());

    expect($json)->not->toContain('</script>')
        ->and($json)->not->toContain('<')
        ->and($json)->toContain('\u003C')
        ->and(json_decode($json, true)['@graph'][0]['name'])->toBe('</script><script>alert(1)</script> & co');
});

test('encode keeps unicode and slashes readable', function () {
    $json = SchemaGraph::encode(SchemaGraph::make()
        ->add(['@type' => 'Product', 'name' => 'Dates – ₱450', 'url' => 'https://x.test/products/a'])
        ->toArray());

    expect($json)->toContain('₱450')->toContain('https://x.test/products/a');
});
