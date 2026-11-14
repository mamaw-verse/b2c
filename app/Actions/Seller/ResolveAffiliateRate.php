<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Models\Product;

final readonly class ResolveAffiliateRate
{
    public function handle(Product $product): ?int
    {
        if (! $product->affiliate_enabled) {
            return null;
        }

        if (! $product->published || (bool) $product->hidden) {
            return null;
        }

        if (! $product->halal_status->visibleToBuyers()) {
            return null;
        }

        if (! $product->relationLoaded('shop')) {
            $product->load('shop');
        }

        $shop = $product->shop;
        if ($shop === null || ! $shop->isApproved() || $shop->suspended) {
            return null;
        }

        return $product->affiliate_commission_bps ?? (int) config('marketplace.affiliate.default_bps', 500);
    }
}
