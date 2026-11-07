<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ModerationEventFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $moderation_queue_item_id
 * @property string|null $admin_id
 * @property string $action
 * @property string|null $reason
 * @property array<string, mixed>|null $meta
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['moderation_queue_item_id', 'admin_id', 'action', 'reason', 'meta'])]
final class ModerationEvent extends Model
{
    /** @use HasFactory<ModerationEventFactory> */
    use HasFactory, HasUlids;

    /** @return BelongsTo<ModerationQueueItem, $this> */
    public function queueItem(): BelongsTo
    {
        return $this->belongsTo(ModerationQueueItem::class, 'moderation_queue_item_id');
    }

    /** @return BelongsTo<User, $this> */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function isSystemAction(): bool
    {
        return $this->admin_id === null;
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'meta' => 'array',
        ];
    }
}
