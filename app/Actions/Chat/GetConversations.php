<?php

declare(strict_types=1);

namespace App\Actions\Chat;

use App\Enums\MessageSenderRole;
use App\Enums\Workspace;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Fluent;

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
        $relations = ['shop', 'latestMessage.product', 'latestMessage.order'];
        if ($workspace === Workspace::Seller) {
            $relations[] = 'latestMessage.sender:id,name';
            $relations[] = 'user:id,name';
        }

        $query = Conversation::query()
            ->with($relations)
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
            $escaped = str_replace(['%', '_'], ['\\%', '\\_'], mb_trim($search));
            $term = '%'.$escaped.'%';
            if ($workspace === Workspace::Seller) {
                $query->whereHas('user', function ($sq) use ($term): void {
                    $sq->where('name', 'like', $term);
                });
            } else {
                $query->whereHas('shop', function ($sq) use ($term): void {
                    $sq->where('name', 'like', $term);
                });
            }
        }

        $conversations = $query->orderByDesc('last_message_at')
            ->orderByDesc('updated_at')
            ->get();

        if ($workspace === Workspace::Seller) {
            foreach ($conversations as $conversation) {
                $customer = $conversation->user;
                $conversation->setAttribute('customer', $customer !== null
                    ? ['id' => (string) $customer->id, 'name' => $customer->name]
                    : null);

                $latest = $conversation->latestMessage;
                if ($latest !== null) {
                    if ($latest->sender_role === MessageSenderRole::Seller && $latest->sender !== null) {
                        $isStaff = $latest->sender_id !== $conversation->shop->user_id;
                        $latest->setRelation('sender', new Fluent([
                            'id' => $latest->sender->id,
                            'name' => $latest->sender->name,
                            'is_staff' => $isStaff,
                        ]));
                    } else {
                        $latest->setRelation('sender', null);
                    }
                }
            }
        } else {
            foreach ($conversations as $conversation) {
                $latest = $conversation->latestMessage;
                if ($latest !== null) {
                    $latest->unsetRelation('sender');
                    if ($latest->sender_role === MessageSenderRole::Seller) {
                        $latest->sender_id = null;
                    }
                }
            }
        }

        return $conversations;
    }
}
