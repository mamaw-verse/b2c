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
 * @property string $fulfillment_id
 * @property string $order_item_id
 * @property int $quantity
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['fulfillment_id', 'order_item_id', 'quantity'])]
final class FulfillmentItem extends Model
{
    use HasUlids;

    /** @var list<string> */
    protected $appends = [
        'unit_price',
        'variation',
        'thumbnail_icon',
        'slug',
        'sku',
        'name',
    ];

    /** @return BelongsTo<Fulfillment, $this> */
    public function fulfillment(): BelongsTo
    {
        return $this->belongsTo(Fulfillment::class);
    }

    /** @return BelongsTo<OrderItem, $this> */
    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function getNameAttribute(): string
    {
        return $this->orderItem->product_name ?? $this->orderItem->product->name ?? 'Item';
    }

    public function getUnitPriceAttribute(): int
    {
        return $this->orderItem->unit_price ?? 0;
    }

    public function getVariationAttribute(): ?string
    {
        return $this->orderItem->variation_label
            ?? ($this->orderItem->variation ? mb_trim(($this->orderItem->variation->option1_value ?? '').' '.($this->orderItem->variation->option2_value ?? '')) : null);
    }

    public function getThumbnailIconAttribute(): string
    {
        return $this->orderItem->product->images->first()->icon ?? 'package';
    }

    public function getSlugAttribute(): ?string
    {
        return $this->orderItem?->product?->slug;
    }

    public function getSkuAttribute(): ?string
    {
        return $this->orderItem?->variation?->sku;
    }

    protected function casts(): array
    {
        return ['quantity' => 'integer'];
    }
}
