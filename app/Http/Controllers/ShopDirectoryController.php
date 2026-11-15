<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Catalogue\ListShops;
use App\Actions\Seo\BuildSellersSeoData;
use App\Http\Requests\ListShopsRequest;
use App\Support\Seo;
use Inertia\Inertia;
use Inertia\Response;

final class ShopDirectoryController
{
    public function __invoke(
        ListShopsRequest $request,
        ListShops $shops,
        BuildSellersSeoData $buildSeoData,
        Seo $seo
    ): Response {
        $seoData = $buildSeoData->handle($request);
        $seo->set($seoData);

        return Inertia::render('sellers', [
            'query' => $request->queryText(),
            'filters' => ['halal_only' => $request->halalOnly(), 'sort' => $request->sort()],
            'shops' => Inertia::scroll(fn () => $shops->handle($request->queryText(), $request->halalOnly(), $request->sort())),
        ])->withViewData(['seo' => $seoData]);
    }
}
