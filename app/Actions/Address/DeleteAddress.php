<?php

declare(strict_types=1);

namespace App\Actions\Address;

use App\Models\Address;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class DeleteAddress
{
    public function handle(User $user, Address $address): void
    {
        DB::transaction(function () use ($user, $address): void {
            $wasDefault = $address->is_default;
            $address->delete();

            if ($wasDefault) {
                Address::where('user_id', $user->id)
                    ->oldest()
                    ->first()
                    ?->update(['is_default' => true]);
            }
        });
    }
}
