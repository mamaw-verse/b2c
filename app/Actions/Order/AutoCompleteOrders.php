<?php

declare(strict_types=1);

namespace App\Actions\Order;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Support\Settings;

final readonly class AutoCompleteOrders
{
    public function __construct(private CompleteOrder $complete, private Settings $settings) {}

    public function handle(): int
    {
        $threshold = now()->subDays($this->settings->marketplaceInt('auto_confirm_days'));

        $orders = Order::query()
            ->where('status', OrderStatus::ToReceive)
            ->whereDoesntHave('fulfillments', fn ($query) => $query->where('shipped_at', '>', $threshold))
            ->get();

        $orders->each(fn (Order $order) => $this->complete->handle($order, 'Order auto-confirmed', 'Automatically confirmed after the receipt window elapsed.'));

        return $orders->count();
    }
}
