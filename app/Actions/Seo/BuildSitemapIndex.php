<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Enums\ShopStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use App\Support\SeoData;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

final readonly class BuildSitemapIndex
{
    private const int PRODUCTS_PER_SITEMAP = 5000;

    public function handle(): string
    {
        return Cache::remember('sitemap:index', 3600, function (): string {
            $origin = SeoData::canonicalOrigin();

            $totalProducts = Product::visible()->count();
            $productChunks = max(1, (int) ceil($totalProducts / self::PRODUCTS_PER_SITEMAP));

            // lastmod is the newest real `updated_at` in each child sitemap. Static pages have
            // no modification date, so their entry omits <lastmod> rather than faking "now".
            $subSitemaps = [
                [$origin.'/sitemap-pages.xml', null],
                [$origin.'/sitemap-categories.xml', $this->toDate(Category::query()->max('updated_at'))],
                [$origin.'/sitemap-shops.xml', $this->toDate(
                    Shop::query()
                        ->where('status', ShopStatus::Approved)
                        ->where('suspended', false)
                        ->max('updated_at'),
                )],
            ];

            for ($i = 1; $i <= $productChunks; $i++) {
                $subSitemaps[] = [$origin."/sitemap-products-{$i}.xml", $this->productChunkLastmod($i)];
            }

            $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
            $xml .= '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

            foreach ($subSitemaps as [$loc, $lastmod]) {
                $xml .= "  <sitemap>\n";
                $xml .= '    <loc>'.htmlspecialchars($loc, ENT_XML1).'</loc>'."\n";
                if ($lastmod !== null) {
                    $xml .= '    <lastmod>'.$lastmod.'</lastmod>'."\n";
                }
                $xml .= "  </sitemap>\n";
            }

            return $xml.'</sitemapindex>';
        });
    }

    private function productChunkLastmod(int $page): ?string
    {
        $latest = Product::visible()
            ->orderBy('id')
            ->skip(($page - 1) * self::PRODUCTS_PER_SITEMAP)
            ->take(self::PRODUCTS_PER_SITEMAP)
            ->get(['id', 'updated_at'])
            ->max('updated_at');

        return $this->toDate($latest);
    }

    private function toDate(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return Carbon::parse($value)->toIso8601String();
    }
}
