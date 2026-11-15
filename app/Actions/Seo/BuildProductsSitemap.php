<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Models\Product;
use App\Support\SeoData;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

final readonly class BuildProductsSitemap
{
    public function handle(int $page = 1): string
    {
        $page = max(1, $page);

        return Cache::remember("sitemap:products:{$page}", 3600, function () use ($page): string {
            $origin = SeoData::canonicalOrigin();
            $chunkSize = 5000;
            $offset = ($page - 1) * $chunkSize;

            $products = Product::visible()
                ->with(['images' => fn ($query) => $query->orderBy('sort_order')])
                ->orderBy('id')
                ->skip($offset)
                ->take($chunkSize)
                ->get();

            $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
            $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'."\n";

            foreach ($products as $product) {
                $loc = $origin."/products/{$product->slug}";
                $lastmod = ($product->updated_at instanceof Carbon ? $product->updated_at : Carbon::now())->toIso8601String();

                $xml .= "  <url>\n";
                $xml .= '    <loc>'.htmlspecialchars($loc, ENT_XML1).'</loc>'."\n";
                $xml .= '    <lastmod>'.$lastmod.'</lastmod>'."\n";

                $firstImage = $product->images->firstWhere('url', '!=', '');
                $rawImageUrl = $firstImage?->url ?? $product->thumbnailUrl();

                if ($rawImageUrl !== null && $rawImageUrl !== '') {
                    $imageLoc = Str::startsWith($rawImageUrl, ['http://', 'https://'])
                        ? $rawImageUrl
                        : $origin.'/'.mb_ltrim($rawImageUrl, '/');

                    $xml .= "    <image:image>\n";
                    $xml .= '      <image:loc>'.htmlspecialchars($imageLoc, ENT_XML1).'</image:loc>'."\n";
                    $xml .= '      <image:title>'.htmlspecialchars($product->name, ENT_XML1).'</image:title>'."\n";
                    $xml .= "    </image:image>\n";
                }

                $xml .= "  </url>\n";
            }

            $xml .= '</urlset>';

            return $xml;
        });
    }
}
