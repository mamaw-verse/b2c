<?php

declare(strict_types=1);

namespace App\Actions\Account;

use App\Enums\AffiliateProfileStatus;
use App\Models\AffiliateProfile;
use App\Models\User;
use Illuminate\Support\Str;

final readonly class ActivateAffiliateProfile
{
    public function handle(User $user): AffiliateProfile
    {
        /** @var AffiliateProfile */
        return $user->affiliateProfile()->firstOrCreate(
            [],
            [
                'code' => Str::upper(Str::random(8)),
                'status' => AffiliateProfileStatus::Active,
            ],
        );
    }
}
