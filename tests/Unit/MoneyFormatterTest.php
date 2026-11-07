<?php

declare(strict_types=1);

use App\Support\Money;

test('formats whole-peso centavos with thousands separators and no decimals', function () {
    expect(Money::format(156000))->toBe('₱1,560')
        ->and(Money::format(166000))->toBe('₱1,660')
        ->and(Money::format(0))->toBe('₱0')
        ->and(Money::format(2653300))->toBe('₱26,533');
});

test('formats non-zero centavos with two decimals', function () {
    expect(Money::format(1794))->toBe('₱17.94')
        ->and(Money::format(156050))->toBe('₱1,560.50')
        ->and(Money::format(5))->toBe('₱0.05');
});

test('formats negative centavos with a leading minus', function () {
    expect(Money::format(-8000))->toBe('-₱80')
        ->and(Money::format(-1794))->toBe('-₱17.94');
});
