<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\User;

final readonly class ShowAdminUser
{
    /**
     * @return array<string, mixed>
     */
    public function handle(User $user): array
    {
        $user->loadMissing([
            'shop:id,user_id,name,slug,status,suspended',
            'staffMembership.shop:id,name,slug,status,suspended',
        ]);
        $user->loadCount(['orders', 'reports']);

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'suspended' => $user->isSuspended(),
                'suspended_at' => $user->suspended_at?->toISOString(),
                'email_verified_at' => $user->email_verified_at?->toISOString(),
                'shop' => $user->shop === null ? null : [
                    'id' => $user->shop->id,
                    'name' => $user->shop->name,
                    'slug' => $user->shop->slug,
                    'status' => $user->shop->status->value,
                    'suspended' => (bool) $user->shop->suspended,
                ],
                'staff_at' => $user->staffMembership?->shop === null ? null : [
                    'id' => $user->staffMembership->shop->id,
                    'name' => $user->staffMembership->shop->name,
                    'slug' => $user->staffMembership->shop->slug,
                    'status' => $user->staffMembership->shop->status->value,
                    'suspended' => (bool) $user->staffMembership->shop->suspended,
                ],
                'orders_count' => $user->orders_count,
                'reports_count' => $user->reports_count,
                'created_at' => $user->created_at?->toISOString(),
            ],
        ];
    }
}
