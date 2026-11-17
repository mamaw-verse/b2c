<?php

declare(strict_types=1);

namespace App\Support;

use App\Enums\Workspace;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\DB;

/**
 * The one definition of "which notifications belong to this workspace".
 * The notification list and the header unread count both go through it so
 * they can never disagree.
 *
 * - Buyer: notifications without a `workspace` key, or tagged `buyer`.
 * - Seller: tagged `seller` AND `shop_id` equal to the active shop, so a
 *   user who works in several shops only sees the current shop's alerts.
 *   With no active shop nothing matches.
 */
final class NotificationScope
{
    /**
     * @template TQuery of Builder|Relation
     *
     * @param  TQuery  $query  a notifications query (`$user->notifications()`, `unreadNotifications()`)
     * @return TQuery
     */
    public static function apply(Builder|Relation $query, Workspace $workspace, ?Shop $activeShop = null): Builder|Relation
    {
        if ($workspace === Workspace::Seller) {
            if ($activeShop === null) {
                return $query->whereRaw('1 = 0');
            }

            return $query
                ->whereRaw("data::jsonb->>'workspace' = ?", [Workspace::Seller->value])
                ->whereRaw("data::jsonb->>'shop_id' = ?", [$activeShop->id]);
        }

        return $query->whereRaw("COALESCE(data::jsonb->>'workspace', 'buyer') = ?", [$workspace->value]);
    }

    /**
     * Unread seller notifications per shop, in one grouped query, so the
     * shop switcher can flag activity in shops the user is not looking at.
     *
     * @param  array<int, string>  $shopIds
     * @return array<string, int> shop id => unread count (shops with none are absent)
     */
    public static function unreadSellerCountsByShop(User $user, array $shopIds): array
    {
        if ($shopIds === []) {
            return [];
        }

        return $user->unreadNotifications()
            ->reorder()
            ->whereRaw("data::jsonb->>'workspace' = ?", [Workspace::Seller->value])
            ->whereIn(DB::raw("data::jsonb->>'shop_id'"), $shopIds)
            ->selectRaw("data::jsonb->>'shop_id' as shop_id, count(*) as total")
            ->groupByRaw("data::jsonb->>'shop_id'")
            ->pluck('total', 'shop_id')
            ->map(fn ($total) => (int) $total)
            ->all();
    }
}
