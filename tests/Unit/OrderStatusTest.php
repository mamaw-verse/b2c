<?php

declare(strict_types=1);

use App\Enums\OrderStatus;

test('every order status has a label and a valid badge variant', function () {
    $valid = ['neutral', 'info', 'warning', 'success', 'danger'];

    foreach (OrderStatus::cases() as $status) {
        expect($status->label())->not->toBe('')
            ->and($status->badgeVariant())->toBeIn($valid);
    }
});

test('status colours follow the shared map', function () {
    expect(OrderStatus::ToShip->badgeVariant())->toBe('warning')
        ->and(OrderStatus::ToReceive->badgeVariant())->toBe('info')
        ->and(OrderStatus::Completed->badgeVariant())->toBe('success')
        ->and(OrderStatus::Cancelled->badgeVariant())->toBe('neutral')
        ->and(OrderStatus::ReturnRefund->badgeVariant())->toBe('danger');
});
