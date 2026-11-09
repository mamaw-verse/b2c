<?php

declare(strict_types=1);

namespace App\Actions\Voucher;

use App\Actions\Admin\RecordAuditLog;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Support\Facades\DB;

final readonly class UpdateVoucher
{
    public function __construct(private RecordAuditLog $audit) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(Voucher $voucher, array $data, User $actor, ?string $ip = null): Voucher
    {
        return DB::transaction(function () use ($voucher, $data, $actor, $ip) {
            $voucher->update($data);

            $this->audit->handle($actor, 'voucher.updated', $voucher, $voucher->getChanges(), $ip);

            return $voucher;
        });
    }
}
