<?php

declare(strict_types=1);

namespace App\Actions\Cart;

use App\Models\CartItem;
use App\Models\User;

final readonly class RemoveCartItem
{
    public function handle(User $user, CartItem $item): void
    {
        $item->delete();
    }
}
