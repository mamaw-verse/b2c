<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Models\Category;
use App\Support\SeoData;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

final readonly class BuildCategoriesSitemap
{
    public function handle(): string
    {
        return Cache::remember('sitemap:categories', 3600, function (): string {
            $origin = SeoData::canonicalOrigin();
            $categories = Category::query()->orderBy('slug')->get();

            $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
            $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

            foreach ($categories as $category) {
                $loc = $origin."/categories/{$category->slug}";
                $lastmod = ($category->updated_at instanceof Carbon ? $category->updated_at : Carbon::now())->toIso8601String();

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
