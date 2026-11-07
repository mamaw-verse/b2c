<?php

declare(strict_types=1);

namespace App\Actions\Chat;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

final readonly class GetMessages
{
    /**
     * @return Collection<int, Message>
     */
    public function handle(User $user, Conversation $conversation): Collection
    {
        $isBuyer = $conversation->user_id === $user->id;
        $isSeller = $conversation->shop->user_id === $user->id;

        if (! $isBuyer && ! $isSeller) {
            throw ValidationException::withMessages(['conversation' => 'Unauthorized conversation access.']);
        }

        return $conversation->messages()
            ->with(['product', 'order'])
            ->get();
    }
}
