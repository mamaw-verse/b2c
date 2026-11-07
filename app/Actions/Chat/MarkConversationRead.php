<?php

declare(strict_types=1);

namespace App\Actions\Chat;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;

final readonly class MarkConversationRead
{
    public function handle(User $user, Conversation $conversation): int
    {
        return Message::where('conversation_id', $conversation->id)
            ->where(function ($query) use ($user): void {
                $query->where('sender_id', '!=', $user->id)
                    ->orWhereNull('sender_id');
            })
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }
}
