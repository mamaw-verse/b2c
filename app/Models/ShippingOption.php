<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ShippingOptionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string|null $shop_id
 * @property string $name
 * @property string|null $description
 * @property string|null $icon
 * @property int $fee
 * @property bool $is_cold_chain
 * @property bool $is_active
 * @property int|null $eta_days_min
 * @property int|null $eta_days_max
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['shop_id', 'name', 'description', 'icon', 'fee', 'is_cold_chain', 'is_active', 'eta_days_min', 'eta_days_max'])]
final class ShippingOption extends Model
{
    /** @use HasFactory<ShippingOptionFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsTo<Shop, $this> */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    protected function casts(): array
    {
        return [
            'fee' => 'integer',
            'is_cold_chain' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
