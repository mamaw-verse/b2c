<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderItem>
 */
final class OrderItemFactory extends Factory
{
    protected $model = OrderItem::class;

    public function definition(): array
    {
        $unitPrice = fake()->numberBetween(5000, 200000);
        $qty = fake()->numberBetween(1, 5);

        return [
            'order_id' => Order::factory(),
            'product_id' => Product::factory(),
            'product_variation_id' => null,
            'product_name' => fake()->words(4, true),
            'variation_label' => null,
            'unit_price' => $unitPrice,
            'qty' => $qty,
            'subtotal' => $unitPrice * $qty,
        ];
    }
}
