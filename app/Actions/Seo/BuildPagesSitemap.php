<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Support\SeoData;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

final readonly class BuildPagesSitemap
{
    public function handle(): string
    {
        return Cache::remember('sitemap:pages', 3600, function (): string {
            $origin = SeoData::canonicalOrigin();
            $now = Carbon::now()->toIso8601String();

            $urls = [
                $origin.'/' => $now,
                $origin.'/sellers' => $now,
                $origin.'/why-choose-us' => $now,
                $origin.'/seller/terms' => $now,
            ];

            $pages = config()->array('marketplace.pages', []);
            foreach ($pages as $key => $pageConfig) {
                if (is_array($pageConfig) && ($pageConfig['enabled'] ?? false) === true) {
                    $urls[$origin."/pages/{$key}"] = $now;
                }
            }

            $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
            $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

            foreach ($urls as $loc => $lastmod) {
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
