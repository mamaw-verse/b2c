<?php

declare(strict_types=1);

namespace App\Actions\Order;

use App\Models\Order;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

final readonly class GetOrders
{
    /**
     * @return LengthAwarePaginator<int, Order>
     */
    public function handle(User $user): LengthAwarePaginator
    {
        return Order::with(['shop', 'items.product.images', 'items.review', 'events'])
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate(10);
    }
}
