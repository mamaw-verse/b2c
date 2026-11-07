<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Models\Product;
use Illuminate\Support\Facades\DB;

final readonly class DeleteSellerProduct
{
    public function handle(Product $product): bool
    {
        return DB::transaction(function () use ($product) {
            $product->variations()->delete();
            $product->images()->delete();
            $product->halalCertifications()->delete();

            return (bool) $product->delete();
        });
    }
}
