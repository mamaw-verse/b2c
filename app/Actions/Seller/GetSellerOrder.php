<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Models\Conversation;
use App\Models\Order;
use App\Models\Shop;
use App\Support\CourierTracking;

final readonly class GetSellerOrder
{
    /**
     * @return array<string, mixed>
     */
    public function handle(Shop $shop, Order $order): array
    {
        $order->load(['items.product.images', 'items.variation', 'items.refundItems', 'refunds.items.orderItem', 'user', 'address', 'shippingOption', 'events', 'fulfillments.items']);

        return [
            'id' => $order->referenceNumber(),
            'reference' => $order->referenceNumber(),
            'raw_id' => $order->id,
            'status' => $order->status->label(),
            'status_raw' => $order->status->value,
            'status_variant' => $order->status->badgeVariant(),
            'subtotal' => $order->subtotal,
            'voucher_discount' => $order->voucher_discount,
            'location' => $shop->location ?? $shop->city,
            'created_at' => $order->created_at?->toISOString(),
            'buyer' => [
                'id' => $order->user->id,
                'name' => $order->user->name,
                'email' => $order->user->email,
                'phone' => $order->address?->phone,
                'orders_count' => $order->user->orders()->where('shop_id', $shop->id)->where('status', '!=', OrderStatus::Cancelled)->count(),
            ],
            'shipping_address' => [
                'recipient_name' => $order->address?->name,
                'phone' => $order->address?->phone,
                'street' => $order->address?->street,
                'formatted' => $order->address?->formatAddress(),
                'landmark' => $order->address?->landmark,
            ],
            'shipping_option' => [
                'name' => $order->shippingOption->name,
                'description' => $order->shippingOption->description,
                'fee' => $order->shipping_fee,
                'is_cold_chain' => $order->shippingOption->is_cold_chain,
            ],
            'payment' => [
                'method' => mb_strtoupper($order->payment_method->value),
                'method_raw' => $order->payment_method->value,
                'cod_collect_amount' => $order->payment_method === PaymentMethod::Cod ? $order->total : null,
                ...$order->totals()->toArray(),
            ],
            'items' => $order->items->map(fn ($item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'name' => $item->product_name ?? $item->product?->name,
                'slug' => $item->product?->slug,
                'variation' => $item->variation_label ?? ($item->variation ? mb_trim(($item->variation->option1_value ?? '').' '.($item->variation->option2_value ?? '')) : null),
                'price' => $item->unit_price,
                'quantity' => $item->qty,
                'subtotal' => $item->subtotal,
                'thumbnail_icon' => $item->product?->images->first()->icon ?? 'package',
                'thumbnail' => $item->product?->thumbnailUrl(),
                'frozen' => $item->product->frozen ?? false,
                'remaining' => $item->remainingQuantity(),
            ]),
            'timeline' => $order->events->map(fn ($e) => [
                'title' => $e->title,
                'detail' => $e->detail,
                'time' => $e->created_at?->toISOString(),
                'courier_name' => $e->metadata['courier_name'] ?? null,
                'tracking_number' => $e->metadata['tracking_number'] ?? null,
                'tracking_url' => CourierTracking::resolve(
                    $e->metadata['courier_name'] ?? null,
                    $e->metadata['tracking_number'] ?? null,
                    $e->metadata['tracking_url'] ?? null,
                ),
                'help_url' => $e->help_url,
                'state' => 'done',
            ]),
            'fulfillment_status' => $order->fulfillment_status->value,
            'fulfillments' => $order->fulfillments->map(fn ($fulfillment) => [
                'id' => $fulfillment->id,
                'courier_name' => $fulfillment->courier_name,
                'tracking_number' => $fulfillment->tracking_number,
                'tracking_url' => CourierTracking::resolve(
                    $fulfillment->courier_name,
                    $fulfillment->tracking_number,
                    $fulfillment->tracking_url,
                ),
                'status' => $fulfillment->status,
                'shipped_at' => $fulfillment->shipped_at->toISOString(),
                'delivered_at' => $fulfillment->delivered_at?->toISOString(),
                'items' => $fulfillment->items->map(function ($line) use ($order) {
                    $orderItem = $order->items->firstWhere('id', $line->order_item_id);

                    return [
                        'order_item_id' => $line->order_item_id,
                        'name' => $orderItem->product_name ?? $orderItem->product->name ?? 'Item',
                        'slug' => $orderItem?->product?->slug,
                        'variation' => $orderItem->variation_label ?? ($orderItem->variation ? mb_trim(($orderItem->variation->option1_value ?? '').' '.($orderItem->variation->option2_value ?? '')) : null),
                        'sku' => $orderItem->variation?->sku,
                        'thumbnail_icon' => $orderItem->product->images->first()->icon ?? 'package',
                        'thumbnail' => $orderItem->product->thumbnailUrl(),
                        'unit_price' => $orderItem->unit_price ?? 0,
                        'quantity' => $line->quantity,
                    ];
                }),
            ]),
            'chat_url' => ($conversationId = Conversation::where('user_id', $order->user_id)->where('shop_id', $shop->id)->value('id'))
                ? route('seller.chat.show', $conversationId)
                : null,
            'can_ship' => $order->status === OrderStatus::ToShip,
            'can_resolve_return' => $order->status === OrderStatus::ReturnRefund,
            'return_request' => $order->status === OrderStatus::ReturnRefund
                ? (function () use ($order) {
                    $event = $order->events->where('title', 'Return/refund requested')->sortByDesc('created_at')->first();

                    return $event ? [
                        'reason' => $event->detail,
                        'requested_at' => $event->created_at?->toISOString(),
                        'items' => $order->items->map(function ($item) use ($event): array {
                            $remaining = max(0, $item->qty - $item->refundedUnits());
                            $requestedItems = $event->metadata['items'] ?? [];
                            $requested = is_array($requestedItems) ? collect($requestedItems)->firstWhere('order_item_id', $item->id) : null;

                            return [
                                'order_item_id' => $item->id,
                                'name' => $item->product_name,
                                'qty_available' => $remaining,
                                'qty_requested' => $requested['qty'] ?? $remaining,
                                'unit_price' => $item->unit_price,
                            ];
                        })->filter(fn (array $item): bool => $item['qty_available'] > 0)->values(),
                        'refunded_gross' => $order->refunds->sum(fn ($refund) => $refund->items->sum(fn ($item) => $item->orderItem->unit_price * $item->qty)),
                        'refunded_net' => $order->refunds->sum('amount'),
                    ] : null;
                })()
                : null,
        ];
    }
}
