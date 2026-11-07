<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CartItem>
 */
final class CartItemFactory extends Factory
{
    protected $model = CartItem::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'product_id' => Product::factory(),
            'product_variation_id' => null,
            'qty' => fake()->numberBetween(1, 5),
            'selected' => true,
        ];
    }
}
