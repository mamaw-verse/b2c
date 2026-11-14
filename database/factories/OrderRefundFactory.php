<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderRefund;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderRefund>
 */
final class OrderRefundFactory extends Factory
{
    protected $model = OrderRefund::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'amount' => fake()->numberBetween(1000, 50000),
            'reason' => fake()->sentence(),
            'resolved_by' => User::factory(),
            'processed_at' => null,
            'processed_by' => null,
            'reference' => null,
        ];
    }

    public function processed(?User $processor = null, ?string $reference = null): static
    {
        return $this->state(fn () => [
            'processed_at' => now(),
            'processed_by' => $processor ?? User::factory(),
            'reference' => $reference ?? 'REF-'.fake()->numerify('######'),
        ]);
    }
}
