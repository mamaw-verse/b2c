<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

final readonly class RecordAuditLog
{
    /**
     * @param  array<string, mixed>  $metadata
     */
    public function handle(User $actor, string $action, ?Model $subject = null, array $metadata = [], ?string $ip = null): AuditLog
    {
        return AuditLog::query()->create([
            'actor_id' => $actor->id,
            'action' => $action,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'metadata' => $metadata === [] ? null : $metadata,
            'ip' => $ip,
        ]);
    }
}
