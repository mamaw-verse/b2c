<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ReviewFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property string $order_item_id
 * @property string $user_id
 * @property string $product_id
 * @property int $rating
 * @property string|null $body
 * @property bool $anonymous
 * @property int $helpful_count
 * @property string|null $seller_reply
 * @property \Illuminate\Support\Carbon|null $seller_replied_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
#[Fillable(['order_item_id', 'user_id', 'product_id', 'rating', 'body', 'anonymous', 'helpful_count', 'seller_reply', 'seller_replied_at', 'hidden'])]
final class Review extends Model
{
    /** @use HasFactory<ReviewFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsTo<OrderItem, $this> */
    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /** @return HasMany<ReviewPhoto, $this> */
    public function photos(): HasMany
    {
        return $this->hasMany(ReviewPhoto::class)->orderBy('position');
    }

    /** @return \Illuminate\Database\Eloquent\Relations\MorphMany<Report, $this> */
    public function reports(): \Illuminate\Database\Eloquent\Relations\MorphMany
    {
        return $this->morphMany(Report::class, 'reportable');
    }

    protected function casts(): array
    {
        return [
            'anonymous' => 'boolean',
            'seller_replied_at' => 'datetime',
        ];
    }
}
