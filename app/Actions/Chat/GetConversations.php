<?php

declare(strict_types=1);

namespace App\Actions\Chat;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

final readonly class GetConversations
{
    /**
     * @return Collection<int, Conversation>
     */
    public function handle(User $user, ?string $search = null): Collection
    {
        $query = Conversation::query()
            ->with(['shop', 'latestMessage.product', 'latestMessage.order'])
            ->withCount([
                'messages as unread_count' => function ($query) use ($user): void {
                    $query->whereNull('read_at')
                        ->where(function ($sub) use ($user): void {
                            $sub->where('sender_id', '!=', $user->id)
                                ->orWhereNull('sender_id');
                        });
                },
            ])
            ->where(function ($q) use ($user): void {
                $q->where('user_id', $user->id)
                    ->orWhereHas('shop', fn ($sq) => $sq->where('user_id', $user->id));
            });

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
