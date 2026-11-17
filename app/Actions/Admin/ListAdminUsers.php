<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\User;

final readonly class ListAdminUsers
{
    /**
     * @return array<string, mixed>
     */
    public function handle(?string $search, ?string $role, ?bool $suspended): array
    {
        return [
            'filters' => [
                'q' => $search,
                'role' => $role,
                'suspended' => $suspended,
            ],
            'users' => User::query()
                ->with(['shop:id,user_id,name,status', 'staffMemberships.shop:id,name,status'])
                ->withCount('orders')
                ->when($search, fn ($query) => $query->where(fn ($inner) => $inner
                    ->where('name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%")))
                ->when($role, fn ($query) => $query->where('role', $role))
                ->when($suspended !== null, fn ($query) => $suspended
                    ? $query->whereNotNull('suspended_at')
                    : $query->whereNull('suspended_at'))
                ->latest()
                ->limit(200)
                ->get()
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'suspended' => $user->isSuspended(),
                    'suspended_at' => $user->suspended_at?->toISOString(),
                    'shop' => $user->shop === null ? null : [
                        'name' => $user->shop->name,
                        'status' => $user->shop->status->value,
                    ],
                    // First membership, kept for existing consumers; a user may
                    // now be active staff at several shops (see staff_shops).
                    'staff_at' => $user->staffMemberships->first()?->shop === null ? null : [
                        'name' => $user->staffMemberships->first()->shop->name,
                        'status' => $user->staffMemberships->first()->shop->status->value,
                    ],
                    'staff_shops' => $user->staffMemberships
                        ->filter(fn ($m) => $m->shop !== null)
                        ->map(fn ($m) => ['name' => $m->shop->name, 'status' => $m->shop->status->value])
                        ->values()
                        ->all(),
                    'orders_count' => $user->orders_count,
                    'created_at' => $user->created_at?->toISOString(),
                ]),
        ];
    }
}
