<?php

declare(strict_types=1);

namespace App\Actions\Seo;

use App\Actions\Seo\Schema\BuildBreadcrumbNode;
use App\Actions\Seo\Schema\BuildProductNode;
use App\Actions\Seo\Schema\BuildWebPageNode;
use App\Enums\HalalStatus;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Support\Schema\SchemaGraph;
use App\Support\Schema\SchemaId;
use App\Support\SeoData;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

final readonly class BuildProductSeoData
{
    public function handle(Product $product, ?Request $request = null): SeoData
    {
        $origin = SeoData::canonicalOrigin();
        $canonical = $origin."/products/{$product->slug}";
        $shop = $product->shop;
        $category = $product->category;

        // Price formatting
        $variantParam = $request?->query('variant');
        $selectedVariant = null;
        if (is_string($variantParam) && $variantParam !== '') {
            $selectedVariant = $product->variations->first(fn (ProductVariation $v) => (string) $v->id === $variantParam || $v->option1_value === $variantParam);
        }

        $activePrice = $selectedVariant->price ?? $product->price;
        $pesos = $activePrice / 100;
        $priceStr = ($activePrice % 100 === 0)
            ? (string) ((int) $pesos)
            : number_format($pesos, 2);

        $shopName = $shop->name ?? 'HalalBenta';

        // Title <= 60 chars for <title>
        $titleSuffix = " – ₱{$priceStr} | {$shopName} | HalalBenta";
        $availableLength = max(15, 60 - mb_strlen($titleSuffix));
        $truncatedName = Str::limit($product->name, $availableLength, '…');
        $metaTitle = "{$truncatedName}{$titleSuffix}";

        // og:title up to ~90 chars, can include variant name
        $variantName = $selectedVariant !== null
            ? $selectedVariant->option1_value.($selectedVariant->option2_value ? " / {$selectedVariant->option2_value}" : '')
            : null;
        $ogName = $variantName !== null
            ? "{$product->name} ({$variantName})"
            : $product->name;
        $ogSuffix = " – ₱{$priceStr} | {$shopName} | HalalBenta";
        $ogAvailable = max(20, 90 - mb_strlen($ogSuffix));
        $ogTruncated = Str::limit($ogName, $ogAvailable, '…');
        $ogTitle = "{$ogTruncated}{$ogSuffix}";

        // Halal status label
        $halalLabel = match ($product->halal_status) {
            HalalStatus::Certified, HalalStatus::Expiring => 'Halal-certified',
            HalalStatus::NotApplicable => 'Muslim-friendly',
            default => 'Verified Halal',
        };

        // Trust facts
        $facts = ["₱{$priceStr}", $halalLabel];
        $city = $shop->city ?? $product->location;
        if ($city !== '') {
            $facts[] = "Sold by {$shopName} in {$city}";
        } else {
            $facts[] = "Sold by {$shopName}";
        }
        if ($product->free_shipping) {
            $facts[] = 'Free shipping';
        }
        $factsString = implode(' · ', $facts).'.';

        // Clean description
        $rawDesc = mb_trim(strip_tags((string) $product->description));
        $collapsedDesc = preg_replace('/\s+/', ' ', $rawDesc);
        $cleanDesc = is_string($collapsedDesc) ? mb_trim($collapsedDesc) : '';

        // Target total description 140 - 160 chars
        $targetTotal = 155;
        $factsLen = mb_strlen($factsString);
        $leadMaxLen = $targetTotal - $factsLen - 1;

        if ($cleanDesc !== '' && $leadMaxLen >= 20) {
            $words = explode(' ', $cleanDesc);
            $lead = '';
            foreach ($words as $word) {
                $candidate = $lead === '' ? $word : "{$lead} {$word}";
                if (mb_strlen($candidate) > $leadMaxLen) {
                    break;
                }
                $lead = $candidate;
            }
            $lead = mb_rtrim($lead, ".,; \t\n\r\0\x0B");
            $description = $lead !== '' ? "{$lead}. {$factsString}" : $factsString;
        } else {
            $description = $factsString;
        }

        // Resolve product photos
        $images = $product->images->pluck('url')->filter()->values()->all();
        $images = array_map(function ($url) use ($origin) {
            return Str::startsWith($url, ['http://', 'https://']) ? $url : $origin.'/'.mb_ltrim($url, '/');
        }, $images);

        // Social image: T3.2 prefers real product photography when available
        $timestamp = $product->updated_at->timestamp ?? time();
        $generatedCard = "{$origin}/social/product/{$product->slug}.jpg?v={$timestamp}";
        $preferPhoto = (bool) config('seo.prefer_photo_og.product', true);
        $socialImage = ($preferPhoto && ! empty($images))
            ? $images[0]
            : $generatedCard;

        if (empty($images)) {
            $images = [$generatedCard];
        }

        $socialImageType = 'image/jpeg';
        if (Str::endsWith(mb_strtolower($socialImage), '.png')) {
            $socialImageType = 'image/png';
        } elseif (Str::endsWith(mb_strtolower($socialImage), '.webp')) {
            $socialImageType = 'image/webp';
        }

        // Product tags
        $inStock = $product->stock > 0;
        $decimalPrice = number_format($pesos, 2, '.', '');
        $onSale = $product->was_price !== null && $product->was_price > $activePrice;
        $productMeta = [
            'price_amount' => $onSale ? number_format($product->was_price / 100, 2, '.', '') : $decimalPrice,
            'price_currency' => 'PHP',
            'availability' => $inStock ? 'in stock' : 'out of stock',
            'condition' => 'new',
            'retailer_item_id' => (string) $product->id,
            'brand' => $shopName,
            'category' => $category?->name,
            'sale_price_amount' => $onSale ? $decimalPrice : null,
        ];

        // Twitter tags
        $twitter = [
            'card' => 'summary_large_image',
            'title' => $ogTitle,
            'description' => $description,
            'image' => $socialImage,
            'image_alt' => $product->name,
            'labels' => [
                ['label' => 'Price', 'data' => "₱{$priceStr}"],
                ['label' => 'Availability', 'data' => $inStock ? 'In stock' : 'Out of stock'],
            ],
        ];

        $seller = $shop !== null
            ? ['@type' => 'Organization', '@id' => SchemaId::shop($shop->slug), 'name' => $shopName]
            : ['@type' => 'Organization', 'name' => $shopName];

        // Category ancestors (root first) feed both the breadcrumb and Product.category.
        $categoryChain = [];
        for ($node = $category, $depth = 0; $node !== null && $depth < 6; $node = $node->parent, $depth++) {
            array_unshift($categoryChain, $node);
        }

        $trail = [['name' => 'Home', 'url' => "{$origin}/"]];
        foreach ($categoryChain as $ancestor) {
            $trail[] = ['name' => $ancestor->name, 'url' => "{$origin}/categories/{$ancestor->slug}"];
        }
        $trail[] = ['name' => $product->name, 'url' => $canonical];
        $breadcrumb = resolve(BuildBreadcrumbNode::class)->handle($canonical, $trail);

        $productSchema = resolve(BuildProductNode::class)->handle(
            product: $product,
            canonical: $canonical,
            images: $images,
            fallbackDescription: $description,
            seller: $seller,
            categoryPath: array_map(fn ($c) => $c->name, $categoryChain),
            brandName: $shopName,
        );

        $graph = SchemaGraph::make()
            ->add(resolve(BuildWebPageNode::class)->handle(
                type: 'WebPage',
                url: $canonical,
                name: $product->name,
                description: $description,
                breadcrumbId: $breadcrumb['@id'],
                primaryImage: $images[0] ?? null,
                extra: ['mainEntity' => SchemaGraph::ref($productSchema['@id'])],
            ))
            ->add($breadcrumb)
            ->add($productSchema);

        return new SeoData(
            title: $metaTitle,
            description: $description,
            canonical: $canonical,
            robots: SeoData::isStaging() ? 'noindex, nofollow' : SeoData::INDEXABLE_ROBOTS,
            og: [
                'site_name' => 'HalalBenta',
                'locale' => 'en_PH',
                'type' => 'product',
                'title' => $ogTitle,
                'description' => $description,
                'url' => $canonical,
                'image' => $socialImage,
                'image_width' => 1200,
                'image_height' => 630,
                'image_alt' => $product->name,
                'image_type' => $socialImageType,
                'updated_time' => $product->updated_at?->toIso8601String(),
            ],
            twitter: $twitter,
            product: $productMeta,
            jsonLd: $graph->toArray(),
        );
    }
}
