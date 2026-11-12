<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Enums\OrderStatus;
use App\Models\Conversation;
use App\Models\Order;
use App\Models\Shop;
use App\Models\User;

final readonly class GetSellerCustomer
{
    /**
     * @return array<string, mixed>
     */
    public function handle(Shop $shop, User $customer): array
    {
        $orders = Order::query()
            ->where('shop_id', $shop->id)
            ->where('user_id', $customer->id)
            ->with(['address'])
            ->latest()
            ->get();

        $nonCancelledOrders = $orders->where('status', '!=', OrderStatus::Cancelled);

        if ($nonCancelledOrders->isEmpty()) {
            abort(404);
        }

        $phoneNumbers = $orders
            ->map(fn (Order $order) => $order->address?->phone)
            ->filter()
            ->unique()
            ->values()
            ->all();

        $shippingAddresses = $orders
            ->map(fn (Order $order) => $order->address?->formatAddress() ?? $order->address?->street)
            ->filter()
            ->unique()
            ->values()
            ->all();

        $totals = [
            'orders' => $orders->count(),
            'completed' => $orders->where('status', OrderStatus::Completed)->count(),
            'cancelled' => $orders->where('status', OrderStatus::Cancelled)->count(),
            'return_refund' => $orders->whereIn('status', [OrderStatus::ReturnRefund, OrderStatus::Refunded])->count(),
            'total_spent' => (int) $orders->where('status', OrderStatus::Completed)->sum('total'),
        ];

        $orderList = $orders->map(fn (Order $order) => [
            'id' => $order->referenceNumber(),
            'raw_id' => $order->id,
            'date' => $order->created_at?->toISOString(),
            'status' => $order->status->label(),
            'status_variant' => $order->status->badgeVariant(),
            'total' => $order->total,
            'url' => route('seller.orders.show', $order),
        ])->all();

        $conversationId = Conversation::where('user_id', $customer->id)
            ->where('shop_id', $shop->id)
            ->value('id');

        $chatUrl = $conversationId
            ? route('seller.chat.show', $conversationId)
            : ($orders->isNotEmpty() ? route('seller.orders.chat.store', $orders->first()) : null);

        return [
            'id' => $customer->id,
            'name' => $customer->name,
            'email' => $customer->email,
            'joined_date' => $customer->created_at?->toISOString(),
            'phone_numbers' => $phoneNumbers,
            'shipping_addresses' => $shippingAddresses,
            'totals' => $totals,
            'orders' => $orderList,
            'chat_url' => $chatUrl,
        ];
    }
}
