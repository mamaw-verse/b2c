<?php

declare(strict_types=1);

namespace App\Actions\Catalogue;

use App\Models\Product;
use App\Models\Shop;
use Illuminate\Pagination\CursorPaginator;

final readonly class ListShopProducts
{
    /** @return CursorPaginator<int, array<string, mixed>> */
    public function handle(Shop $shop, string $sort = 'relevant'): CursorPaginator
    {
        $paginator = Product::visible()
            ->with(['halalCertification', 'images', 'category'])
            ->where('shop_id', $shop->id)
            ->tap(function ($q) use ($sort) {
                if ($sort === 'sale') {
                    $q->whereNotNull('was_price')->whereColumn('was_price', '>', 'price');
                }

                match ($sort) {
                    'newest' => $q->latest('created_at'),
                    'price_asc' => $q->orderBy('price'),
                    'price_desc' => $q->orderByDesc('price'),
                    default => $q->orderByDesc('sold_count'),
                };
            })
            ->orderBy('id')
            ->cursorPaginate(24)
            ->withQueryString();

        $paginator->setCollection($paginator->collect()->map(fn (Product $p): array => $p->toCard()));

        return $paginator;
    }
}
