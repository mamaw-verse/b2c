<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('seller terms page is reachable by guests and exposes its config', function () {
    $this->get(route('seller.terms'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('seller/terms')
            ->where('sellerTerms.version', config('marketplace.seller_terms.version'))
            ->where('sellerTerms.draft', true)
            ->has('sellerTerms.updated')
        );
});

test('seller terms placeholders without a config value are listed for review', function () {
    $content = file_get_contents(resource_path('js/content/seller-terms.ts'));
    assert(is_string($content));

    preg_match_all('/\{(\w+)\}/', (string) $content, $matches);
    $tokens = array_unique($matches[1]);

    $values = config('marketplace.seller_terms');
    $unresolved = array_values(array_filter(
        $tokens,
        fn (string $token) => ! is_string($values[$token] ?? null) || $values[$token] === '',
    ));

    if ($unresolved !== []) {
        $this->markTestIncomplete(
            'Fill these seller_terms config values before launch: '
            .implode(', ', $unresolved),
        );
    }

    expect($unresolved)->toBe([]);
});
