<?php

declare(strict_types=1);

namespace App\Actions\Voucher;

use App\Actions\Admin\RecordAuditLog;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Support\Facades\DB;

final readonly class DeleteVoucher
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(Voucher $voucher, User $actor, ?string $ip = null): void
    {
        DB::transaction(function () use ($voucher, $actor, $ip) {
            $this->audit->handle($actor, 'voucher.deleted', $voucher, ['code' => $voucher->code], $ip);

            $voucher->delete();
        });
    }
}
