<?php

declare(strict_types=1);

namespace App\Actions\Voucher;

use App\Enums\DiscountType;
use App\Enums\VoucherKind;
use App\Models\Voucher;
use App\Support\Money;

final readonly class ListActiveVouchers
{
    /**
     * @return list<array{title: string, min: string|null, expiry: string, kind: string}>
     */
    public function handle(int $limit = 3): array
    {
        return Voucher::with('shop')
            ->where('is_active', true)
            ->where(fn ($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->orderBy('expires_at')
            ->limit($limit)
            ->get()
            ->map(fn (Voucher $voucher) => [
                'title' => $this->title($voucher),
                'min' => $voucher->min_spend > 0
                    ? 'Min. spend '.Money::format($voucher->min_spend)
                    : null,
                'expiry' => $voucher->expires_at
                    ? 'Valid till '.$voucher->expires_at->format('M d')
                    : 'No expiry',
                'kind' => $voucher->kind->value,
            ])
            ->all();
    }

    private function title(Voucher $voucher): string
    {
        if ($voucher->kind === VoucherKind::Shipping) {
            return $voucher->max_discount !== null
                ? 'Free shipping up to '.Money::format($voucher->max_discount)
                : 'Free shipping';
        }

        $value = $voucher->discount_type === DiscountType::Fixed
            ? Money::format($voucher->discount_value)
            : $voucher->discount_value.'%';

        $base = "{$value} off";

        return $voucher->shop ? "{$base} {$voucher->shop->name}" : $base;
    }
}
