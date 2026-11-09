<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\AuditLog;

final readonly class ListAuditLogs
{
    /**
     * @return array<string, mixed>
     */
    public function handle(?string $action, ?string $subjectType): array
    {
        return [
            'filters' => [
                'action' => $action,
                'subject_type' => $subjectType,
            ],
            'actions' => AuditLog::query()->select('action')->distinct()->orderBy('action')->pluck('action'),
            'entries' => AuditLog::query()
                ->with('actor:id,name,email')
                ->when($action, fn ($query) => $query->where('action', $action))
                ->when($subjectType, fn ($query) => $query->where('subject_type', $subjectType))
                ->latest()
                ->limit(200)
                ->get()
                ->map(fn (AuditLog $log) => [
                    'id' => $log->id,
                    'actor' => $log->actor === null ? null : [
                        'name' => $log->actor->name,
                        'email' => $log->actor->email,
                    ],
                    'action' => $log->action,
                    'subject' => $log->subject_type === null ? null : [
                        'type' => class_basename($log->subject_type),
                        'id' => $log->subject_id,
                    ],
                    'metadata' => $log->metadata,
                    'ip' => $log->ip,
                    'created_at' => $log->created_at?->toISOString(),
                ]),
        ];
    }
}
