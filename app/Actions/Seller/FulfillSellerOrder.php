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
            $trackingNumber = $data['tracking_number'];
            $courierName = $data['courier_name'];

            $order->update([
                'status' => OrderStatus::ToReceive,
            ]);

            OrderEvent::create([
                'order_id' => $order->id,
                'title' => 'Parcel shipped',
                'detail' => "Shipment arranged with {$courierName}. Tracking number: {$trackingNumber}.",
                'metadata' => [
                    'courier_name' => $courierName,
                    'tracking_number' => $trackingNumber,
                ],
            ]);

            return $order;
        });
    }
}
