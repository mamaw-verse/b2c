<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Actions\Admin\RecordAuditLog;
use App\Models\ShopStaff;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class RemoveShopStaff
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(ShopStaff $staff, User $actor, ?string $ip = null): void
    {
        DB::transaction(function () use ($staff, $actor, $ip): void {
            $shop = $staff->shop;
            $email = $staff->email;
            $staffId = $staff->id;
            $isOwner = $shop->user_id === $actor->id;
            $action = $isOwner ? 'shop.staff.removed' : 'shop.staff.left';

            $staff->delete();

            $this->audit->handle(
                $actor,
                $action,
                $shop,
                ['email' => $email, 'staff_id' => $staffId],
                $ip
            );
        });
    }
}
