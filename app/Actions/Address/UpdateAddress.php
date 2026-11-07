<?php

declare(strict_types=1);

namespace App\Actions\Address;

use App\Models\Address;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class UpdateAddress
{
    /** @param array<string, mixed> $data */
    public function handle(User $user, Address $address, array $data): Address
    {
        return DB::transaction(function () use ($user, $address, $data): Address {
            if ($data['is_default'] ?? false) {
                Address::where('user_id', $user->id)
                    ->where('id', '!=', $address->id)
                    ->update(['is_default' => false]);
            }

            $address->update($data);

            return $address;
        });
    }
}
