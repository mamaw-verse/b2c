<?php

declare(strict_types=1);

namespace App\Actions\Finance;

use App\Models\Shop;

final readonly class UpdatePayoutAccount
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(Shop $shop, array $data): Shop
    {
        $shop->update($data);

        return $shop;
    }
}
