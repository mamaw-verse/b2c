<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('enabled content page renders', function () {
    config(['marketplace.pages.returns.enabled' => true]);

    $this->get(route('pages.show', 'returns'))->assertOk()
        ->assertInertia(fn ($page) => $page->component('content')->where('page.title', 'Returns & refunds'));
});

test('disabled or unknown pages are 404', function () {
    config(['marketplace.pages.about.enabled' => false]);

    $this->get(route('pages.show', 'about'))->assertNotFound();
    $this->get(route('pages.show', 'nope'))->assertNotFound();
});
