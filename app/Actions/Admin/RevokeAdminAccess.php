<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class RevokeAdminAccess
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(User $target, User $admin, ?string $ip = null): void
    {
        DB::transaction(function () use ($target, $admin, $ip) {
            $target->update(['role' => 'buyer']);

            $this->audit->handle($admin, 'admin.revoked', $target, ['email' => $target->email], $ip);
        });
    }
}
