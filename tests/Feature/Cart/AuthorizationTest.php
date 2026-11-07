<?php

declare(strict_types=1);

use App\Models\Address;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ShippingOption;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user cannot update another users cart item', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $product = Product::factory()->certified()->create(['stock' => 10]);

    $cartItem = CartItem::factory()->create([
        'user_id' => $user1->id,
        'product_id' => $product->id,
        'qty' => 1,
    ]);

    $this->actingAs($user2)
        ->put(route('cart.update', $cartItem), ['qty' => 5])
        ->assertNotFound();
});

test('user cannot delete another users cart item', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $product = Product::factory()->certified()->create(['stock' => 10]);

    $cartItem = CartItem::factory()->create([
        'user_id' => $user1->id,
        'product_id' => $product->id,
        'qty' => 1,
    ]);

    $this->actingAs($user2)
        ->delete(route('cart.destroy', $cartItem))
        ->assertNotFound();
});

test('user cannot access checkout without selected cart items', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('checkout.show'))
        ->assertForbidden();
});

test('user cannot checkout with an address owned by another user', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $product = Product::factory()->certified()->create(['stock' => 10]);
    $shippingOption = ShippingOption::factory()->create(['fee' => 8000]);

    $addressOfUser2 = Address::factory()->create(['user_id' => $user2->id]);

    CartItem::factory()->create([
        'user_id' => $user1->id,
        'product_id' => $product->id,
        'qty' => 1,
        'selected' => true,
    ]);

    $this->actingAs($user1)
        ->post(route('checkout.store'), [
            'address_id' => $addressOfUser2->id,
            'shipping_option_id' => $shippingOption->id,
            'payment_method' => 'cod',
        ])
        ->assertNotFound();
});
