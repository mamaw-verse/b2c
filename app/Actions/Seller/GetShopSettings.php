<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Models\Shop;

final readonly class GetShopSettings
{
    /**
     * @return array<string, mixed>
     */
    public function handle(Shop $shop): array
    {
        return [
            'id' => $shop->id,
            'name' => $shop->name,
            'slug' => $shop->slug,
            'description' => $shop->description ?? '',
            'location' => $shop->location,
            'vacation_mode' => (bool) $shop->vacation_mode,
            'auto_reply' => (bool) $shop->auto_reply,
            'shipping_channels' => $shop->shipping_channels ?? [
                'standard' => true,
                'express' => false,
                'cod' => true,
            ],
        ];
    }
}
