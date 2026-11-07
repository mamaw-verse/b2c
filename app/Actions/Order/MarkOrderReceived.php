<?php

declare(strict_types=1);

namespace App\Actions\Order;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderEvent;
use App\Models\User;
use Illuminate\Validation\ValidationException;

final readonly class MarkOrderReceived
{
    public function handle(User $user, Order $order): void
    {
        if ($order->user_id !== $user->id) {
            throw ValidationException::withMessages(['order' => 'Order not found.']);
        }

        if ($order->status !== OrderStatus::ToReceive) {
            throw ValidationException::withMessages(['order' => 'Order cannot be marked as received.']);
        }

        $order->update(['status' => OrderStatus::Completed]);

        OrderEvent::create([
            'order_id' => $order->id,
            'title' => 'Order received',
            'detail' => 'Confirmed by buyer.',
        ]);

        $user->notify(new \App\Notifications\OrderStatusNotification(
            $order,
            'Order completed',
            "Order #{$order->id} is completed. Thank you for your purchase!",
        ));
    }
}
