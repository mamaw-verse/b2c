<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Support\SeoData;
use Illuminate\Http\Response;

final class RobotsController
{
    public function __invoke(): Response
    {
        $origin = SeoData::canonicalOrigin();

        if (! app()->isProduction()) {
            $content = "User-agent: *\nDisallow: /\n";
        } else {
            $content = "User-agent: *\n"
                ."Allow: /\n"
                ."Disallow: /cart\n"
                ."Disallow: /checkout\n"
                ."Disallow: /order-confirmed\n"
                ."Disallow: /account\n"
                ."Disallow: /login\n"
                ."Disallow: /register\n"
                ."Disallow: /forgot-password\n"
                ."Disallow: /seller/dashboard\n"
                ."Disallow: /admin\n"
                ."Disallow: /api\n"
                ."Disallow: /search\n"
                ."Disallow: /*?*sort=\n"
                ."Disallow: /*?*filter\n\n"
                ."Sitemap: {$origin}/sitemap.xml\n";
        }

        return response($content, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
}
