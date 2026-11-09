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

test('cart and checkout expose changed stock without hiding the selection', function (int $stock, int $qty, string $warning, bool $hasVariation) {
    $user = User::factory()->create();
    $product = Product::factory()->certified()->create(['stock' => $hasVariation ? 100 : $stock]);
    $variation = $hasVariation
        ? App\Models\ProductVariation::factory()->create(['product_id' => $product->id, 'stock' => $stock])
        : null;
    CartItem::factory()->create([
        'user_id' => $user->id,
        'product_id' => $product->id,
        'product_variation_id' => $variation?->id,
        'qty' => $qty,
        'selected' => true,
    ]);

    $this->actingAs($user)->get(route('cart.index'))
        ->assertOk()
        ->assertInertia(fn (Inertia\Testing\AssertableInertia $page) => $page
            ->where('groups.0.items.0.selected', true)
            ->where('groups.0.items.0.stock', $stock)
            ->where('groups.0.items.0.unavailable', $warning));

    $this->get(route('checkout.show'))
        ->assertOk()
        ->assertInertia(fn (Inertia\Testing\AssertableInertia $page) => $page
            ->where('groups.0.items.0.stock', $stock)
            ->where('groups.0.items.0.unavailable', $warning));
})->with([
    'sold out' => [0, 1, 'Out of stock — remove or deselect to checkout', false],
    'quantity exceeds stock' => [2, 3, 'Only 2 left — reduce quantity or deselect to checkout', false],
    'variation sold out' => [0, 1, 'Out of stock — remove or deselect to checkout', true],
    'variation quantity exceeds stock' => [2, 3, 'Only 2 left — reduce quantity or deselect to checkout', true],
]);

test('deselecting an unavailable item lets the remaining selection checkout', function () {
    $user = User::factory()->create();
    $available = Product::factory()->certified()->create(['stock' => 10]);
    $soldOut = Product::factory()->certified()->create(['stock' => 0]);
    $address = Address::factory()->create(['user_id' => $user->id]);
    $shipping = ShippingOption::factory()->create();
    CartItem::factory()->create(['user_id' => $user->id, 'product_id' => $available->id, 'qty' => 1, 'selected' => true]);
    $unavailable = CartItem::factory()->create(['user_id' => $user->id, 'product_id' => $soldOut->id, 'qty' => 1, 'selected' => true]);

    $this->actingAs($user)->put(route('cart.selection.update'), [
        'item_ids' => [$unavailable->id],
        'selected' => false,
    ])->assertRedirect();
    $this->post(route('checkout.store'), [
        'address_id' => $address->id,
        'shipping_option_id' => $shipping->id,
        'payment_method' => 'cod',
    ])->assertSessionHasNoErrors()->assertRedirect();

    $this->assertDatabaseCount('orders', 1);
    $this->assertDatabaseHas('cart_items', ['id' => $unavailable->id, 'selected' => false]);
    $this->assertDatabaseHas('products', ['id' => $available->id, 'stock' => 9]);
    $this->assertDatabaseHas('products', ['id' => $soldOut->id, 'stock' => 0]);
});

test('stock changes reject the entire mixed checkout without changing inventory', function () {
    $user = User::factory()->create();
    $available = Product::factory()->certified()->create(['stock' => 10]);
    $changed = Product::factory()->certified()->create(['stock' => 5]);
    $address = Address::factory()->create(['user_id' => $user->id]);
    $shipping = ShippingOption::factory()->create();
    foreach ([$available, $changed] as $product) {
        CartItem::factory()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'qty' => 3,
            'selected' => true,
        ]);
    }
    $this->actingAs($user)->get(route('checkout.show'))->assertOk();
    $changed->update(['stock' => 2]);

    $this->post(route('checkout.store'), [
        'address_id' => $address->id,
        'shipping_option_id' => $shipping->id,
        'payment_method' => 'cod',
    ])->assertSessionHasErrors('cart');

    $this->assertDatabaseCount('orders', 0);
    $this->assertDatabaseCount('payments', 0);
    $this->assertDatabaseCount('cart_items', 2);
    $this->assertDatabaseHas('products', ['id' => $available->id, 'stock' => 10]);
    $this->assertDatabaseHas('products', ['id' => $changed->id, 'stock' => 2]);
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
