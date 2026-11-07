<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderEvent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderEvent>
 */
final class OrderEventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'title' => fake()->sentence(3),
            'detail' => fake()->sentence(6),
            'location' => fake()->city(),
        ];
    }
}
