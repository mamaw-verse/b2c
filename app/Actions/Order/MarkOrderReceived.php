<?php

declare(strict_types=1);

namespace App\Actions\Order;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use App\Notifications\SellerOrderNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

final readonly class MarkOrderReceived
{
    public function __construct(private CompleteOrder $complete) {}

    public function handle(User $user, Order $order): void
    {
        if ($order->user_id !== $user->id) {
            throw ValidationException::withMessages(['order' => 'Order not found.']);
        }

        if ($order->status !== OrderStatus::ToReceive) {
            throw ValidationException::withMessages(['order' => 'Order cannot be marked as received.']);
        }

        Notification::send($order->shop->operators(), new SellerOrderNotification($order, 'received'));
        $this->complete->handle($order);
    }
}
