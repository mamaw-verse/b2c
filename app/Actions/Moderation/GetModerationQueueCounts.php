<?php

declare(strict_types=1);

namespace App\Actions\Moderation;

use App\Enums\ModerationState;
use App\Models\ModerationQueueItem;

final readonly class GetModerationQueueCounts
{
    /**
     * @return array<string, int>
     */
    public function handle(): array
    {
        return ModerationQueueItem::whereIn('state', [
            ModerationState::Pending->value,
            ModerationState::Flagged->value,
        ])
            ->selectRaw('type, count(*) as cnt')
            ->groupBy('type')
            ->pluck('cnt', 'type')
            ->map(fn ($cnt) => (int) $cnt)
            ->all();
    }
}
