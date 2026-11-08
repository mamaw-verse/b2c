<?php

declare(strict_types=1);

use App\Models\Order;
use App\Values\OrderTotals;

test('forOrder maps the stored order totals', function () {
    $order = new Order([
        'subtotal' => 156000,
        'shipping_fee' => 8000,
        'shipping_discount' => 0,
        'voucher_discount' => 0,
        'platform_voucher_discount' => 0,
        'cod_fee' => 2000,
        'total' => 166000,
    ]);

    $totals = OrderTotals::forOrder($order);

    expect($totals->subtotal)->toBe(156000)
        ->and($totals->shipping)->toBe(8000)
        ->and($totals->codFee)->toBe(2000)
        ->and($totals->discount())->toBe(0)
        ->and($totals->total)->toBe(166000)
        ->and($totals->subtotal + $totals->shipping + $totals->codFee - $totals->discount())
        ->toBe($totals->total);
});

test('total is invariant under discounts', function () {
    $totals = new OrderTotals(
        subtotal: 100000,
        shipping: 8000,
        shippingDiscount: 4000,
        voucherDiscount: 10000,
        platformVoucherDiscount: 5000,
        codFee: 2000,
        total: 91000,
    );

    expect($totals->discount())->toBe(19000)
        ->and($totals->total)->toBe(91000);
});
