<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class UnsuspendUser
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(User $target, User $admin, ?string $ip = null): void
    {
        DB::transaction(function () use ($target, $admin, $ip) {
            $target->update(['suspended_at' => null]);

            $this->audit->handle($admin, 'user.unsuspended', $target, ['email' => $target->email], $ip);
        });
    }
}
