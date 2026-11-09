<?php

declare(strict_types=1);

namespace App\Actions\Voucher;

use App\Actions\Admin\RecordAuditLog;
use App\Models\Shop;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Support\Facades\DB;

final readonly class CreateVoucher
{
    public function __construct(private RecordAuditLog $audit) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(User $actor, ?Shop $shop, array $data, ?string $ip = null): Voucher
    {
        return DB::transaction(function () use ($actor, $shop, $data, $ip) {
            $voucher = Voucher::query()->create([
                ...$data,
                'shop_id' => $shop?->id,
            ]);

            $this->audit->handle($actor, 'voucher.created', $voucher, ['code' => $voucher->code, 'kind' => $voucher->kind->value], $ip);

            return $voucher;
        });
    }
}
