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
            'staffMemberships.shop:id,name,slug,status,suspended',
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
                'staff_at' => $user->staffMemberships->first()?->shop === null ? null : [
                    'id' => $user->staffMemberships->first()->shop->id,
                    'name' => $user->staffMemberships->first()->shop->name,
                    'slug' => $user->staffMemberships->first()->shop->slug,
                    'status' => $user->staffMemberships->first()->shop->status->value,
                    'suspended' => (bool) $user->staffMemberships->first()->shop->suspended,
                ],
                'staff_shops' => $user->staffMemberships
                    ->filter(fn ($m) => $m->shop !== null)
                    ->map(fn ($m) => [
                        'id' => $m->shop->id,
                        'name' => $m->shop->name,
                        'slug' => $m->shop->slug,
                        'status' => $m->shop->status->value,
                        'suspended' => (bool) $m->shop->suspended,
                    ])
                    ->values()
                    ->all(),
                'orders_count' => $user->orders_count,
                'reports_count' => $user->reports_count,
                'created_at' => $user->created_at?->toISOString(),
            ],
        ];
    }
}
