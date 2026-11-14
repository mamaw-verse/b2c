<?php

declare(strict_types=1);

namespace App\Actions\Seller;

use App\Actions\Admin\RecordAuditLog;
use App\Enums\ShopStaffStatus;
use App\Models\Shop;
use App\Models\ShopStaff;
use App\Models\User;
use App\Notifications\ShopStaffInvitationNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\ValidationException;

final readonly class InviteShopStaff
{
    public function __construct(private RecordAuditLog $audit) {}

    public function handle(Shop $shop, User $actor, string $email, ?string $ip = null): ShopStaff
    {
        return DB::transaction(function () use ($shop, $actor, $email, $ip): ShopStaff {
            $lockedShop = Shop::query()->lockForUpdate()->findOrFail($shop->id);

            $max = (int) config('marketplace.seller.max_staff', 2);
            $currentCount = $lockedShop->staff()
                ->whereIn('status', [ShopStaffStatus::Pending->value, ShopStaffStatus::Active->value])
                ->count();

            if ($currentCount >= $max) {
                throw ValidationException::withMessages([
                    'email' => "Your shop has reached the limit of {$max} staff members.",
                ]);
            }

            $normalizedEmail = mb_strtolower(mb_trim($email));

            $staff = $lockedShop->staff()->create([
                'email' => $normalizedEmail,
                'status' => ShopStaffStatus::Pending,
                'invited_by' => $actor->id,
                'invited_at' => now(),
            ]);

            $url = URL::temporarySignedRoute(
                'staff-invitations.show',
                now()->addDays(7),
                ['staffInvitation' => $staff->id]
            );

            Notification::route('mail', $normalizedEmail)->notify(
                new ShopStaffInvitationNotification($staff, $url)
            );

            $this->audit->handle(
                $actor,
                'shop.staff.invited',
                $lockedShop,
                ['email' => $normalizedEmail, 'staff_id' => $staff->id],
                $ip
            );

            return $staff;
        });
    }
}
