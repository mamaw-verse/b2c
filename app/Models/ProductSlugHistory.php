<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $product_id
 * @property string $slug
 * @property Carbon|null $created_at
 * @property-read Product|null $product
 */
#[Fillable(['product_id', 'slug'])]
final class ProductSlugHistory extends Model
{
    use HasUlids;

    public $timestamps = false;

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
