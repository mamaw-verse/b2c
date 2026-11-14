<?php

declare(strict_types=1);

namespace App\Actions\Chat;

use App\Enums\MessageSenderRole;
use App\Enums\MessageType;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final readonly class SendMessage
{
    public function handle(
        User $user,
        Conversation $conversation,
        ?string $body = null,
        MessageType $type = MessageType::Text,
        ?Product $product = null,
        ?Order $order = null
    ): Message {
        $isBuyer = $conversation->user_id === $user->id;
        $isSeller = $conversation->shop->isOperatedBy($user);

        if (! $isBuyer && ! $isSeller) {
            throw ValidationException::withMessages(['conversation' => 'Unauthorized conversation access.']);
        }

        if ($type === MessageType::Text && ($body === null || mb_trim($body) === '')) {
            throw ValidationException::withMessages(['body' => 'Message text cannot be empty.']);
        }

        $senderRole = $isSeller ? MessageSenderRole::Seller : MessageSenderRole::Buyer;

        return DB::transaction(function () use (
            $conversation,
            $user,
            $senderRole,
            $type,
            $body,
            $product,
            $order
        ): Message {
            /** @var Message $message */
            $message = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $user->id,
                'sender_role' => $senderRole,
                'type' => $type,
                'body' => $body !== null ? mb_trim($body) : null,
                'product_id' => $product?->id,
                'order_id' => $order?->id,
            ]);

            $conversation->update(['last_message_at' => now()]);

            return $message;
        });
    }
}
