<?php

declare(strict_types=1);

use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('authenticated user can add an item to cart', function () {
    $user = User::factory()->create();
    $product = Product::factory()->certified()->create(['stock' => 10]);

    $this->actingAs($user)
        ->from(route('cart.index'))
        ->post(route('cart.store'), [
            'product_id' => $product->id,
            'qty' => 2,
        ])
        ->assertRedirect(route('cart.index'));

    $this->assertDatabaseHas('cart_items', [
        'user_id' => $user->id,
        'product_id' => $product->id,
        'qty' => 2,
    ]);
});

test('adding the same item increases quantity', function () {
    $user = User::factory()->create();
    $product = Product::factory()->certified()->create(['stock' => 10]);

    CartItem::factory()->create([
        'user_id' => $user->id,
        'product_id' => $product->id,
        'product_variation_id' => null,
        'qty' => 2,
    ]);

    $this->actingAs($user)
        ->from(route('cart.index'))
        ->post(route('cart.store'), [
            'product_id' => $product->id,
            'qty' => 3,
        ])
        ->assertRedirect(route('cart.index'));

    $this->assertDatabaseHas('cart_items', [
        'user_id' => $user->id,
        'product_id' => $product->id,
        'qty' => 5,
    ]);
});

test('adding more than available stock fails validation', function () {
    $user = User::factory()->create();
    $product = Product::factory()->certified()->create(['stock' => 3]);

    $this->actingAs($user)
        ->post(route('cart.store'), [
            'product_id' => $product->id,
            'qty' => 5,
        ])
        ->assertSessionHasErrors('qty');
});

test('unauthenticated user cannot add item to cart', function () {
    $product = Product::factory()->certified()->create(['stock' => 10]);

    $this->post(route('cart.store'), [
        'product_id' => $product->id,
        'qty' => 1,
    ])->assertRedirect(route('login'));
});
