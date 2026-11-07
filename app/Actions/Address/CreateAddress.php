<?php

declare(strict_types=1);

namespace App\Actions\Address;

use App\Models\Address;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class CreateAddress
{
    /** @param array<string, mixed> $data */
    public function handle(User $user, array $data): Address
    {
        return DB::transaction(function () use ($user, $data): Address {
            $hasExisting = Address::where('user_id', $user->id)->exists();
            $isDefault = ! $hasExisting || ($data['is_default'] ?? false);

            if ($isDefault) {
                Address::where('user_id', $user->id)->update(['is_default' => false]);
            }

            return Address::create([
                'user_id' => $user->id,
                'name' => $data['name'],
                'phone' => $data['phone'],
                'region_code' => $data['region_code'],
                'province_code' => $data['province_code'],
                'city_code' => $data['city_code'],
                'barangay_code' => $data['barangay_code'],
                'street' => $data['street'],
                'postal_code' => $data['postal_code'],
                'landmark' => $data['landmark'] ?? null,
                'label' => $data['label'] ?? 'home',
                'is_default' => $isDefault,
            ]);
        });
    }
}
