<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Actions\Admin\RecordAuditLog;
use App\Enums\ShopStaffStatus;
use App\Models\ShopStaff;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final readonly class AcceptShopStaffInvitation
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(ShopStaff $invitation, User $user, ?string $ip = null): ShopStaff
    {
        return DB::transaction(function () use ($invitation, $user, $ip): ShopStaff {
            $locked = ShopStaff::query()->lockForUpdate()->findOrFail($invitation->id);

            if ($locked->status !== ShopStaffStatus::Pending) {
                throw ValidationException::withMessages([
                    'invitation' => 'This invitation is no longer pending.',
                ]);
            }

            $locked->update([
                'user_id' => $user->id,
                'status' => ShopStaffStatus::Active,
                'accepted_at' => now(),
            ]);

            $this->audit->handle(
                $user,
                'shop.staff.accepted',
                $locked->shop,
                ['email' => $locked->email, 'staff_id' => $locked->id],
                $ip
            );

            return $locked;
        });
    }
}
