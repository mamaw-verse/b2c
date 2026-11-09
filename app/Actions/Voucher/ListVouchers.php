<?php

declare(strict_types=1);

namespace App\Actions\Voucher;

use App\Models\Shop;
use App\Models\Voucher;

final readonly class ListVouchers
{
    /**
     * @return array<string, mixed>
     */
    public function handle(?Shop $shop): array
    {
        return [
            'vouchers' => Voucher::query()
                ->with('shop:id,name')
                ->when(
                    $shop,
                    fn ($query) => $query->where('shop_id', $shop->id),
                    fn ($query) => $query->whereNull('shop_id'),
                )
                ->latest()
                ->limit(200)
                ->get()
                ->map(fn (Voucher $voucher) => [
                    'id' => $voucher->id,
                    'code' => $voucher->code,
                    'kind' => $voucher->kind->value,
                    'discount_type' => $voucher->discount_type->value,
                    'discount_value' => $voucher->discount_value,
                    'max_discount' => $voucher->max_discount,
                    'min_spend' => $voucher->min_spend,
                    'max_uses' => $voucher->max_uses,
                    'used_count' => $voucher->used_count,
                    'starts_at' => $voucher->starts_at?->toDateString(),
                    'expires_at' => $voucher->expires_at?->toDateString(),
                    'is_active' => $voucher->is_active,
                    'shop' => $voucher->shop?->name,
                ]),
        ];
    }
}
