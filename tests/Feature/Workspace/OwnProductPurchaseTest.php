<?php

declare(strict_types=1);

use App\Models\Address;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Product;
use App\Models\ShippingOption;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seller = User::factory()->create();
    $this->shop = Shop::factory()->create(['user_id' => $this->seller->id]);
    $this->category = Category::factory()->create();
    $this->ownProduct = Product::factory()->create([
        'shop_id' => $this->shop->id,
        'category_id' => $this->category->id,
    ]);
});

test('a seller cannot add their own product to the cart', function () {
    $this->actingAs($this->seller)
        ->post('/cart', [
            'product_id' => $this->ownProduct->id,
            'qty' => 1,
        ])
        ->assertSessionHasErrors('product_id');

    $this->assertDatabaseMissing('cart_items', [
        'user_id' => $this->seller->id,
        'product_id' => $this->ownProduct->id,
    ]);
});

test('other buyers can still add the product to their cart', function () {
    $buyer = User::factory()->create();

    $this->actingAs($buyer)
        ->post('/cart', [
            'product_id' => $this->ownProduct->id,
            'qty' => 1,
        ])
        ->assertSessionDoesntHaveErrors();

    $this->assertDatabaseHas('cart_items', [
        'user_id' => $buyer->id,
        'product_id' => $this->ownProduct->id,
    ]);
});

test('a seller cannot check out an order from their own shop', function () {
    CartItem::factory()->create([
        'user_id' => $this->seller->id,
        'product_id' => $this->ownProduct->id,
        'selected' => true,
    ]);
    $address = Address::factory()->create(['user_id' => $this->seller->id]);
    $shipping = ShippingOption::factory()->create();

    $this->actingAs($this->seller)
        ->post('/checkout', [
            'address_id' => $address->id,
            'shipping_option_id' => $shipping->id,
            'payment_method' => 'cod',
        ])
        ->assertSessionHasErrors('cart');

    $this->assertDatabaseMissing('orders', [
        'user_id' => $this->seller->id,
        'shop_id' => $this->shop->id,
    ]);
});
