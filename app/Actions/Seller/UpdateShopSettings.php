<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Models\Shop;

final readonly class UpdateShopSettings
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(Shop $shop, array $data): Shop
    {
        $updateData = [];

        if (isset($data['name'])) {
            $updateData['name'] = $data['name'];
        }

        if (array_key_exists('description', $data)) {
            $updateData['description'] = $data['description'];
        }

        if (isset($data['vacation_mode'])) {
            $updateData['vacation_mode'] = (bool) $data['vacation_mode'];
        }

        if (isset($data['auto_reply'])) {
            $updateData['auto_reply'] = (bool) $data['auto_reply'];
        }

        if (isset($data['shipping_channels'])) {
            $updateData['shipping_channels'] = $data['shipping_channels'];
        }

        $shop->update($updateData);

        return $shop;
    }
}
