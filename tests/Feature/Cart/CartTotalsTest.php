<?php

declare(strict_types=1);

use App\Actions\Cart\ComputeCartTotals;
use App\Enums\DiscountType;
use App\Enums\VoucherKind;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ShippingOption;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('computes subtotal and shipping correctly', function () {
    $user = User::factory()->create();
    $product1 = Product::factory()->certified()->create(['price' => 50000, 'stock' => 10]);
    $product2 = Product::factory()->certified()->create(['price' => 20000, 'stock' => 10]);

    CartItem::factory()->create([
        'user_id' => $user->id,
        'product_id' => $product1->id,
        'qty' => 2,
        'selected' => true,
    ]);

    CartItem::factory()->create([
        'user_id' => $user->id,
        'product_id' => $product2->id,
        'qty' => 1,
        'selected' => true,
    ]);

    $shipping = ShippingOption::factory()->create(['fee' => 10000]);

    $action = app(ComputeCartTotals::class);
    $result = $action->handle($user, null, null, $shipping);

    expect($result['subtotal'])->toBe(120000)
        ->and($result['shippingFee'])->toBe(20000)
        ->and($result['total'])->toBe(140000)
        ->and($result['isHalal'])->toBeTrue();
});

test('multi shop preview includes shipping and COD fees for every order', function () {
    $user = User::factory()->create();
    foreach ([10000, 20000] as $price) {
        $product = Product::factory()->certified()->create(['price' => $price]);
        CartItem::factory()->create(['user_id' => $user->id, 'product_id' => $product->id, 'qty' => 1, 'selected' => true]);
    }
    $shipping = ShippingOption::factory()->create(['fee' => 8000]);

    $result = app(ComputeCartTotals::class)->handle($user, null, null, $shipping, 'cod');

    expect($result['shippingFee'])->toBe(16000);
    expect($result['codFee'])->toBe(4000);
    expect($result['total'])->toBe(50000);
});

test('applies shop and platform vouchers', function () {
    $user = User::factory()->create();
    $product = Product::factory()->certified()->create(['price' => 100000, 'stock' => 10]);

    CartItem::factory()->create([
        'user_id' => $user->id,
        'product_id' => $product->id,
        'qty' => 1,
        'selected' => true,
    ]);

    $shopVoucher = Voucher::factory()->create([
        'shop_id' => $product->shop_id,
        'kind' => VoucherKind::Shop,
        'discount_type' => DiscountType::Fixed,
        'discount_value' => 10000,
        'min_spend' => 50000,
    ]);

    $shippingOption = ShippingOption::factory()->create(['fee' => 8000]);

    $action = app(ComputeCartTotals::class);
    $result = $action->handle($user, $shopVoucher, null, $shippingOption);

    expect($result['subtotal'])->toBe(100000)
        ->and($result['voucherDiscount'])->toBe(10000)
        ->and($result['total'])->toBe(98000);
});

test('COD method adds 20 pesos fee', function () {
    $user = User::factory()->create();
    $product = Product::factory()->certified()->create(['price' => 30000, 'stock' => 10]);

    CartItem::factory()->create([
        'user_id' => $user->id,
        'product_id' => $product->id,
        'qty' => 1,
        'selected' => true,
    ]);

    $shippingOption = ShippingOption::factory()->create(['fee' => 5000]);

    $action = app(ComputeCartTotals::class);
    $result = $action->handle($user, null, null, $shippingOption, 'cod');

    expect($result['codFee'])->toBe(2000)
        ->and($result['total'])->toBe(37000);
});
