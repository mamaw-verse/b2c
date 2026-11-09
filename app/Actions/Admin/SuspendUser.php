<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class SuspendUser
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(User $target, User $admin, ?string $ip = null): void
    {
        DB::transaction(function () use ($target, $admin, $ip) {
            $target->update(['suspended_at' => now()]);

            $this->audit->handle($admin, 'user.suspended', $target, ['email' => $target->email], $ip);
        });
    }
}
