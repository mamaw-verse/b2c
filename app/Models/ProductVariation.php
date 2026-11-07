<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ProductVariationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $product_id
 * @property string $option1_value
 * @property string|null $option2_value
 * @property int|null $price
 * @property int $stock
 * @property string|null $sku
 * @property int $sort_order
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['product_id', 'option1_value', 'option2_value', 'price', 'stock', 'sku', 'sort_order'])]
final class ProductVariation extends Model
{
    /** @use HasFactory<ProductVariationFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
