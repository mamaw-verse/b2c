<?php

declare(strict_types=1);

namespace App\Actions\Catalogue;

use App\Enums\ShopStatus;
use App\Models\Shop;
use Illuminate\Pagination\CursorPaginator;

final readonly class ListShops
{
    /** @return CursorPaginator<int, mixed> */
    public function handle(string $query = '', bool $halalOnly = false, string $sort = 'followers'): CursorPaginator
    {
        $shops = Shop::query()
            ->where('status', ShopStatus::Approved)
            ->where('suspended', false)
            ->when($query !== '', fn ($shops) => $shops->where('name', 'ilike', '%'.$query.'%'))
            ->when($halalOnly, fn ($shops) => $shops->where('halal_only', true))
            ->withCount(['products as products_count' => fn ($products) => $products->visible()])
            ->tap(fn ($shops) => match ($sort) {
                'rating' => $shops->orderByDesc('rating'),
                'newest' => $shops->orderByDesc('created_at'),
                default => $shops->orderByDesc('followers_count'),
            })
            ->orderBy('id')
            ->cursorPaginate(24)
            ->withQueryString();

        $shops->setCollection($shops->collect()->map(fn (Shop $shop): array => [
            'id' => $shop->id,
            'name' => $shop->name,
            'slug' => $shop->slug,
            'location' => $shop->location,
            'rating' => $shop->rating,
            'followers_count' => $shop->followers_count,
            'chat_response_rate' => $shop->chat_response_rate,
            'verification' => $shop->verification,
            'halal_only' => $shop->halal_only,
            'logo_url' => $shop->logo_url,
            'banner_url' => $shop->banner_url,
            'products_count' => $shop->products_count,
        ]));

        return $shops;
    }
}
