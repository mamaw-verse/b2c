<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Models\Product;
use App\Models\Shop;
use Illuminate\Pagination\LengthAwarePaginator;

final readonly class ListSellerProducts
{
    /**
     * @param  array{status?: string|null, search?: string|null, category?: string|null, stock?: string|null}  $filters
     * @return LengthAwarePaginator<int, covariant array<string, mixed>>
     */
    public function handle(Shop $shop, array $filters = []): LengthAwarePaginator
    {
        $query = $shop->products()
            ->with(['category', 'halalCertification', 'images'])
            ->withCount('variations');

        if (! empty($filters['search'])) {
            $search = '%'.$filters['search'].'%';
            $query->where('name', 'like', $search);
        }

        if (! empty($filters['status'])) {
            if ($filters['status'] === 'published') {
                $query->where('published', true);
            } elseif ($filters['status'] === 'draft') {
                $query->where('published', false);
            } else {
                $query->where('halal_status', $filters['status']);
            }
        }

        if (! empty($filters['category'])) {
            $query->where('category_id', $filters['category']);
        }

        if (! empty($filters['stock']) && $filters['stock'] === 'low') {
            $query->where('stock', '<=', 10);
        }

        return $query->latest()->paginate(15)->through(fn (Product $p) => [
            'id' => $p->id,
            'slug' => $p->slug,
            'name' => $p->name,
            'category_name' => $p->category->name,
            'price' => $p->price,
            'stock' => $p->stock,
            'published' => $p->published,
            'affiliate_enabled' => (bool) $p->affiliate_enabled,
            'affiliate_commission_bps' => $p->affiliate_commission_bps,
            'halal_status' => $p->halal_status->value,
            'certifier' => $p->halalCertification?->certifying_body,
            'variations_count' => $p->variations_count,
            'image_url' => $p->images->firstWhere('url', '!=', '')?->url,
            'icon' => $p->images->first()->icon ?? 'package',
        ]);
    }
}
