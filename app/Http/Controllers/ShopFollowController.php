<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Shop\FollowShop;
use App\Actions\Shop\UnfollowShop;
use App\Http\Requests\FollowShopRequest;
use App\Models\Shop;
use Illuminate\Http\RedirectResponse;

final class ShopFollowController
{
    public function store(FollowShopRequest $request, Shop $shop, FollowShop $action): RedirectResponse
    {
        $action->handle($shop, $request->user());

        return back();
    }

    public function destroy(FollowShopRequest $request, Shop $shop, UnfollowShop $action): RedirectResponse
    {
        $action->handle($shop, $request->user());

        return back();
    }
}
