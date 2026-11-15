<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Seo\BuildProductsSitemap;
use App\Http\Requests\ShowSitemapProductsRequest;
use Illuminate\Http\Response;

final class SitemapProductsController
{
    public function __invoke(ShowSitemapProductsRequest $request, BuildProductsSitemap $action): Response
    {
        return response($action->handle($request->pageNumber()), 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
            'Cache-Control' => 'public, max-age=3600, s-maxage=3600',
        ]);
    }
}
