<?php

declare(strict_types=1);

namespace App\Actions\Chat;

use App\Enums\MessageSenderRole;
use App\Enums\Workspace;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

final readonly class GetConversations
{
    /**
     * Conversations where the user participates as the workspace's party:
     * the buyer inbox lists the user's own threads, the seller inbox the
     * threads addressed to their shop.
     *
     * @return Collection<int, Conversation>
     */
    public function handle(User $user, ?string $search = null, Workspace $workspace = Workspace::Buyer): Collection
    {
        $query = Conversation::query()
            ->with(['shop', 'latestMessage.product', 'latestMessage.order'])
            ->withCount([
                'messages as unread_count' => function ($query) use ($user, $workspace): void {
                    $query->whereNull('read_at');
                    if ($workspace === Workspace::Seller) {
                        $query->where('sender_role', MessageSenderRole::Buyer->value);
                    } else {
                        $query->where(function ($sub) use ($user): void {
                            $sub->where('sender_id', '!=', $user->id)
                                ->orWhereNull('sender_id');
                        });
                    }
                },
            ]);

        if ($workspace === Workspace::Seller) {
            $operatedShop = $user->operatedShop();
            if ($operatedShop === null) {
                return new Collection();
            }
            $query->where('shop_id', $operatedShop->id);
        } else {
            $query->where('user_id', $user->id);
        }

        if ($search !== null && mb_trim($search) !== '') {
            $term = '%'.mb_trim($search).'%';
            $query->whereHas('shop', function ($sq) use ($term): void {
                $sq->where('name', 'like', $term);
            });
        }

        return $query->orderByDesc('last_message_at')
            ->orderByDesc('updated_at')
            ->get();
    }
}
