<?php

declare(strict_types=1);

use App\Actions\Cart\PlaceOrder;
use App\Enums\PaymentStatus;
use App\Models\Address;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ShippingOption;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

test('places order and decrements stock and clears selected cart items', function () {
    $user = User::factory()->create();
    $product = Product::factory()->certified()->create(['price' => 50000, 'stock' => 10]);
    $address = Address::factory()->create(['user_id' => $user->id]);
    $shippingOption = ShippingOption::factory()->create(['fee' => 8000]);

    CartItem::factory()->create([
        'user_id' => $user->id,
        'product_id' => $product->id,
        'qty' => 3,
        'selected' => true,
    ]);

    $action = app(PlaceOrder::class);
    $order = $action->handle($user, $address, $shippingOption, 'cod');

    expect($order)->toBeInstanceOf(Order::class)
        ->and($order->subtotal)->toBe(150000)
        ->and($order->shipping_fee)->toBe(8000)
        ->and($order->cod_fee)->toBe(2000)
        ->and($order->total)->toBe(160000);

    // Stock decremented
    expect($product->fresh()->stock)->toBe(7);

    // Selected cart items cleared
    expect(CartItem::where('user_id', $user->id)->count())->toBe(0);

    // Payment record created
    $this->assertDatabaseHas('payments', [
        'order_id' => $order->id,
        'method' => 'cod',
        'status' => PaymentStatus::Pending->value,
        'amount' => 160000,
    ]);
});

test('out of stock throws validation exception', function () {
    $user = User::factory()->create();
    $product = Product::factory()->certified()->create(['price' => 50000, 'stock' => 2]);
    $address = Address::factory()->create(['user_id' => $user->id]);
    $shippingOption = ShippingOption::factory()->create(['fee' => 8000]);

    CartItem::factory()->create([
        'user_id' => $user->id,
        'product_id' => $product->id,
        'qty' => 5,
        'selected' => true,
    ]);

    $action = app(PlaceOrder::class);
    $this->expectException(ValidationException::class);
    $action->handle($user, $address, $shippingOption, 'cod');
});

test('checkout request rejects an out of stock selected item', function () {
    $user = User::factory()->create();
    $product = Product::factory()->certified()->create(['price' => 50000, 'stock' => 0]);
    $address = Address::factory()->create(['user_id' => $user->id]);
    $shippingOption = ShippingOption::factory()->create(['fee' => 8000]);

    CartItem::factory()->create([
        'user_id' => $user->id,
        'product_id' => $product->id,
        'qty' => 1,
        'selected' => true,
    ]);

    $this->actingAs($user)
        ->post(route('checkout.store'), [
            'address_id' => $address->id,
            'shipping_option_id' => $shippingOption->id,
            'payment_method' => 'cod',
        ])
        ->assertSessionHasErrors('cart');
});
