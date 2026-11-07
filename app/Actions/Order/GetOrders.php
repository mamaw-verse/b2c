<?php

declare(strict_types=1);

namespace App\Actions\Order;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

final readonly class GetOrders
{
    /**
     * @return LengthAwarePaginator<Order>
     */
    public function handle(User $user, ?OrderStatus $status = null): LengthAwarePaginator
    {
        return Order::with(['shop', 'items.product.images', 'items.review', 'events'])
            ->where('user_id', $user->id)
            ->when($status !== null, fn ($q) => $q->where('status', $status))
            ->orderByDesc('created_at')
            ->paginate(10);
    }

    /**
     * @return array<string, int>
     */
    public function counts(User $user): array
    {
        $rows = Order::where('user_id', $user->id)
            ->selectRaw('status, count(*) as cnt')
            ->groupBy('status')
            ->pluck('cnt', 'status');

        $counts = [];
        foreach (OrderStatus::cases() as $case) {
            $counts[$case->value] = (int) ($rows[$case->value] ?? 0);
        }

        return $counts;
    }
}
