<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\OrderItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
 * @property int $commission_bps
 * @property int $commission_amount
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['order_id', 'product_id', 'product_variation_id', 'product_name', 'variation_label', 'unit_price', 'qty', 'subtotal', 'commission_bps', 'commission_amount'])]
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

    /** @return HasMany<FulfillmentItem, $this> */
    public function fulfillmentItems(): HasMany
    {
        return $this->hasMany(FulfillmentItem::class);
    }

    public function remainingQuantity(): int
    {
        return $this->qty - (int) $this->fulfillmentItems()->sum('quantity');
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
            'commission_bps' => 'integer',
            'commission_amount' => 'integer',
        ];
    }
}
