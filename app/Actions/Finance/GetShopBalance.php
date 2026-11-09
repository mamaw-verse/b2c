<?php

declare(strict_types=1);

namespace App\Actions\Finance;

use App\Enums\PayoutStatus;
use App\Models\Shop;

final readonly class GetShopBalance
{
    /**
     * @return array{pending: int, available: int, paid: int}
     */
    public function handle(Shop $shop): array
    {
        $entries = $shop->ledgerEntries();

        return [
            'pending' => (int) (clone $entries)->where('available_at', '>', now())->sum('amount'),
            'available' => (int) (clone $entries)->where('available_at', '<=', now())->sum('amount'),
            'paid' => (int) $shop->payouts()->where('status', PayoutStatus::Paid)->sum('amount'),
        ];
    }
}
