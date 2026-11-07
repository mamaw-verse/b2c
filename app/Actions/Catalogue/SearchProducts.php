<?php

declare(strict_types=1);

namespace App\Actions\Catalogue;

use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\CursorPaginator;

final readonly class SearchProducts
{
    /**
     * @param  array{q?: string, halal?: bool, free_shipping?: bool, frozen?: bool, sort?: string}  $filters
     * @return CursorPaginator<int, array<string, mixed>>
     */
    public function handle(array $filters): CursorPaginator
    {
        $paginator = Product::visible()
            ->with(['halalCertification', 'images', 'category'])
            ->when($filters['q'] ?? null, fn (Builder $q, string $term) => $q->where('name', 'ilike', '%'.str_replace(['%', '_'], '', $term).'%'))
            ->when($filters['halal'] ?? false, fn (Builder $q) => $q->where('halal_status', 'certified'))
            ->when($filters['free_shipping'] ?? false, fn (Builder $q) => $q->where('free_shipping', true))
            ->when($filters['frozen'] ?? false, fn (Builder $q) => $q->where('frozen', true))
            ->tap(fn (Builder $q) => match ($filters['sort'] ?? 'relevant') {
                'newest' => $q->latest('created_at'),
                'top_sales' => $q->orderByDesc('sold_count'),
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
