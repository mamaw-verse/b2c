<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ModerationEvent;
use App\Models\ModerationQueueItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ModerationEvent>
 */
final class ModerationEventFactory extends Factory
{
    protected $model = ModerationEvent::class;

    public function definition(): array
    {
        return [
            'moderation_queue_item_id' => ModerationQueueItem::factory(),
            'admin_id' => User::factory(),
            'action' => $this->faker->randomElement(['approved', 'rejected', 'hidden', 'suspended', 'flagged']),
            'reason' => $this->faker->optional()->sentence(),
            'meta' => null,
        ];
    }

    public function system(): static
    {
        return $this->state(['admin_id' => null, 'action' => 'auto_flagged']);
    }
}
