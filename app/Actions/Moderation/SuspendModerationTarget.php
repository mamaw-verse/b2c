<?php

declare(strict_types=1);

namespace App\Actions\Moderation;

use App\Actions\Moderation\Concerns\ResolvesQueueItem;
use App\Enums\ModerationState;
use App\Models\ModerationQueueItem;
use App\Models\User;

final readonly class SuspendModerationTarget
{
    use ResolvesQueueItem;

    public function handle(ModerationQueueItem $item, User $admin, string $reason): ModerationQueueItem
    {
        return $this->resolve($item, $admin, 'suspended', ModerationState::Suspended, $reason);
    }
}
