<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\OrderItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $order_id
 * @property string $product_id
 * @property string|null $product_variation_id
 * @property string $product_name
 * @property string|null $variation_label
 * @property int $unit_price
 * @property int $qty
 * @property int $subtotal
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['order_id', 'product_id', 'product_variation_id', 'product_name', 'variation_label', 'unit_price', 'qty', 'subtotal'])]
final class OrderItem extends Model
{
    /** @use HasFactory<OrderItemFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /** @return BelongsTo<ProductVariation, $this> */
    public function variation(): BelongsTo
    {
        return $this->belongsTo(ProductVariation::class, 'product_variation_id');
    }

    /** @return HasOne<Review, $this> */
    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    protected function casts(): array
    {
        return [
            'unit_price' => 'integer',
            'qty' => 'integer',
            'subtotal' => 'integer',
        ];
    }
}
