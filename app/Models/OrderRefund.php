<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\OrderRefundFactory;
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
 * @property int $amount
 * @property string|null $reason
 * @property string $resolved_by
 * @property Carbon|null $processed_at
 * @property string|null $processed_by
 * @property string|null $reference
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['order_id', 'amount', 'reason', 'resolved_by', 'processed_at', 'processed_by', 'reference'])]
final class OrderRefund extends Model
{
    /** @use HasFactory<OrderRefundFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<User, $this> */
    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    /** @return BelongsTo<User, $this> */
    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    /** @return HasMany<OrderRefundItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(OrderRefundItem::class);
    }

    /** @return HasOne<LedgerEntry, $this> */
    public function ledgerEntry(): HasOne
    {
        return $this->hasOne(LedgerEntry::class);
    }

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'processed_at' => 'datetime',
        ];
    }
}
