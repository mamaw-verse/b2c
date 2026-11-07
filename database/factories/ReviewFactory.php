<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Review>
 */
final class ReviewFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_item_id' => OrderItem::factory(),
            'user_id' => User::factory(),
            'product_id' => Product::factory(),
            'rating' => fake()->numberBetween(1, 5),
            'body' => fake()->paragraph(),
            'anonymous' => fake()->boolean(20),
            'helpful_count' => fake()->numberBetween(0, 15),
            'seller_reply' => null,
            'seller_replied_at' => null,
        ];
    }
}
