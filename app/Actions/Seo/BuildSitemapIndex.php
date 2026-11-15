<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Models\Product;
use App\Support\SeoData;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

final readonly class BuildSitemapIndex
{
    public function handle(): string
    {
        return Cache::remember('sitemap:index', 3600, function (): string {
            $origin = SeoData::canonicalOrigin();
            $now = Carbon::now()->toIso8601String();

            $totalProducts = Product::visible()->count();
            $productChunks = max(1, (int) ceil($totalProducts / 5000));

            $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
            $xml .= '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

            $subSitemaps = [
                $origin.'/sitemap-pages.xml',
                $origin.'/sitemap-categories.xml',
                $origin.'/sitemap-shops.xml',
            ];

            for ($i = 1; $i <= $productChunks; $i++) {
                $subSitemaps[] = $origin."/sitemap-products-{$i}.xml";
            }

            foreach ($subSitemaps as $loc) {
                $xml .= "  <sitemap>\n";
                $xml .= '    <loc>'.htmlspecialchars($loc, ENT_XML1).'</loc>'."\n";
                $xml .= '    <lastmod>'.$now.'</lastmod>'."\n";
                $xml .= "  </sitemap>\n";
            }

            $xml .= '</sitemapindex>';

            return $xml;
        });
    }
}
