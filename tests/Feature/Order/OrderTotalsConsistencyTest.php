<?php

declare(strict_types=1);

use App\Models\Address;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\ShippingOption;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('cart, checkout, buyer order and seller order totals agree for the same order', function () {
    $buyer = User::factory()->create();
    $sellerUser = User::factory()->create(['role' => 'seller']);
    $product = Product::factory()->certified()->create([
        'price' => 78000,
        'stock' => 10,
        'shop_id' => Shop::factory()->create(['user_id' => $sellerUser->id])->id,
    ]);
    $address = Address::factory()->create(['user_id' => $buyer->id]);
    $shipping = ShippingOption::factory()->create(['fee' => 8000]);

    CartItem::factory()->create([
        'user_id' => $buyer->id,
        'product_id' => $product->id,
        'qty' => 2,
        'selected' => true,
    ]);

    // Cart page subtotal matches the product price × qty.
    $cart = $this->actingAs($buyer)->get(route('cart.index'));
    $cart->assertOk();
    $cartProps = $cart->viewData('page')['props'];
    expect($cartProps['selectedTotal'])->toBe(156000);

    // Checkout summary carries the same subtotal in centavos.
    $checkout = $this->actingAs($buyer)->get(route('checkout.show'));
    $checkout->assertOk();
    $checkoutProps = $checkout->viewData('page')['props'];
    expect($checkoutProps['summary']['subtotal'])->toBe(156000)
        ->and($checkoutProps['summary']['shippingFee'])->toBe(8000);

    // Place the order with COD; stored totals stay integer centavos.
    $this->actingAs($buyer)->post(route('checkout.store'), [
        'address_id' => $address->id,
        'shipping_option_id' => $shipping->id,
        'payment_method' => 'cod',
    ]);

    $order = Order::sole();
    expect($order->subtotal)->toBe(156000)
        ->and($order->shipping_fee)->toBe(8000)
        ->and($order->cod_fee)->toBe(2000)
        ->and($order->total)->toBe(166000);

    // Buyer order detail exposes the same totals.
    $buyerOrder = $this->actingAs($buyer)->get(route('orders.show', $order));
    $buyerOrder->assertOk();
    $buyerProps = $buyerOrder->viewData('page')['props'];
    expect($buyerProps['order']['subtotal'])->toBe(156000)
        ->and($buyerProps['order']['total'])->toBe(166000);

    // Seller order view exposes the same totals.
    $sellerOrder = $this->actingAs($sellerUser)->get(route('seller.orders.show', $order));
    $sellerOrder->assertOk();
    $sellerProps = $sellerOrder->viewData('page')['props'];
    expect($sellerProps['order']['payment']['subtotal'])->toBe(156000)
        ->and($sellerProps['order']['payment']['shipping_fee'])->toBe(8000)
        ->and($sellerProps['order']['payment']['total'])->toBe(166000);
});
