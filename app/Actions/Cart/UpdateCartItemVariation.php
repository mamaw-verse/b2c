<?php

declare(strict_types=1);

namespace App\Actions\Cart;

use App\Models\CartItem;
use App\Models\ProductVariation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final readonly class UpdateCartItemVariation
{
    public function handle(User $user, CartItem $item, ProductVariation $new): CartItem
    {
        if ($new->stock < 1) {
            throw ValidationException::withMessages([
                'product_variation_id' => 'Selected variation is out of stock.',
            ]);
        }

        return DB::transaction(function () use ($user, $item, $new): CartItem {
            /** @var CartItem|null $existing */
            $existing = CartItem::where('user_id', $user->id)
                ->where('product_id', $item->product_id)
                ->where('product_variation_id', $new->id)
                ->where('id', '!=', $item->id)
                ->first();

            if ($existing) {
                $combinedQty = min(99, min($new->stock, $existing->qty + $item->qty));
                $existing->update(['qty' => $combinedQty]);
                $item->delete();

                return $existing;
            }

            $clampedQty = min(99, min($new->stock, $item->qty));
            $item->update([
                'product_variation_id' => $new->id,
                'qty' => $clampedQty,
            ]);

            return $item;
        });
    }
}
