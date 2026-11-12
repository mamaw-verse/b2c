<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Shop;
use Illuminate\Support\Collection;

final readonly class ListSellerCustomers
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function handle(Shop $shop): array
    {
        return Order::query()
            ->where('shop_id', $shop->id)
            ->where('status', '!=', OrderStatus::Cancelled)
            ->with('user:id,name,email')
            ->latest()
            ->get()
            ->groupBy('user_id')
            ->map(fn (Collection $orders) => [
                'id' => $orders->first()->user_id,
                'name' => $orders->first()->user->name,
                'email' => $orders->first()->user->email,
                'orders_count' => $orders->count(),
                'total_spent' => $orders->where('status', OrderStatus::Completed)->sum('total'),
                'last_order_at' => $orders->first()->created_at?->toISOString(),
                'last_order_id' => $orders->first()->id,
            ])
            ->sortByDesc('last_order_at')
            ->values()
            ->all();
    }
}
