<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ShopStatus;
use App\Models\Shop;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Shop>
 */
final class ShopFactory extends Factory
{
    protected $model = Shop::class;

    public function definition(): array
    {
        $name = fake()->unique()->company();

        return [
            'user_id' => null,
            'name' => $name,
            'slug' => Str::slug($name),
            'location' => fake()->randomElement(['Taguig', 'Davao City', 'Quezon City', 'Zamboanga City', 'Cotabato City', 'Manila', 'Marawi City', 'Cagayan de Oro']),
            'rating' => fake()->randomFloat(1, 4.2, 5.0),
            'followers_count' => fake()->numberBetween(120, 15000),
            'chat_response_rate' => fake()->numberBetween(80, 99),
            'verification' => null,
            'halal_only' => false,
            'logo_url' => null,
            'banner_url' => null,
            'status' => ShopStatus::Approved->value,
            'contact_number' => fake()->numerify('09#########'),
            'id_type' => fake()->randomElement(['philsys', 'drivers_license', 'passport', 'national_id']),
            'id_number' => fake()->bothify('??#######'),
            'bank_name' => fake()->randomElement(['BDO', 'BPI', 'Metrobank', 'GCash', 'Maya']),
            'bank_account_name' => fake()->name(),
            'bank_account_number' => fake()->numerify('####-####-####'),
            'agreed_to_terms' => true,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ShopStatus::Pending->value,
            'submitted_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ShopStatus::Rejected->value,
            'submitted_at' => now(),
            'reviewed_at' => now(),
            'rejection_reason' => fake()->sentence(),
        ]);
    }
}
