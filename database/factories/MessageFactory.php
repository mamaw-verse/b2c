<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\MessageSenderRole;
use App\Enums\MessageType;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Message>
 */
final class MessageFactory extends Factory
{
    protected $model = Message::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'conversation_id' => Conversation::factory(),
            'sender_id' => User::factory(),
            'sender_role' => MessageSenderRole::Buyer,
            'type' => MessageType::Text,
            'body' => fake()->sentence(),
            'product_id' => null,
            'order_id' => null,
            'read_at' => null,
        ];
    }
}
