<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use App\Models\Shop;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
final class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $name = implode(' ', (array) fake()->unique()->words(4));
        $price = fake()->numberBetween(9900, 250000);

        return [
            'shop_id' => Shop::factory(),
            'category_id' => Category::factory(),
            'name' => Str::title($name),
            'slug' => Str::slug($name),
            'description' => fake()->paragraph(),
            'price' => $price,
            'was_price' => fake()->boolean(40) ? (int) round($price * fake()->randomFloat(2, 1.1, 1.5)) : null,
            'rating' => fake()->randomFloat(1, 4.0, 5.0),
            'sold_count' => fake()->numberBetween(0, 25000),
            'location' => fake()->randomElement(['Taguig', 'Davao City', 'Quezon City', 'Zamboanga City', 'Cotabato City', 'Manila']),
            'free_shipping' => fake()->boolean(35),
            'frozen' => false,
            'halal_status' => 'na',
            'stock' => fake()->numberBetween(0, 200),
            'published' => true,
        ];
    }

    public function certified(): static
    {
        return $this->state(['halal_status' => 'certified']);
    }
}
