<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ModerationItemType;
use App\Enums\ModerationState;
use Database\Factories\ModerationQueueItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $target_type
 * @property string $target_id
 * @property ModerationItemType $type
 * @property ModerationState $state
 * @property string|null $reason_code
 * @property string|null $flagged_by_type
 * @property string|null $flagged_by_id
 * @property string|null $resolved_by
 * @property Carbon|null $resolved_at
 * @property string|null $decision_reason
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['target_type', 'target_id', 'type', 'state', 'reason_code', 'flagged_by_type', 'flagged_by_id', 'resolved_by', 'resolved_at', 'decision_reason'])]
final class ModerationQueueItem extends Model
{
    /** @use HasFactory<ModerationQueueItemFactory> */
    use HasFactory, HasUlids;

    /** @return MorphTo<Model, $this> */
    public function target(): MorphTo
    {
        return $this->morphTo();
    }

    /** @return MorphTo<Model, $this> */
    public function flaggedBy(): MorphTo
    {
        return $this->morphTo('flagged_by');
    }

    /** @return BelongsTo<User, $this> */
    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    /** @return HasMany<ModerationEvent, $this> */
    public function events(): HasMany
    {
        return $this->hasMany(ModerationEvent::class)->orderBy('created_at', 'asc');
    }

    public function isPending(): bool
    {
        return $this->state === ModerationState::Pending;
    }

    public function isResolved(): bool
    {
        return $this->state === ModerationState::Resolved;
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'type' => ModerationItemType::class,
            'state' => ModerationState::class,
            'resolved_at' => 'datetime',
        ];
    }
}
