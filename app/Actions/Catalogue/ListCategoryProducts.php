<?php

declare(strict_types=1);

namespace App\Actions\Catalogue;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Pagination\CursorPaginator;

final readonly class ListCategoryProducts
{
    /** @return CursorPaginator<int, array<string, mixed>> */
    public function handle(Category $category, string $sort = 'relevant'): CursorPaginator
    {
        $ids = $category->children()->pluck('id')->push($category->id);

        $paginator = Product::visible()
            ->with(['halalCertification', 'images'])
            ->whereIn('category_id', $ids)
            ->tap(fn ($q) => match ($sort) {
                'newest' => $q->latest('created_at'),
                'price_asc' => $q->orderBy('price'),
                'price_desc' => $q->orderByDesc('price'),
                default => $q->orderByDesc('sold_count'),
            })
            ->orderBy('id')
            ->cursorPaginate(24)
            ->withQueryString();

        $paginator->setCollection($paginator->collect()->map(fn (Product $p): array => $p->toCard()));

        return $paginator;
    }
}
