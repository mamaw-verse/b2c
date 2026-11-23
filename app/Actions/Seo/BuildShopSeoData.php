<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Actions\Seo\Schema\BuildBreadcrumbNode;
use App\Actions\Seo\Schema\BuildWebPageNode;
use App\Enums\ShopStatus;
use App\Models\Product;
use App\Models\Review;
use App\Models\Shop;
use App\Support\Schema\SchemaGraph;
use App\Support\Schema\SchemaId;
use App\Support\SeoData;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

final readonly class BuildShopSeoData
{
    public function handle(Shop $shop, ?Request $request = null): SeoData
    {
        $origin = SeoData::canonicalOrigin();
        $canonical = "{$origin}/shops/{$shop->slug}";

        $city = $shop->city ?? $shop->location;
        $titleLocation = $city !== '' ? " in {$city}" : '';
        $title = "{$shop->name} – Halal Shop{$titleLocation} | HalalBenta";
        $ogTitle = "{$shop->name} – Verified Halal Shop on HalalBenta";

        // Description from shop bio / description with fallback template
        $rawBio = mb_trim(strip_tags((string) ($shop->description ?? '')));
        $collapsedBio = preg_replace('/\s+/', ' ', $rawBio);
        $cleanBio = is_string($collapsedBio) ? mb_trim($collapsedBio) : '';

        if ($cleanBio !== '') {
            $description = Str::limit($cleanBio, 155, '…');
        } else {
            $sellerType = $shop->halal_only ? 'Halal-only' : 'verified Halal';
            $cityPhrase = $city !== '' ? " in {$city}" : ' in the Philippines';
            $prodCount = $shop->products()->visible()->count();
            $ratingPhrase = $shop->rating > 0 ? ' rated '.number_format((float) $shop->rating, 1).'/5' : '';
            $description = "{$shop->name} is a {$sellerType} seller{$cityPhrase} with {$prodCount} halal products{$ratingPhrase} on HalalBenta.";
        }

        // Suspended or non-approved shop must be noindex
        $isInactive = $shop->suspended || $shop->status !== ShopStatus::Approved;
        $robots = (SeoData::isStaging() || $isInactive)
            ? 'noindex, nofollow'
            : 'index, follow';

        // Social image
        $timestamp = $shop->updated_at?->timestamp ?? time();
        $socialImage = "{$origin}/social/shop/{$shop->slug}.jpg?v={$timestamp}";

        $breadcrumb = resolve(BuildBreadcrumbNode::class)->handle($canonical, [
            ['name' => 'Home', 'url' => "{$origin}/"],
            ['name' => 'Sellers', 'url' => "{$origin}/sellers"],
            ['name' => $shop->name, 'url' => $canonical],
        ]);

        // JSON-LD Store, linked to the marketplace Organization
        $storeSchema = [
            '@type' => 'Store',
            '@id' => SchemaId::shop($shop->slug),
            'name' => $shop->name,
            'url' => $canonical,
            'description' => $description,
            'image' => $socialImage,
            'logo' => ($shop->logo_url !== null && $shop->logo_url !== '') ? SeoData::absoluteUrl($shop->logo_url) : null,
            'parentOrganization' => SchemaGraph::ref(SchemaId::organization()),
            'address' => $city !== '' ? [
                '@type' => 'PostalAddress',
                'addressLocality' => $city,
                'addressCountry' => 'PH',
            ] : null,
        ];

        // Ratings come from real, visible product reviews only. Followers are not reviews.
        $reviewStats = Review::query()
            ->where('hidden', false)
            ->whereIn('product_id', Product::query()->where('shop_id', $shop->id)->select('id'))
            ->selectRaw('COUNT(*) as review_count, AVG(rating) as average_rating')
            ->toBase()
            ->first();

        $reviewCount = (int) ($reviewStats->review_count ?? 0);
        if ($reviewCount > 0) {
            $storeSchema['aggregateRating'] = [
                '@type' => 'AggregateRating',
                'ratingValue' => number_format((float) $reviewStats->average_rating, 1, '.', ''),
                'reviewCount' => $reviewCount,
                'bestRating' => 5,
                'worstRating' => 1,
            ];
        }

        $graph = SchemaGraph::make()
            ->add(resolve(BuildWebPageNode::class)->handle(
                type: 'WebPage',
                url: $canonical,
                name: $ogTitle,
                description: $description,
                breadcrumbId: $breadcrumb['@id'],
                primaryImage: $socialImage,
                extra: ['mainEntity' => SchemaGraph::ref($storeSchema['@id'])],
            ))
            ->add($breadcrumb)
            ->add($storeSchema);

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
                'image_alt' => "{$shop->name} on HalalBenta",
                'image_type' => 'image/jpeg',
            ],
            twitter: [
                'card' => 'summary_large_image',
                'title' => $ogTitle,
                'description' => $description,
                'image' => $socialImage,
                'image_alt' => "{$shop->name} on HalalBenta",
            ],
            jsonLd: $graph->toArray(),
        );
    }
}
