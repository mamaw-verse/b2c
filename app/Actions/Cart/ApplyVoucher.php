<?php

declare(strict_types=1);

namespace App\Actions\Cart;

use App\Models\CartItem;
use App\Models\User;
use App\Models\Voucher;
use App\Support\Money;
use Illuminate\Validation\ValidationException;

final readonly class ApplyVoucher
{
    /** @param list<string> $cartItemIds */
    public function handle(User $user, string $code, array $cartItemIds = []): Voucher
    {
        /** @var Voucher|null $voucher */
        $voucher = Voucher::where('code', mb_strtoupper(mb_trim($code)))
            ->where('is_active', true)
            ->first();

        if ($voucher === null) {
            throw ValidationException::withMessages([
                'code' => 'Invalid or inactive voucher code.',
            ]);
        }

        if ($voucher->starts_at && $voucher->starts_at->isFuture()) {
            throw ValidationException::withMessages([
                'code' => 'This voucher is not yet active.',
            ]);
        }

        if ($voucher->expires_at && $voucher->expires_at->isPast()) {
            throw ValidationException::withMessages([
                'code' => 'This voucher has expired.',
            ]);
        }

        if ($voucher->max_uses !== null && $voucher->used_count >= $voucher->max_uses) {
            throw ValidationException::withMessages([
                'code' => 'This voucher has reached its usage limit.',
            ]);
        }

        $itemsQuery = CartItem::with(['product', 'variation'])
            ->where('user_id', $user->id)
            ->where('selected', true);

        if (! empty($cartItemIds)) {
            $itemsQuery->whereIn('id', $cartItemIds);
        }

        $items = $itemsQuery->get();

        if ($items->isEmpty()) {
            throw ValidationException::withMessages([
                'code' => 'No eligible items in cart to apply this voucher.',
            ]);
        }

        if ($voucher->shop_id !== null) {
            $items = $items->filter(fn (CartItem $i) => $i->product->shop_id === $voucher->shop_id);
            if ($items->isEmpty()) {
                throw ValidationException::withMessages([
                    'code' => 'This voucher is only valid for items from its specific shop.',
                ]);
            }
        }

        $subtotal = $items->sum(function (CartItem $item): int {
            $price = $item->variation?->price ?? $item->product->price;

            return $price * $item->qty;
        });

        if ($subtotal < $voucher->min_spend) {
            throw ValidationException::withMessages([
                'code' => 'Minimum spend of '.Money::format($voucher->min_spend).' required for this voucher (current subtotal: '.Money::format($subtotal).').',
            ]);
        }

        return $voucher;
    }
}
