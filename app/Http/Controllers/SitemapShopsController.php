<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Seo\BuildShopsSitemap;
use Illuminate\Http\Response;

final class SitemapShopsController
{
    public function __invoke(BuildShopsSitemap $action): Response
    {
        return response($action->handle(), 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
            'Cache-Control' => 'public, max-age=3600, s-maxage=3600',
        ]);
    }
}
