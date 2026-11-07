<?php

declare(strict_types=1);

namespace App\Actions\Cart;

use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final readonly class AddToCart
{
    public function handle(User $user, Product $product, ?ProductVariation $variation = null, int $qty = 1): CartItem
    {
        if (! $product->published || ! $product->halal_status->visibleToBuyers()) {
            throw ValidationException::withMessages([
                'product' => 'This product is not currently available for purchase.',
            ]);
        }

        if ($variation !== null && $variation->product_id !== $product->id) {
            throw ValidationException::withMessages([
                'variation' => 'Selected variation does not belong to this product.',
            ]);
        }

        $availableStock = $variation ? $variation->stock : $product->stock;
        if ($availableStock < 1) {
            throw ValidationException::withMessages([
                'qty' => 'This item is out of stock.',
            ]);
        }

        return DB::transaction(function () use ($user, $product, $variation, $qty, $availableStock): CartItem {
            /** @var CartItem|null $existing */
            $existing = CartItem::where('user_id', $user->id)
                ->where('product_id', $product->id)
                ->where('product_variation_id', $variation?->id)
                ->first();

            if ($existing) {
                $newQty = $existing->qty + $qty;
                if ($newQty > $availableStock) {
                    throw ValidationException::withMessages([
                        'qty' => "Cannot add more items. Only {$availableStock} items in stock.",
                    ]);
                }

                $existing->update([
                    'qty' => $newQty,
                    'selected' => true,
                ]);

                return $existing;
            }

            if ($qty > $availableStock) {
                throw ValidationException::withMessages([
                    'qty' => "Cannot add {$qty} items. Only {$availableStock} items in stock.",
                ]);
            }

            return CartItem::create([
                'user_id' => $user->id,
                'product_id' => $product->id,
                'product_variation_id' => $variation?->id,
                'qty' => $qty,
                'selected' => true,
            ]);
        });
    }
}
