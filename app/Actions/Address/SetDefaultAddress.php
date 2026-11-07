<?php

declare(strict_types=1);

namespace App\Actions\Address;

use App\Models\Address;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class SetDefaultAddress
{
    public function handle(User $user, Address $address): void
    {
        DB::transaction(function () use ($user, $address): void {
            Address::where('user_id', $user->id)
                ->where('id', '!=', $address->id)
                ->update(['is_default' => false]);

            $address->update(['is_default' => true]);
        });
    }
}
