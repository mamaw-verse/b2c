<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Models\Order;
use App\Models\Shop;

final readonly class GetSellerOrder
{
    /**
     * @return array<string, mixed>
     */
    public function handle(Shop $shop, Order $order): array
    {
        $order->load(['items.product.images', 'items.variation', 'user', 'address', 'shippingOption', 'events']);

        return [
            'id' => $order->referenceNumber(),
            'reference' => $order->referenceNumber(),
            'raw_id' => $order->id,
            'status' => $order->status->label(),
            'status_raw' => $order->status->value,
            'status_variant' => $order->status->badgeVariant(),
            'created_at' => $order->created_at?->toISOString(),
            'buyer' => [
                'id' => $order->user->id,
                'name' => $order->user->name,
                'email' => $order->user->email,
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
                'frozen' => $item->product->frozen ?? false,
            ]),
            'timeline' => $order->events->map(fn ($e) => [
                'title' => $e->title,
                'detail' => $e->detail,
                'time' => $e->created_at?->toISOString(),
                'courier_name' => $e->metadata['courier_name'] ?? null,
                'tracking_number' => $e->metadata['tracking_number'] ?? null,
                'state' => 'done',
            ]),
            'can_ship' => $order->status === OrderStatus::ToShip,
        ];
    }
}
