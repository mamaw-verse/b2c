<?php

declare(strict_types=1);

namespace App\Actions\Moderation;

use App\Enums\ModerationState;
use App\Models\ModerationQueueItem;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Database\Eloquent\Builder;

final readonly class ListModerationQueue
{
    /**
     * @param  array<string, mixed>  $filters
     * @return CursorPaginator<int, ModerationQueueItem>
     */
    public function handle(array $filters = []): CursorPaginator
    {
        return ModerationQueueItem::query()
            ->with(['target', 'resolvedBy'])
            ->when(
                isset($filters['state']) && $filters['state'] !== '',
                fn (Builder $q) => $q->where('state', $filters['state'])
            )
            ->when(
                isset($filters['type']) && $filters['type'] !== '',
                fn (Builder $q) => $q->where('type', $filters['type'])
            )
            ->when(
                isset($filters['sla_days']) && is_numeric($filters['sla_days']),
                fn (Builder $q) => $q->where('created_at', '<=', now()->subDays((int) $filters['sla_days']))
            )
            ->when(
                ! isset($filters['state']),
                fn (Builder $q) => $q->whereIn('state', [
                    ModerationState::Pending->value,
                    ModerationState::Flagged->value,
                ])
            )
            ->orderBy('created_at', 'asc')
            ->cursorPaginate(20);
    }
}
