<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Actions\Seo\Schema\BuildBreadcrumbNode;
use App\Actions\Seo\Schema\BuildItemListNode;
use App\Actions\Seo\Schema\BuildWebPageNode;
use App\Models\Category;
use App\Models\Product;
use App\Support\Schema\SchemaGraph;
use App\Support\SeoData;
use Illuminate\Http\Request;

final readonly class BuildCategorySeoData
{
    public function handle(Category $category, int $totalCount, ?Request $request = null): SeoData
    {
        $origin = SeoData::canonicalOrigin();
        $cleanCanonical = "{$origin}/categories/{$category->slug}";

        $page = $request?->query('page');
        $pageNum = is_numeric($page) ? (int) $page : 1;

        $hasFilters = $request !== null && ($request->has('sort') || $request->has('halal') || $request->has('price_min') || $request->has('price_max'));

        if ($pageNum > 1) {
            $canonical = "{$cleanCanonical}?page={$pageNum}";
            $titleSuffix = " – Page {$pageNum}";
        } else {
            $canonical = $cleanCanonical;
            $titleSuffix = '';
        }

        $title = "{$category->name} – Shop Halal {$category->name} Online in the Philippines | HalalBenta{$titleSuffix}";
        $ogTitle = "{$category->name} – Halal {$category->name} on HalalBenta{$titleSuffix}";

        // Description fallback template: "Browse {count}+ verified halal {category} products on HalalBenta. Escrow-protected checkout and nationwide delivery in the Philippines."
        $countDisplay = $totalCount > 0 ? "{$totalCount}+" : 'hundreds of';
        $description = "Browse {$countDisplay} verified halal {$category->name} products on HalalBenta. Escrow-protected checkout and nationwide delivery in the Philippines.";

        // Robots
        $robots = (SeoData::isStaging() || $hasFilters)
            ? 'noindex, follow'
            : 'index, follow';

        // Social image
        $socialImage = "{$origin}/social/category/{$category->slug}.jpg";

        $trail = [['name' => 'Home', 'url' => "{$origin}/"]];
        if ($category->parent !== null) {
            $trail[] = ['name' => $category->parent->name, 'url' => "{$origin}/categories/{$category->parent->slug}"];
        }
        $trail[] = ['name' => $category->name, 'url' => $cleanCanonical];
        $breadcrumb = resolve(BuildBreadcrumbNode::class)->handle($canonical, $trail);

        // Fetch up to 24 products for ItemList schema
        $categoryIds = $category->descendantIds();
        $categoryIds[] = $category->id;

        $products = Product::visible()
            ->with(['images' => fn ($q) => $q->orderBy('sort_order')])
            ->whereIn('category_id', $categoryIds)
            ->orderByDesc('sold_count')
            ->limit(24)
            ->get();

        $items = [];
        foreach ($products as $product) {
            $items[] = [
                'url' => "{$origin}/products/{$product->slug}",
                'name' => $product->name,
                'image' => SeoData::absoluteUrl($product->images->firstWhere('url', '!=', '')?->url ?? "/social/product/{$product->slug}.jpg"),
            ];
        }

        $itemList = resolve(BuildItemListNode::class)->handle($canonical, $items);

        $graph = SchemaGraph::make()
            ->add(resolve(BuildWebPageNode::class)->handle(
                type: 'CollectionPage',
                url: $canonical,
                name: "Halal {$category->name}",
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
                'title' => $ogTitle,
                'description' => $description,
                'url' => $canonical,
                'image' => $socialImage,
                'image_width' => 1200,
                'image_height' => 630,
                'image_alt' => "Halal {$category->name} on HalalBenta",
                'image_type' => 'image/jpeg',
            ],
            twitter: [
                'card' => 'summary_large_image',
                'title' => $ogTitle,
                'description' => $description,
                'image' => $socialImage,
                'image_alt' => "Halal {$category->name} on HalalBenta",
            ],
            jsonLd: $graph->toArray(),
        );
    }
}
