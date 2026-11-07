<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\ShowProductRequest;
use App\Models\Product;
use App\Models\Review;
use Inertia\Inertia;
use Inertia\Response;

final class ProductController
{
    /**
     * Show the product detail page.
     */
    public function show(ShowProductRequest $request, Product $product): Response
    {
        $product->load(['shop', 'category', 'variations', 'images', 'halalCertification']);

        return Inertia::render('product', [
            'product' => $product->toDetail(),
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
                ->with(['halalCertification', 'images'])
                ->where('category_id', $product->category_id)
                ->whereKeyNot($product->id)
                ->orderByDesc('sold_count')
                ->limit(8)
                ->get()
                ->map->toCard()),
        ]);
    }
}
