<?php

declare(strict_types=1);

namespace App\Actions\Seo\Schema;

use App\Models\Category;
use App\Models\Product;
use App\Models\Review;
use App\Models\Shop;
use App\Support\Schema\SchemaGraph;
use App\Support\Schema\SchemaId;
use App\Support\SeoData;

/**
 * Builds the seller's `Store` node, linked to the marketplace Organization.
 *
 * Privacy: only the public storefront fields are used. Street address, postal code, contact number,
 * business permit and payout data are never emitted (there is no seller opt-in for a public address yet).
 */
final readonly class BuildShopNode
{
    private const int CATALOG_CATEGORIES = 10;

    /**
     * @return array<string, mixed>
     */
    public function handle(Shop $shop, string $canonical, string $description, string $image): array
    {
        $city = $shop->city ?? $shop->location;
        $region = $shop->state;

        $node = [
            '@type' => 'Store',
            '@id' => SchemaId::shop($shop->slug),
            'name' => $shop->name,
            'url' => $canonical,
            'description' => $description,
            'image' => $image,
            'logo' => ($shop->logo_url !== null && $shop->logo_url !== '') ? SeoData::absoluteUrl($shop->logo_url) : null,
            'parentOrganization' => SchemaGraph::ref(SchemaId::organization()),
            'areaServed' => ['@type' => 'Country', 'name' => 'Philippines'],
            'address' => $city !== '' ? [
                '@type' => 'PostalAddress',
                'addressLocality' => $city,
                'addressRegion' => $region,
                'addressCountry' => 'PH',
            ] : null,
            'hasOfferCatalog' => $this->catalog($shop),
        ];

        $reviews = $this->aggregateRating($shop);
        if ($reviews !== null) {
            $node['aggregateRating'] = $reviews;
        }

        return $node;
    }

    /**
     * Ratings come from real, visible product reviews only. Followers are not reviews.
     *
     * @return array<string, mixed>|null
     */
    private function aggregateRating(Shop $shop): ?array
    {
        $stats = Review::query()
            ->where('hidden', false)
            ->whereIn('product_id', Product::query()->where('shop_id', $shop->id)->select('id'))
            ->selectRaw('COUNT(*) as review_count, AVG(rating) as average_rating')
            ->toBase()
            ->first();

        $count = (int) ($stats->review_count ?? 0);
        if ($count === 0) {
            return null;
        }

        return [
            '@type' => 'AggregateRating',
            'ratingValue' => number_format((float) $stats->average_rating, 1, '.', ''),
            'reviewCount' => $count,
            'bestRating' => 5,
            'worstRating' => 1,
        ];
    }

    /**
     * The categories this shop actually sells in, as a catalog outline.
     *
     * @return array<string, mixed>|null
     */
    private function catalog(Shop $shop): ?array
    {
        $names = Category::query()
            ->whereIn('id', Product::query()->visible()->where('shop_id', $shop->id)->select('category_id'))
            ->orderBy('name')
            ->limit(self::CATALOG_CATEGORIES)
            ->pluck('name');

        if ($names->isEmpty()) {
            return null;
        }

        return [
            '@type' => 'OfferCatalog',
            'name' => "{$shop->name} products",
            'itemListElement' => $names
                ->map(fn (string $name): array => ['@type' => 'OfferCatalog', 'name' => $name])
                ->values()
                ->all(),
        ];
    }
}
