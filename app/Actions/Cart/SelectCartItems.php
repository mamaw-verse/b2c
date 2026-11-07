<?php

declare(strict_types=1);

namespace App\Actions\Cart;

use App\Models\CartItem;
use App\Models\User;

final readonly class SelectCartItems
{
    /** @param list<string> $itemIds */
    public function handle(User $user, array $itemIds, bool $selected): void
    {
        CartItem::where('user_id', $user->id)
            ->whereIn('id', $itemIds)
            ->update(['selected' => $selected]);
    }
}
