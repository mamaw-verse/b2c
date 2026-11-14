<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\AffiliateProfileStatus;
use App\Models\AffiliateProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<AffiliateProfile>
 */
final class AffiliateProfileFactory extends Factory
{
    protected $model = AffiliateProfile::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'code' => Str::upper(Str::random(8)),
            'status' => AffiliateProfileStatus::Active->value,
        ];
    }

    public function suspended(): static
    {
        return $this->state(fn () => [
            'status' => AffiliateProfileStatus::Suspended->value,
        ]);
    }
}
