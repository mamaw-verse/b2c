<?php

declare(strict_types=1);

use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('cart index includes variation options, option names, and list of variations', function () {
    $user = User::factory()->create();
    $product = Product::factory()->certified()->create([
        'option1_name' => 'Color',
        'option2_name' => 'Size',
    ]);

    $var1 = ProductVariation::factory()->create([
        'product_id' => $product->id,
        'option1_value' => 'Red',
        'option2_value' => 'Small',
        'price' => 12000,
        'stock' => 10,
    ]);

    $var2 = ProductVariation::factory()->create([
        'product_id' => $product->id,
        'option1_value' => 'Blue',
        'option2_value' => 'Large',
        'price' => 15000,
        'stock' => 5,
    ]);

    CartItem::factory()->create([
        'user_id' => $user->id,
        'product_id' => $product->id,
        'product_variation_id' => $var1->id,
        'qty' => 2,
    ]);

    $response = $this->actingAs($user)->get(route('cart.index'));
    $response->assertOk();

    $response->assertInertia(fn ($page) => $page
        ->component('cart')
        ->has('groups.0.items.0', fn ($item) => $item
            ->where('option1_name', 'Color')
            ->where('option2_name', 'Size')
            ->where('variation.id', $var1->id)
            ->where('variation.label', 'Red · Small')
            ->where('variation.option1_value', 'Red')
            ->where('variation.option2_value', 'Small')
            ->has('variations', 2)
            ->etc()
        )
    );
});

test('user can change variation of a cart item', function () {
    $user = User::factory()->create();
    $product = Product::factory()->certified()->create();

    $var1 = ProductVariation::factory()->create([
        'product_id' => $product->id,
        'option1_value' => 'Small',
        'stock' => 10,
    ]);

    $var2 = ProductVariation::factory()->create([
        'product_id' => $product->id,
        'option1_value' => 'Large',
        'stock' => 5,
    ]);

    $cartItem = CartItem::factory()->create([
        'user_id' => $user->id,
        'product_id' => $product->id,
        'product_variation_id' => $var1->id,
        'qty' => 3,
    ]);

    $this->actingAs($user)
        ->from(route('cart.index'))
        ->put(route('cart.update', $cartItem), [
            'product_variation_id' => $var2->id,
        ])
        ->assertRedirect(route('cart.index'));

    expect($cartItem->fresh())
        ->product_variation_id->toBe($var2->id)
        ->qty->toBe(3);
});

test('quantity is clamped to stock when changing to a variation with lower stock', function () {
    $user = User::factory()->create();
    $product = Product::factory()->certified()->create();

    $var1 = ProductVariation::factory()->create([
        'product_id' => $product->id,
        'stock' => 10,
    ]);

    $var2 = ProductVariation::factory()->create([
        'product_id' => $product->id,
        'stock' => 2,
    ]);

    $cartItem = CartItem::factory()->create([
        'user_id' => $user->id,
        'product_id' => $product->id,
        'product_variation_id' => $var1->id,
        'qty' => 5,
    ]);

    $this->actingAs($user)
        ->put(route('cart.update', $cartItem), [
            'product_variation_id' => $var2->id,
        ])
        ->assertRedirect();

    expect($cartItem->fresh())
        ->product_variation_id->toBe($var2->id)
        ->qty->toBe(2);
});

test('changing to a variation already in the cart merges items and deletes current row', function () {
    $user = User::factory()->create();
    $product = Product::factory()->certified()->create();

    $var1 = ProductVariation::factory()->create([
        'product_id' => $product->id,
        'stock' => 10,
    ]);

    $var2 = ProductVariation::factory()->create([
        'product_id' => $product->id,
        'stock' => 10,
    ]);

    $cartItem1 = CartItem::factory()->create([
        'user_id' => $user->id,
        'product_id' => $product->id,
        'product_variation_id' => $var1->id,
        'qty' => 2,
    ]);

    $cartItem2 = CartItem::factory()->create([
        'user_id' => $user->id,
        'product_id' => $product->id,
        'product_variation_id' => $var2->id,
        'qty' => 3,
    ]);

    $this->actingAs($user)
        ->put(route('cart.update', $cartItem1), [
            'product_variation_id' => $var2->id,
        ])
        ->assertRedirect();

    expect(CartItem::find($cartItem1->id))->toBeNull();
    expect($cartItem2->fresh()->qty)->toBe(5);
});

test('changing to an out of stock variation fails validation', function () {
    $user = User::factory()->create();
    $product = Product::factory()->certified()->create();

    $var1 = ProductVariation::factory()->create([
        'product_id' => $product->id,
        'stock' => 10,
    ]);

    $var2 = ProductVariation::factory()->create([
        'product_id' => $product->id,
        'stock' => 0,
    ]);

    $cartItem = CartItem::factory()->create([
        'user_id' => $user->id,
        'product_id' => $product->id,
        'product_variation_id' => $var1->id,
        'qty' => 1,
    ]);

    $this->actingAs($user)
        ->put(route('cart.update', $cartItem), [
            'product_variation_id' => $var2->id,
        ])
        ->assertSessionHasErrors('product_variation_id');

    expect($cartItem->fresh()->product_variation_id)->toBe($var1->id);
});

test('cannot change to a variation from another product', function () {
    $user = User::factory()->create();
    $product1 = Product::factory()->certified()->create();
    $product2 = Product::factory()->certified()->create();

    $var1 = ProductVariation::factory()->create(['product_id' => $product1->id]);
    $var2 = ProductVariation::factory()->create(['product_id' => $product2->id]);

    $cartItem = CartItem::factory()->create([
        'user_id' => $user->id,
        'product_id' => $product1->id,
        'product_variation_id' => $var1->id,
        'qty' => 1,
    ]);

    $this->actingAs($user)
        ->put(route('cart.update', $cartItem), [
            'product_variation_id' => $var2->id,
        ])
        ->assertSessionHasErrors('product_variation_id');
});

test('user cannot update cart item of another user', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $product = Product::factory()->certified()->create();

    $var1 = ProductVariation::factory()->create(['product_id' => $product->id]);
    $var2 = ProductVariation::factory()->create(['product_id' => $product->id]);

    $cartItem = CartItem::factory()->create([
        'user_id' => $user2->id,
        'product_id' => $product->id,
        'product_variation_id' => $var1->id,
        'qty' => 1,
    ]);

    $this->actingAs($user1)
        ->put(route('cart.update', $cartItem), [
            'product_variation_id' => $var2->id,
        ])
        ->assertNotFound();
});
