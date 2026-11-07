<?php

declare(strict_types=1);

namespace App\Actions\Order;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderEvent;
use App\Models\User;
use Illuminate\Validation\ValidationException;

final readonly class CancelOrder
{
    public function handle(User $user, Order $order): void
    {
        if ($order->user_id !== $user->id) {
            throw ValidationException::withMessages(['order' => 'Order not found.']);
        }

        if (! $order->status->isCancellable()) {
            throw ValidationException::withMessages(['order' => 'This order can no longer be cancelled.']);
        }

        $order->update(['status' => OrderStatus::Cancelled]);

        OrderEvent::create([
            'order_id' => $order->id,
            'title' => 'Order cancelled',
            'detail' => 'Cancelled by buyer.',
        ]);

        $user->notify(new \App\Notifications\OrderStatusNotification(
            $order,
            'Order cancelled',
            "Order #{$order->id} was cancelled.",
        ));
    }
}
