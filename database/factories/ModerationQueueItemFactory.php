<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ModerationItemType;
use App\Enums\ModerationState;
use App\Models\ModerationQueueItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ModerationQueueItem>
 */
final class ModerationQueueItemFactory extends Factory
{
    protected $model = ModerationQueueItem::class;

    public function definition(): array
    {
        return [
            'target_type' => (new Product)->getMorphClass(),
            'target_id' => Product::factory(),
            'type' => $this->faker->randomElement(ModerationItemType::cases())->value,
            'state' => ModerationState::Pending->value,
            'reason_code' => null,
            'flagged_by_type' => null,
            'flagged_by_id' => null,
            'resolved_by' => null,
            'resolved_at' => null,
            'decision_reason' => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(['state' => ModerationState::Pending->value]);
    }

    public function resolved(): static
    {
        return $this->state([
            'state' => ModerationState::Resolved->value,
            'resolved_by' => User::factory(),
            'resolved_at' => now(),
            'decision_reason' => $this->faker->sentence(),
        ]);
    }

    public function halal(): static
    {
        return $this->state(['type' => ModerationItemType::Halal->value]);
    }

    public function forProduct(Product $product): static
    {
        return $this->state([
            'target_type' => $product->getMorphClass(),
            'target_id' => $product->id,
        ]);
    }
}
