<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Enums\ShopStatus;
use App\Models\Shop;
use App\Support\SeoData;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

final readonly class BuildShopsSitemap
{
    public function handle(): string
    {
        return Cache::remember('sitemap:shops', 3600, function (): string {
            $origin = SeoData::canonicalOrigin();
            $shops = Shop::query()
                ->where('status', ShopStatus::Approved)
                ->where('suspended', false)
                ->orderBy('slug')
                ->get();

            $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
            $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

            foreach ($shops as $shop) {
                $loc = $origin."/shops/{$shop->slug}";
                $lastmod = ($shop->updated_at instanceof Carbon ? $shop->updated_at : Carbon::now())->toIso8601String();

                $xml .= "  <url>\n";
                $xml .= '    <loc>'.htmlspecialchars($loc, ENT_XML1).'</loc>'."\n";
                $xml .= '    <lastmod>'.$lastmod.'</lastmod>'."\n";
                $xml .= "  </url>\n";
            }

            $xml .= '</urlset>';

            return $xml;
        });
    }
}
