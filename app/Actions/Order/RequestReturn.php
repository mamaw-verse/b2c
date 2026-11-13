<?php

declare(strict_types=1);

namespace App\Actions\Order;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderEvent;
use App\Models\User;
use Illuminate\Validation\ValidationException;

final readonly class RequestReturn
{
    /** @param array<int, array{order_item_id: string, qty: int}> $items */
    public function handle(User $user, Order $order, string $reason, array $items = []): void
    {
        if ($order->user_id !== $user->id) {
            throw ValidationException::withMessages(['order' => 'Order not found.']);
        }

        if (! $order->status->isReturnable()) {
            throw ValidationException::withMessages(['order' => 'This order is not eligible for return/refund.']);
        }

        $order->update(['status' => OrderStatus::ReturnRefund]);

        OrderEvent::create([
            'order_id' => $order->id,
            'title' => 'Return/refund requested',
            'detail' => $reason,
            'metadata' => ['items' => $items],
        ]);
    }
}
