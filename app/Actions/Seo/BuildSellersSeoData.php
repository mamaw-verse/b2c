<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Enums\ShopStatus;
use App\Models\Shop;
use App\Support\SeoData;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

final readonly class BuildSellersSeoData
{
    public function handle(?Request $request = null): SeoData
    {
        $origin = SeoData::canonicalOrigin();
        $cleanCanonical = "{$origin}/sellers";

        $page = $request?->query('page');
        $pageNum = is_numeric($page) ? (int) $page : 1;

        $hasSearchOrFilters = $request !== null && ($request->filled('q') || $request->has('halal_only') || $request->has('sort'));

        if ($pageNum > 1) {
            $canonical = "{$cleanCanonical}?page={$pageNum}";
            $titleSuffix = " – Page {$pageNum}";
        } else {
            $canonical = $cleanCanonical;
            $titleSuffix = '';
        }

        $title = "Halal Sellers & Shops in the Philippines | HalalBenta{$titleSuffix}";
        $description = 'Browse verified halal shops and sellers in the Philippines on HalalBenta. Official halal brands, Muslim-owned shops, and nationwide delivery.';
        $socialImage = "{$origin}/social/default-og.jpg";

        $robots = (SeoData::isStaging() || $hasSearchOrFilters)
            ? 'noindex, follow'
            : 'index, follow';

        // Breadcrumbs
        $breadcrumbs = [
            [
                '@type' => 'ListItem',
                'position' => 1,
                'name' => 'Home',
                'item' => "{$origin}/",
            ],
            [
                '@type' => 'ListItem',
                'position' => 2,
                'name' => 'Sellers',
                'item' => $cleanCanonical,
            ],
        ];

        // Fetch top 24 active shops for ItemList
        $activeShops = Shop::query()
            ->where('status', ShopStatus::Approved)
            ->where('suspended', false)
            ->orderByDesc('rating')
            ->limit(24)
            ->get();

        $itemList = [];
        $pos = 1;
        foreach ($activeShops as $shop) {
            $shopImage = $shop->logo_url ?? "{$origin}/social/shop/{$shop->slug}.jpg";
            if (! Str::startsWith($shopImage, ['http://', 'https://'])) {
                $shopImage = $origin.'/'.mb_ltrim($shopImage, '/');
            }

            $itemList[] = [
                '@type' => 'ListItem',
                'position' => $pos++,
                'url' => "{$origin}/shops/{$shop->slug}",
                'name' => $shop->name,
                'image' => $shopImage,
            ];
        }

        $jsonLd = [
            [
                '@type' => 'BreadcrumbList',
                'itemListElement' => $breadcrumbs,
            ],
            [
                '@type' => 'CollectionPage',
                'name' => 'Halal Sellers & Shops in the Philippines',
                'description' => $description,
                'url' => $canonical,
                'mainEntity' => [
                    '@type' => 'ItemList',
                    'numberOfItems' => count($itemList),
                    'itemListElement' => $itemList,
                ],
            ],
        ];

        return new SeoData(
            title: $title,
            description: $description,
            canonical: $canonical,
            robots: $robots,
            og: [
                'site_name' => 'HalalBenta',
                'locale' => 'en_PH',
                'type' => 'website',
                'title' => $title,
                'description' => $description,
                'url' => $canonical,
                'image' => $socialImage,
                'image_width' => 1200,
                'image_height' => 630,
                'image_alt' => 'Halal Sellers & Shops on HalalBenta',
                'image_type' => 'image/jpeg',
            ],
            twitter: [
                'card' => 'summary_large_image',
                'title' => $title,
                'description' => $description,
                'image' => $socialImage,
                'image_alt' => 'Halal Sellers & Shops on HalalBenta',
            ],
            jsonLd: $jsonLd,
        );
    }
}
