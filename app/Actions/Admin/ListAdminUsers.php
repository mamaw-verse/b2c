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
                ->with('shop:id,user_id,name,status')
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
                    'orders_count' => $user->orders_count,
                    'created_at' => $user->created_at?->toISOString(),
                ]),
        ];
    }
}
