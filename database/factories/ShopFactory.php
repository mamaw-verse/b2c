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
        $city = fake()->randomElement(['Taguig', 'Davao City', 'Quezon City', 'Zamboanga City', 'Cotabato City', 'Manila', 'Marawi City', 'Cagayan de Oro']);

        return [
            'user_id' => null,
            'name' => $name,
            'slug' => Str::slug($name),
            'location' => $city,
            'rating' => fake()->randomFloat(1, 4.2, 5.0),
            'followers_count' => fake()->numberBetween(120, 15000),
            'chat_response_rate' => fake()->numberBetween(80, 99),
            'verification' => null,
            'halal_only' => false,
            'logo_url' => null,
            'banner_url' => null,
            'status' => ShopStatus::Approved->value,
            'address_line' => fake()->streetAddress(),
            'city' => $city,
            'state' => fake()->randomElement(['Metro Manila', 'Davao del Sur', 'Zamboanga del Sur', 'Maguindanao del Norte']),
            'postal_code' => fake()->numerify('####'),
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

    public function changesRequested(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ShopStatus::ChangesRequested->value,
            'submitted_at' => now(),
            'reviewed_at' => now(),
            'rejection_reason' => fake()->sentence(),
        ]);
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'suspended' => true,
        ]);
    }
}
