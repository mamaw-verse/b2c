<?php

declare(strict_types=1);

namespace App\Actions\Chat;

use App\Enums\MessageSenderRole;
use App\Enums\Workspace;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Fluent;
use Illuminate\Validation\ValidationException;

final readonly class GetMessages
{
    /**
     * @return Collection<int, Message>
     */
    public function handle(User $user, Conversation $conversation, Workspace $workspace = Workspace::Buyer): Collection
    {
        $isBuyer = $conversation->user_id === $user->id;
        $isSeller = $conversation->shop->isOperatedBy($user);

        if (! $isBuyer && ! $isSeller) {
            throw ValidationException::withMessages(['conversation' => 'Unauthorized conversation access.']);
        }

        $query = $conversation->messages()
            ->with(['product', 'order']);

        if ($workspace === Workspace::Seller) {
            $query->with('sender:id,name');
        }

        $messages = $query->get();

        if ($workspace === Workspace::Seller) {
            $shopOwnerId = $conversation->shop->user_id;

            foreach ($messages as $message) {
                if ($message->sender_role === MessageSenderRole::Seller && $message->sender !== null) {
                    $isStaff = $message->sender_id !== $shopOwnerId;
                    $message->setRelation('sender', new Fluent([
                        'id' => $message->sender->id,
                        'name' => $message->sender->name,
                        'is_staff' => $isStaff,
                    ]));
                } else {
                    $message->setRelation('sender', null);
                }
            }
        } else {
            foreach ($messages as $message) {
                $message->unsetRelation('sender');
                if ($message->sender_role === MessageSenderRole::Seller) {
                    $message->sender_id = null;
                }
            }
        }

        return $messages;
    }
}
