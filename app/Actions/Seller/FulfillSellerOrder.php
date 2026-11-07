<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderEvent;
use Illuminate\Support\Facades\DB;

final readonly class FulfillSellerOrder
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(Order $order, array $data = []): Order
    {
        return DB::transaction(function () use ($order, $data) {
            $trackingNumber = $data['tracking_number'] ?? 'PH-'.mb_strtoupper(bin2hex(random_bytes(5)));
            $carrier = $data['carrier'] ?? $order->shippingOption->name;

            $order->update([
                'status' => OrderStatus::ToReceive,
            ]);

            OrderEvent::create([
                'order_id' => $order->id,
                'title' => 'Parcel shipped',
                'detail' => "Shipment arranged with {$carrier}. Tracking number: {$trackingNumber}.",
            ]);

            return $order;
        });
    }
}
