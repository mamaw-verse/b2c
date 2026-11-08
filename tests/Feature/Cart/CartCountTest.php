<?php

declare(strict_types=1);

use App\Models\CartItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('cart item count is shared as an inertia prop', function () {
    $user = User::factory()->create();
    CartItem::factory()->count(3)->create(['user_id' => $user->id]);
    CartItem::factory()->create();

    $this->actingAs($user)->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('cartCount', 3));
});

test('cart item count is zero for guests', function () {
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('cartCount', 0));
});
