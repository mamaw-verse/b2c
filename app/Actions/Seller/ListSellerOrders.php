<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Shop;
use Illuminate\Pagination\LengthAwarePaginator;

final readonly class ListSellerOrders
{
    /**
     * @param  array{status?: string|null, search?: string|null}  $filters
     * @return LengthAwarePaginator<Order>
     */
    public function handle(Shop $shop, array $filters = []): LengthAwarePaginator
    {
        $query = $shop->orders()
            ->with(['items.product.images', 'user', 'shippingOption'])
            ->latest();

        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $statusEnum = OrderStatus::tryFrom($filters['status']);
            if ($statusEnum) {
                $query->where('status', $statusEnum);
            }
        }

        if (! empty($filters['search'])) {
            $search = '%'.$filters['search'].'%';
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', $search)
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', $search));
            });
        }

        return $query->paginate(15)->through(fn (Order $order) => [
            'id' => '#'.mb_strtoupper(mb_substr($order->id, -11)),
            'raw_id' => $order->id,
            'buyer' => $order->user->name,
            'items' => $order->items->sum('qty'),
            'total' => $order->total,
            'status' => $order->status->label(),
            'status_raw' => $order->status->value,
            'due' => null,
            'urgent' => $order->status === OrderStatus::ToShip && $order->created_at?->isToday() === true,
            'pay' => mb_strtoupper($order->payment_method->value),
            'shipping_name' => $order->shippingOption->name,
            'thumbnail_icon' => $order->items->first()?->product?->images?->first()?->icon ?? 'package',
            'created_at' => $order->created_at?->format('M d, Y h:i A'),
        ]);
    }
}
