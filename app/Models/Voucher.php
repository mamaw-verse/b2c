<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\DiscountType;
use App\Enums\VoucherKind;
use Database\Factories\VoucherFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string|null $shop_id
 * @property string $code
 * @property VoucherKind $kind
 * @property DiscountType $discount_type
 * @property int $discount_value
 * @property int|null $max_discount
 * @property int $min_spend
 * @property int|null $max_uses
 * @property int $used_count
 * @property Carbon|null $starts_at
 * @property Carbon|null $expires_at
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['shop_id', 'code', 'kind', 'discount_type', 'discount_value', 'max_discount', 'min_spend', 'max_uses', 'used_count', 'starts_at', 'expires_at', 'is_active'])]
final class Voucher extends Model
{
    /** @use HasFactory<VoucherFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsTo<Shop, $this> */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    protected function casts(): array
    {
        return [
            'kind' => VoucherKind::class,
            'discount_type' => DiscountType::class,
            'discount_value' => 'integer',
            'max_discount' => 'integer',
            'min_spend' => 'integer',
            'is_active' => 'boolean',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }
}
