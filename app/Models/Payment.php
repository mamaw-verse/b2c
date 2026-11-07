<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PaymentStatus;
use Database\Factories\PaymentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $order_id
 * @property string $method
 * @property PaymentStatus $status
 * @property string|null $reference
 * @property int $amount
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['order_id', 'method', 'status', 'reference', 'amount'])]
final class Payment extends Model
{
    /** @use HasFactory<PaymentFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    protected function casts(): array
    {
        return [
            'status' => PaymentStatus::class,
            'amount' => 'integer',
        ];
    }
}
