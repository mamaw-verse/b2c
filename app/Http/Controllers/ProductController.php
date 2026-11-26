<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Blog\ListBlogPostsFeaturingProduct;
use App\Actions\Catalogue\BuildProductSeoMeta;
use App\Actions\Seo\BuildProductSeoData;
use App\Http\Requests\ShowProductRequest;
use App\Models\Product;
use App\Models\Review;
use App\Support\Seo;
use Inertia\Inertia;
use Inertia\Response;

final class ProductController
{
    /**
     * Show the product detail page.
     */
    public function show(
        ShowProductRequest $request,
        Product $product,
        BuildProductSeoMeta $buildSeoMeta,
        BuildProductSeoData $buildSeoData,
        ListBlogPostsFeaturingProduct $featuredIn,
        Seo $seo
    ): Response {
        $product->load(['shop', 'category.parent', 'variations', 'images', 'halalCertification', 'video']);

        $seoData = $buildSeoData->handle($product, $request);
        $seo->set($seoData);

        $shareEnabled = (bool) config('marketplace.features.product_share_enabled', false);
        $publicMin = (int) config('marketplace.share.public_min', 5);
        $shareCount = $product->share_count >= $publicMin ? $product->share_count : null;

        return Inertia::render('product', [
            'product' => $product->toDetail(),
            'share' => [
                'enabled' => $shareEnabled,
                'url' => route('products.show', $product),
                'count' => $shareCount,
            ],
            'featured_in' => $featuredIn->handle($product),
            'reviews' => Inertia::defer(fn () => $product->reviews()
                ->with(['user', 'orderItem', 'photos'])
                ->limit(20)
                ->get()
                ->map(fn (Review $r) => [
                    'id' => $r->id,
                    'name' => $r->anonymous ? 'Anonymous' : $r->user->name,
                    'value' => $r->rating,
                    'variation' => $r->orderItem?->variation_label,
                    'date' => $r->created_at?->format('M d, Y') ?? '',
                    'text' => $r->body,
                    'photos' => $r->photos->count(),
                    'helpful' => $r->helpful_count,
                    'reply' => $r->seller_reply,
                    'anonymous' => $r->anonymous,
                ])),
            'related' => Inertia::defer(fn () => Product::visible()
                ->with(['halalCertification', 'images', 'category'])
                ->where('category_id', $product->category_id)
                ->whereKeyNot($product->id)
                ->orderByDesc('sold_count')
                ->limit(8)
                ->get()
                ->map->toCard()),
        ])->withViewData(['seo' => $seoData, 'meta' => $buildSeoMeta->handle($product)]);
    }
}
