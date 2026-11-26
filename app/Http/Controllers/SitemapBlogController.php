<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Seo\BuildBlogSitemap;
use Illuminate\Http\Response;

final class SitemapBlogController
{
    public function __invoke(BuildBlogSitemap $action): Response
    {
        return response($action->handle(), 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
            'Cache-Control' => 'public, max-age=3600, s-maxage=3600',
        ]);
    }
}
