<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\LedgerEntryType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $shop_id
 * @property string|null $order_id
 * @property string|null $payout_id
 * @property LedgerEntryType $type
 * @property int $amount
 * @property Carbon $available_at
 * @property array<string, mixed>|null $metadata
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['shop_id', 'order_id', 'order_refund_id', 'payout_id', 'type', 'amount', 'available_at', 'metadata'])]
final class LedgerEntry extends Model
{
    use HasUlids;

    /** @return BelongsTo<Shop, $this> */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<OrderRefund, $this> */
    public function orderRefund(): BelongsTo
    {
        return $this->belongsTo(OrderRefund::class);
    }

    protected function casts(): array
    {
        return [
            'type' => LedgerEntryType::class,
            'amount' => 'integer',
            'available_at' => 'datetime',
            'metadata' => 'array',
        ];
    }
}
