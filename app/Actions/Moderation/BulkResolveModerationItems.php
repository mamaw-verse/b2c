<?php

declare(strict_types=1);

namespace App\Actions\Moderation;

use App\Actions\Moderation\Concerns\ResolvesQueueItem;
use App\Enums\ModerationState;
use App\Models\ModerationQueueItem;
use App\Models\User;

final readonly class BulkResolveModerationItems
{
    use ResolvesQueueItem;

    /**
     * @param  list<string>  $ids
     * @return int Number of items processed
     */
    public function handle(array $ids, string $action, User $admin, string $reason): int
    {
        $newState = match ($action) {
            'approved' => ModerationState::Resolved,
            'rejected' => ModerationState::Resolved,
            'hidden' => ModerationState::Hidden,
            'suspended' => ModerationState::Suspended,
            default => ModerationState::Resolved,
        };

        $items = ModerationQueueItem::query()
            ->with('target')
            ->whereIn('id', $ids)
            ->get();

        foreach ($items as $item) {
            $this->resolve($item, $admin, $action, $newState, $reason);
        }

        return $items->count();
    }
}
