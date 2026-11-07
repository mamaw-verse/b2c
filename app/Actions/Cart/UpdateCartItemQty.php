<?php

declare(strict_types=1);

namespace App\Actions\Cart;

use App\Models\CartItem;
use App\Models\User;
use Illuminate\Validation\ValidationException;

final readonly class UpdateCartItemQty
{
    public function handle(User $user, CartItem $item, int $qty): CartItem
    {
        $clampedQty = max(1, min(99, $qty));

        $item->loadMissing(['product', 'variation']);
        $availableStock = $item->variation ? $item->variation->stock : $item->product->stock;

        if ($clampedQty > $availableStock) {
            throw ValidationException::withMessages([
                'qty' => "Requested quantity exceeds available stock of {$availableStock}.",
            ]);
        }

        $item->update(['qty' => $clampedQty]);

        return $item;
    }
}
