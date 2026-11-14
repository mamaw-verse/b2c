<?php

declare(strict_types=1);

namespace App\Http\Controllers\Seller;

use App\Http\Requests\Seller\ShowSuspendedShopRequest;
use App\Models\Shop;
use Inertia\Inertia;
use Inertia\Response;

final class SuspendedShopController
{
    public function __invoke(ShowSuspendedShopRequest $request): Response
    {
        $shop = $request->user()->operatedShop();
        assert($shop instanceof Shop);

        return Inertia::render('seller/suspended', [
            'shop' => [
                'name' => $shop->name,
                'status' => $shop->status->value,
            ],
            'supportEmail' => config('marketplace.support.email'),
        ]);
    }
}
