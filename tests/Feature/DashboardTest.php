<?php

declare(strict_types=1);

use App\Models\User;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('the legacy dashboard redirects to the buyer account home', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect('/account');
});

test('authenticated users can visit the buyer account home', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/account')
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page->component('account/home'),
        );
});
