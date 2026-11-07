<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Catalogue\ListShopProducts;
use App\Http\Requests\ShowShopRequest;
use App\Models\Shop;
use Inertia\Inertia;
use Inertia\Response;

final class ShopController
{
    /**
     * Show the shop page.
     */
    public function show(ShowShopRequest $request, Shop $shop, ListShopProducts $products): Response
    {
        return Inertia::render('shop', [
            'shop' => [
                'id' => $shop->id,
                'name' => $shop->name,
                'slug' => $shop->slug,
                'location' => $shop->location,
                'rating' => $shop->rating,
                'followers_count' => $shop->followers_count,
                'chat_response_rate' => $shop->chat_response_rate,
                'verification' => $shop->verification,
                'halal_only' => $shop->halal_only,
                'logo_url' => $shop->logo_url,
                'banner_url' => $shop->banner_url,
                'products_count' => $shop->products()->visible()->count(),
            ],
            'products' => Inertia::scroll(fn () => $products->handle($shop, $request->sort())),
        ]);
    }
}
