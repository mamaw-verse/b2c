<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ShopStaffStatus;
use App\Models\Shop;
use App\Models\ShopStaff;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ShopStaff>
 */
final class ShopStaffFactory extends Factory
{
    protected $model = ShopStaff::class;

    public function definition(): array
    {
        return [
            'shop_id' => Shop::factory(),
            'user_id' => null,
            'email' => fake()->unique()->safeEmail(),
            'status' => ShopStaffStatus::Pending,
            'invited_by' => User::factory(),
            'invited_at' => now(),
            'accepted_at' => null,
        ];
    }

    public function active(): static
    {
        return $this->state([
            'user_id' => User::factory(),
            'status' => ShopStaffStatus::Active,
            'accepted_at' => now(),
        ]);
    }
}
