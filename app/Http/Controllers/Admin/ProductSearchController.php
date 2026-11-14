<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\ListAdminProductSearchRequest;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

final class ProductSearchController
{
    public function index(ListAdminProductSearchRequest $request): JsonResponse
    {
        $term = $request->queryTerm();

        if ($term === '') {
            return response()->json(['products' => []]);
        }

        $cleanTerm = '%'.str_replace(['%', '_'], '', $term).'%';

        $products = Product::query()
            ->with(['shop:id,name,slug', 'images'])
            ->where(function (Builder $query) use ($cleanTerm) {
                $query->where('name', 'ilike', $cleanTerm)
                    ->orWhere('slug', 'ilike', $cleanTerm)
                    ->orWhereHas('shop', fn (Builder $shopQuery) => $shopQuery->where('name', 'ilike', $cleanTerm));
            })
            ->limit(10)
            ->get();

        return response()->json([
            'products' => $products->map(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'price' => $p->price,
                'shop_name' => $p->shop?->name,
                'thumbnail_url' => $p->thumbnailUrl(),
            ]),
        ]);
    }
}
