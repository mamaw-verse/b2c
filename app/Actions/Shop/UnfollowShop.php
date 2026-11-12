<?php

declare(strict_types=1);

namespace App\Actions\Shop;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class UnfollowShop
{
    public function handle(Shop $shop, User $user): void
    {
        DB::transaction(function () use ($shop, $user) {
            $shop->followers()->detach($user->id);
            $shop->update(['followers_count' => $shop->followers()->count()]);
        });
    }
}
