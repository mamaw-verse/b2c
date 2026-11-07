<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Enums\OrderStatus;
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
            'id' => '#'.mb_strtoupper(mb_substr($order->id, -11)),
            'raw_id' => $order->id,
            'status' => $order->status->label(),
            'status_raw' => $order->status->value,
            'created_at' => $order->created_at?->format('M d, Y h:i A'),
            'buyer' => [
                'id' => $order->user->id,
                'name' => $order->user->name,
                'email' => $order->user->email,
            ],
            'shipping_address' => [
                'recipient_name' => $order->address?->name,
                'phone' => $order->address?->phone,
                'street' => $order->address?->street,
                'barangay' => $order->address?->barangay?->name ?? $order->address?->barangay_code,
                'city' => $order->address?->city?->name ?? $order->address?->city_code,
                'province' => $order->address?->province?->name ?? $order->address?->province_code,
                'postal_code' => $order->address?->postal_code,
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
                'subtotal' => $order->subtotal,
                'shipping_fee' => $order->shipping_fee,
                'voucher_discount' => $order->voucher_discount,
                'total' => $order->total,
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
                'thumbnail_icon' => $item->product?->images->first()?->icon ?? 'package',
                'frozen' => $item->product?->frozen ?? false,
            ]),
            'timeline' => $order->events->map(fn ($e) => [
                'title' => $e->title,
                'detail' => $e->detail,
                'time' => $e->created_at?->format('M d, Y h:i A'),
                'state' => 'done',
            ]),
            'can_ship' => $order->status === OrderStatus::ToShip,
        ];
    }
}
