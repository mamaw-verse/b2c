<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Enums\FulfillmentStatus;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderEvent;
use App\Notifications\OrderStatusNotification;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

final readonly class FulfillSellerOrder
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(Order $order, array $data): Order
    {
        return DB::transaction(function () use ($order, $data) {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);
            $order->load('items');

            $requested = Arr::pluck($data['items'] ?? [], 'quantity', 'order_item_id');

            $lines = $order->items
                ->mapWithKeys(fn ($item) => [$item->id => $requested === [] ? $item->remainingQuantity() : (int) ($requested[$item->id] ?? 0)])
                ->filter(fn (int $quantity) => $quantity > 0);

            $fulfillment = $order->fulfillments()->create([
                'courier_name' => $data['courier_name'],
                'tracking_number' => $data['tracking_number'],
                'tracking_url' => $data['tracking_url'] ?? null,
                'status' => 'shipped',
                'shipped_at' => now(),
            ]);

            $lines->each(fn (int $quantity, string $itemId) => $fulfillment->items()->create([
                'order_item_id' => $itemId,
                'quantity' => $quantity,
            ]));

            $fulfilled = $order->items->every(fn ($item) => $item->remainingQuantity() === 0);

            $order->update([
                'fulfillment_status' => $fulfilled ? FulfillmentStatus::Fulfilled : FulfillmentStatus::Partial,
                'status' => $fulfilled ? OrderStatus::ToReceive : $order->status,
            ]);

            OrderEvent::create([
                'order_id' => $order->id,
                'title' => 'Parcel shipped',
                'detail' => "Shipment arranged with {$fulfillment->courier_name}. Tracking number: {$fulfillment->tracking_number}.",
                'metadata' => [
                    'fulfillment_id' => $fulfillment->id,
                    'courier_name' => $fulfillment->courier_name,
                    'tracking_number' => $fulfillment->tracking_number,
                ],
            ]);

            $order->user->notify(new OrderStatusNotification(
                $order,
                $fulfilled ? 'Order shipped' : 'Part of your order shipped',
                "Order {$order->referenceNumber()} has a parcel on the way with {$fulfillment->courier_name}.",
            ));

            return $order;
        });
    }
}
