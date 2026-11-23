<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Actions\Seo\Schema\BuildBreadcrumbNode;
use App\Actions\Seo\Schema\BuildItemListNode;
use App\Actions\Seo\Schema\BuildWebPageNode;
use App\Enums\ShopStatus;
use App\Models\Shop;
use App\Support\Schema\SchemaGraph;
use App\Support\Schema\SchemaId;
use App\Support\SeoData;
use Illuminate\Http\Request;

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
        $socialImage = SeoData::defaultOgImage();

        $robots = (SeoData::isStaging() || $hasSearchOrFilters)
            ? 'noindex, follow'
            : SeoData::INDEXABLE_ROBOTS;

        $breadcrumb = resolve(BuildBreadcrumbNode::class)->handle($cleanCanonical, [
            ['name' => 'Home', 'url' => "{$origin}/"],
            ['name' => 'Sellers', 'url' => $cleanCanonical],
        ]);

        // Fetch top 24 active shops for ItemList
        $activeShops = Shop::query()
            ->where('status', ShopStatus::Approved)
            ->where('suspended', false)
            ->orderByDesc('rating')
            ->limit(24)
            ->get();

        $items = [];
        foreach ($activeShops as $shop) {
            $items[] = [
                'type' => 'Store',
                'id' => SchemaId::shop($shop->slug),
                'url' => "{$origin}/shops/{$shop->slug}",
                'name' => $shop->name,
                'image' => SeoData::absoluteUrl($shop->logo_url ?? "/social/shop/{$shop->slug}.jpg"),
            ];
        }

        $itemList = resolve(BuildItemListNode::class)->handle($canonical, $items);

        $graph = SchemaGraph::make()
            ->add(resolve(BuildWebPageNode::class)->handle(
                type: 'CollectionPage',
                url: $canonical,
                name: 'Halal Sellers & Shops in the Philippines',
                description: $description,
                breadcrumbId: $breadcrumb['@id'],
                primaryImage: $socialImage,
                extra: ['mainEntity' => SchemaGraph::ref($itemList['@id'])],
            ))
            ->add($breadcrumb)
            ->add($itemList);

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
            jsonLd: $graph->toArray(),
        );
    }
}
