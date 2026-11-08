<?php

declare(strict_types=1);

namespace App\Actions\Catalogue;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\CursorPaginator;

final readonly class ListCategoryProducts
{
    /** @return CursorPaginator<int, array<string, mixed>> */
    public function handle(Category $category, string $sort = 'top_sales', bool $halalOnly = false): CursorPaginator
    {
        $paginator = $this->query($category, $halalOnly)
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

    public function total(Category $category, bool $halalOnly = false): int
    {
        return $this->query($category, $halalOnly)->count();
    }

    /** @return Builder<Product> */
    private function query(Category $category, bool $halalOnly): Builder
    {
        $ids = $category->children()->pluck('id')->push($category->id);

        return Product::visible()
            ->with(['halalCertification', 'images', 'category'])
            ->whereIn('category_id', $ids)
            ->when($halalOnly, fn ($q) => $q->where('halal_status', 'certified'));
    }
}
