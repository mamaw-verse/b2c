<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\CartItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $user_id
 * @property string $product_id
 * @property string|null $product_variation_id
 * @property int $qty
 * @property bool $selected
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['user_id', 'product_id', 'product_variation_id', 'qty', 'selected'])]
final class CartItem extends Model
{
    /** @use HasFactory<CartItemFactory> */
    use HasFactory, HasUlids;

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

    /** @return BelongsTo<ProductVariation, $this> */
    public function variation(): BelongsTo
    {
        return $this->belongsTo(ProductVariation::class, 'product_variation_id');
    }

    public function availabilityWarning(): ?string
    {
        if (! $this->product->published || ! $this->product->halal_status->visibleToBuyers()) {
            return 'Item is currently unavailable';
        }

        $stock = $this->product_variation_id === null ? $this->product->stock : $this->variation->stock;

        return match (true) {
            $stock < 1 => 'Out of stock — remove or deselect to checkout',
            $stock < $this->qty => "Only {$stock} left — reduce quantity or deselect to checkout",
            default => null,
        };
    }

    protected function casts(): array
    {
        return [
            'qty' => 'integer',
            'selected' => 'boolean',
        ];
    }
}
