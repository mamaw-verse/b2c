<?php

declare(strict_types=1);

namespace App\Actions\Moderation;

use App\Actions\Admin\RecordAuditLog;
use App\Actions\Moderation\Concerns\ResolvesQueueItem;
use App\Enums\ModerationState;
use App\Models\ModerationQueueItem;
use App\Models\User;

final readonly class RequestChangesOnModerationItem
{
    use ResolvesQueueItem;

    public function __construct(private RecordAuditLog $audit) {}

    public function handle(ModerationQueueItem $item, User $admin, string $reason, ?string $ip = null, string $action = 'request_changes'): ModerationQueueItem
    {
        return $this->resolve($item, $admin, $action, ModerationState::Hidden, $reason, $ip);
    }
}
