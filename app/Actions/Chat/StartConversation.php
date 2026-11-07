<?php

declare(strict_types=1);

namespace App\Actions\Chat;

use App\Enums\MessageSenderRole;
use App\Enums\MessageType;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class StartConversation
{
    public function handle(
        User $user,
        Shop $shop,
        ?string $initialMessage = null,
        ?Product $product = null
    ): Conversation {
        return DB::transaction(function () use ($user, $shop, $initialMessage, $product): Conversation {
            /** @var Conversation $conversation */
            $conversation = Conversation::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'shop_id' => $shop->id,
                ],
                [
                    'last_message_at' => now(),
                ]
            );

            if ($product !== null) {
                Message::create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $user->id,
                    'sender_role' => MessageSenderRole::Buyer,
                    'type' => MessageType::Product,
                    'product_id' => $product->id,
                ]);
            }

            if ($initialMessage !== null && mb_trim($initialMessage) !== '') {
                Message::create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $user->id,
                    'sender_role' => MessageSenderRole::Buyer,
                    'type' => MessageType::Text,
                    'body' => mb_trim($initialMessage),
                ]);
            }

            $conversation->update(['last_message_at' => now()]);

            return $conversation;
        });
    }
}
