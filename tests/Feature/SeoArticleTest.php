<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;

uses(RefreshDatabase::class);

/**
 * Article tests (docs/planning/14 T4.5).
 *
 * @return array<string, mixed>
 */
function articleNode(TestResponse $response): array
{
    preg_match_all('#<script type="application/ld\+json">\s*(.*?)\s*</script>#s', $response->getContent(), $matches);
    expect($matches[1])->toHaveCount(1);

    $graph = json_decode($matches[1][0], true, flags: JSON_THROW_ON_ERROR)['@graph'];

    return collect($graph)->first(fn (array $n) => in_array($n['@type'], ['Article', 'WebPage'], true) && str_ends_with($n['@id'], '#webpage'));
}

beforeEach(function () {
    config(['marketplace.pages.halal-verification.enabled' => true]);
});

test('halal verification article carries headline, author, publisher and configured dates', function () {
    config([
        'marketplace.pages.halal-verification.published' => '2026-01-10',
        'marketplace.pages.halal-verification.updated' => '2026-11-01',
    ]);

    $response = $this->get('/pages/halal-verification')->assertOk();
    $node = articleNode($response);

    expect($node['@type'])->toBe('Article')
        ->and($node['headline'])->toBe('Halal verification')
        ->and($node['datePublished'])->toBe('2026-01-10')
        ->and($node['dateModified'])->toBe('2026-11-01')
        ->and($node['author'])->toBe(['@type' => 'Organization', 'name' => 'HalalBenta Halal Assurance Team'])
        ->and($node['publisher']['@id'])->toEndWith('/#organization')
        ->and($node['mainEntityOfPage'])->toEndWith('/pages/halal-verification')
        ->and($node['image'])->toContain('/social/default-og.jpg');

    $response->assertSee('<meta property="article:published_time" content="2026-01-10">', false)
        ->assertSee('<meta property="article:modified_time" content="2026-11-01">', false);
});

test('the visible last updated date prop equals the schema dateModified', function () {
    config(['marketplace.pages.halal-verification.updated' => '2026-11-01']);

    $response = $this->get('/pages/halal-verification')->assertOk();

    expect($response->viewData('page')['props']['dates'])->toBe(['published' => null, 'modified' => '2026-11-01'])
        ->and(articleNode($response)['dateModified'])->toBe('2026-11-01');
});

test('no dates are invented when none are configured', function () {
    $response = $this->get('/pages/halal-verification')->assertOk();
    $node = articleNode($response);

    expect($node)->not->toHaveKey('datePublished')->not->toHaveKey('dateModified')
        ->and($response->viewData('page')['props']['dates'])->toBe(['published' => null, 'modified' => null]);

    $response->assertDontSee('article:published_time', false)->assertDontSee('article:modified_time', false);
});

test('a modification date before publication, an unparseable date and a future date are ignored', function () {
    config([
        'marketplace.pages.halal-verification.published' => '2026-06-01',
        'marketplace.pages.halal-verification.updated' => '2026-01-01',
    ]);
    $dates = $this->get('/pages/halal-verification')->assertOk()->viewData('page')['props']['dates'];
    expect($dates)->toBe(['published' => '2026-06-01', 'modified' => null]);

    config([
        'marketplace.pages.halal-verification.published' => 'not a date',
        'marketplace.pages.halal-verification.updated' => now()->addYear()->format('Y-m-d'),
    ]);
    $dates = $this->get('/pages/halal-verification')->assertOk()->viewData('page')['props']['dates'];
    expect($dates)->toBe(['published' => null, 'modified' => null]);
});

test('other content pages stay plain WebPages without article fields', function () {
    config(['marketplace.pages.about.enabled' => true]);

    $node = articleNode($this->get('/pages/about')->assertOk());

    expect($node['@type'])->toBe('WebPage')
        ->and($node)->not->toHaveKey('headline')->not->toHaveKey('author')->not->toHaveKey('publisher');
});
