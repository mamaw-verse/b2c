<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductVariation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductVariation>
 */
final class ProductVariationFactory extends Factory
{
    protected $model = ProductVariation::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'option1_value' => fake()->word(),
            'option2_value' => null,
            'price' => null,
            'stock' => fake()->numberBetween(0, 100),
            'sort_order' => 0,
        ];
    }
}
