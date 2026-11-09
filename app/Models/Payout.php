<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PayoutStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $shop_id
 * @property int $amount
 * @property PayoutStatus $status
 * @property string $method
 * @property string $account_name
 * @property string $account_number
 * @property string|null $reference
 * @property string|null $processed_by
 * @property Carbon|null $processed_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['shop_id', 'amount', 'status', 'method', 'account_name', 'account_number', 'reference', 'processed_by', 'processed_at'])]
final class Payout extends Model
{
    use HasUlids;

    /** @return BelongsTo<Shop, $this> */
    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'status' => PayoutStatus::class,
            'account_number' => 'encrypted',
            'processed_at' => 'datetime',
        ];
    }
}
