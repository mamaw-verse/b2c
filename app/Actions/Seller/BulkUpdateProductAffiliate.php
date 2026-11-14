<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Models\Shop;
use Illuminate\Support\Facades\DB;

final readonly class BulkUpdateProductAffiliate
{
    /**
     * @param  list<string>  $productIds
     */
    public function handle(Shop $shop, array $productIds, bool $enabled): int
    {
        return DB::transaction(function () use ($shop, $productIds, $enabled): int {
            $query = $shop->products()->whereIn('id', $productIds);

            if ($enabled) {
                return $query->update([
                    'affiliate_enabled' => true,
                    'affiliate_commission_bps' => DB::raw('COALESCE(affiliate_commission_bps, 500)'),
                ]);
            }

            return $query->update([
                'affiliate_enabled' => false,
            ]);
        });
    }
}
