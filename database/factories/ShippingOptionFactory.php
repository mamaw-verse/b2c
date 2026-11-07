<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ShippingOption;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ShippingOption>
 */
final class ShippingOptionFactory extends Factory
{
    protected $model = ShippingOption::class;

    public function definition(): array
    {
        return [
            'shop_id' => null,
            'name' => fake()->randomElement(['Standard', 'Express', 'Same-day']),
            'description' => fake()->optional()->sentence(),
            'icon' => 'truck',
            'fee' => fake()->randomElement([8000, 15000, 22000]),
            'is_cold_chain' => false,
            'is_active' => true,
            'eta_days_min' => 2,
            'eta_days_max' => 5,
        ];
    }
}
