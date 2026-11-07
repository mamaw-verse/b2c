<?php

declare(strict_types=1);

namespace Database\Factories;

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
        ];
    }
}
