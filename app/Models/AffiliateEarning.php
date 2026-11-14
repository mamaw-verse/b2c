<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AffiliateEarningStatus;
use Database\Factories\AffiliateEarningFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $affiliate_profile_id
 * @property string $order_id
 * @property string $order_item_id
 * @property int $amount
 * @property AffiliateEarningStatus $status
 * @property Carbon $available_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['affiliate_profile_id', 'order_id', 'order_item_id', 'amount', 'status', 'available_at'])]
final class AffiliateEarning extends Model
{
    /** @use HasFactory<AffiliateEarningFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsTo<AffiliateProfile, $this> */
    public function affiliateProfile(): BelongsTo
    {
        return $this->belongsTo(AffiliateProfile::class);
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<OrderItem, $this> */
    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'status' => AffiliateEarningStatus::class,
            'available_at' => 'datetime',
        ];
    }
}
