<?php

declare(strict_types=1);

namespace App\Models;

use App\Support\CourierTracking;
use Database\Factories\OrderEventFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $order_id
 * @property string $title
 * @property string|null $detail
 * @property string|null $location
 * @property array<string, mixed>|null $metadata
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
#[Fillable(['order_id', 'title', 'detail', 'location', 'metadata'])]
final class OrderEvent extends Model
{
    /** @use HasFactory<OrderEventFactory> */
    use HasFactory, HasUlids;

    /** @var list<string> */
    protected $appends = ['tracking_url', 'tracking_number'];

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function getTrackingNumberAttribute(): ?string
    {
        return $this->metadata['tracking_number'] ?? null;
    }

    public function getTrackingUrlAttribute(): ?string
    {
        return CourierTracking::resolve(
            $this->metadata['courier_name'] ?? null,
            $this->metadata['tracking_number'] ?? null,
            $this->metadata['tracking_url'] ?? null,
        );
    }

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }
}
