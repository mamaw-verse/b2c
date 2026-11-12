<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Models\Fulfillment;
use App\Models\OrderEvent;
use App\Support\CourierTracking;
use Illuminate\Support\Facades\DB;

final readonly class UpdateFulfillmentTracking
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(Fulfillment $fulfillment, array $data): Fulfillment
    {
        return DB::transaction(function () use ($fulfillment, $data) {
            $fulfillment->update($data);

            OrderEvent::create([
                'order_id' => $fulfillment->order_id,
                'title' => 'Tracking updated',
                'detail' => "Tracking number: {$fulfillment->tracking_number} ({$fulfillment->courier_name}).",
                'metadata' => [
                    'fulfillment_id' => $fulfillment->id,
                    'courier_name' => $fulfillment->courier_name,
                    'tracking_number' => $fulfillment->tracking_number,
                    'tracking_url' => CourierTracking::resolve($fulfillment->courier_name, $fulfillment->tracking_number, $fulfillment->tracking_url),
                ],
            ]);

            return $fulfillment;
        });
    }
}
