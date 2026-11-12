<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('why choose us page renders successfully with benefits props', function () {
    $this->get(route('why-choose-us'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('why-choose-us')
            ->has('canBecomeSeller')
            ->has('halalCertificationUrl')
            ->has('b2bUrl'));
});
